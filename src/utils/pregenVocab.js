/**
 * 预生成词库：纯数据库模式。只查 static/pregen_data.db 的 vocab 表，不读任何 JSON。
 * 无全局 loadPromise / isLoaded；getPregenWord 被调用时直接开库、查库、返回。
 * 来源：trueti/sync_pregen_to_app.py --build-db 生成 pregen_data.db，vocab.english 已建 UNIQUE INDEX。
 */

import { logger } from './errorHandler.js';
const PREGEN_DB_NAME = 'pregen_db';
const PREGEN_DB_PATH = '_doc/pregen_data.db';
const PREGEN_DB_SOURCE = '_www/static/pregen_data.db';

let pregenDbOpen = false;
/** 单例保护：复制+打开只执行一次，并发调用等同一个 Promise */
let _ensureOpenPromise = null;

/** 单词详情内存缓存，避免同一词重复查 pregen DB */
const _pregenCache = new Map();
const PREGEN_CACHE_MAX = 300;

function setPregenCache(key, value) {
  if (_pregenCache.size >= PREGEN_CACHE_MAX) {
    const keys = _pregenCache.keys();
    for (let i = 0; i < 30; i++) {
      const k = keys.next().value;
      if (k !== undefined) _pregenCache.delete(k);
    }
  }
  _pregenCache.set(key, value);
}

function isApp() {
  return typeof plus !== 'undefined' && plus.sqlite;
}

/** 用原生 copyTo 复制 pregen_data.db（与 masterDb 一致，比 FileReader 快得多） */
function copyPregenDbToDoc() {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      logger.error('[pregenVocab] 复制超时');
      resolve(false);
    }, 15000);
    const cleanup = (res) => { clearTimeout(timer); resolve(res); };
    if (typeof plus === 'undefined' || !plus.io) return cleanup(false);
    plus.io.resolveLocalFileSystemURL(PREGEN_DB_SOURCE, (entry) => {
      plus.io.resolveLocalFileSystemURL('_doc/', (dir) => {
        entry.copyTo(dir, 'pregen_data.db',
          () => { logger.debug('[pregenVocab] copyTo 完成'); cleanup(true); },
          (err) => { logger.error('[pregenVocab] copyTo 失败', err); cleanup(false); }
        );
      }, (e) => { logger.error('[pregenVocab] 解析 _doc 失败', e); cleanup(false); });
    }, (e) => { logger.error('[pregenVocab] 解析源文件失败', e); cleanup(false); });
  });
}

/** 单例初始化：整个 App 生命周期只复制+打开一次 */
function ensureOpen() {
  if (pregenDbOpen) return Promise.resolve(true);
  if (_ensureOpenPromise) return _ensureOpenPromise;
  if (!isApp()) return Promise.resolve(false);
  _ensureOpenPromise = copyPregenDbToDoc().then((copied) => {
    if (!copied) return false;
    return new Promise((resolve) => {
      // 若已打开直接返回
      try {
        if (plus.sqlite.isOpenDatabase({ name: PREGEN_DB_NAME, path: PREGEN_DB_PATH })) {
          pregenDbOpen = true;
          _ensureOpenPromise = null;
          return resolve(true);
        }
      } catch (_) {}
      plus.sqlite.openDatabase({
        name: PREGEN_DB_NAME,
        path: PREGEN_DB_PATH,
        success: () => {
          pregenDbOpen = true;
          logger.debug('[pregenVocab] pregen_data.db 已打开');
          plus.sqlite.executeSql({
            name: PREGEN_DB_NAME,
            sql: 'CREATE UNIQUE INDEX IF NOT EXISTS idx_english ON vocab(english)',
            success: () => { _ensureOpenPromise = null; resolve(true); },
            fail: () => { _ensureOpenPromise = null; resolve(true); },
          });
        },
        fail: (e) => {
          logger.error('[pregenVocab] openDatabase 失败', e);
          _ensureOpenPromise = null;
          resolve(false);
        },
      });
    });
  }).catch(() => { _ensureOpenPromise = null; return false; });
  return _ensureOpenPromise;
}

/** 将 pregen DB 的一行记录解析为标准结构，避免重复的 JSON.parse 三连 */
function parsePregenRow(r) {
  let examples = [], synonyms = [], antonyms = [];
  try { if (r.examples) examples = JSON.parse(r.examples); } catch (_) {}
  try { if (r.synonyms) synonyms = JSON.parse(r.synonyms); } catch (_) {}
  try { if (r.antonyms) antonyms = JSON.parse(r.antonyms); } catch (_) {}
  return {
    chinese: (r.chinese || '').trim(),
    examples: Array.isArray(examples) ? examples : [],
    synonyms: Array.isArray(synonyms) ? synonyms : [],
    antonyms: Array.isArray(antonyms) ? antonyms : [],
  };
}

/** 将字符串转为带外层引号的 SQL 安全字面量 */
function sqlLiteralStr(value) {
  if (value === null || value === undefined) return 'NULL';
  return `'${String(value).replace(/'/g, "''")}'`;
}

/**
 * 纯数据库查询：被调用时直接打开 SQLite、执行 SELECT、返回。不等待任何全局初始化状态。
 * @param {string} english 英文单词
 * @returns {Promise<{ chinese: string, examples: Array, synonyms: Array, antonyms: Array }|null>}
 */
export function getPregenWord(english) {
  if (!english || typeof english !== 'string') return Promise.resolve(null);
  const key = english.trim().toLowerCase();
  if (!key) return Promise.resolve(null);
  if (!isApp()) return Promise.resolve(null);
  // 内存缓存命中直接返回
  if (_pregenCache.has(key)) return Promise.resolve(_pregenCache.get(key));
  return ensureOpen().then((ok) => {
    if (!ok) return null;
    return new Promise((resolve) => {
      const sql = `SELECT * FROM vocab WHERE english = ${sqlLiteralStr(key)} LIMIT 1`;
      try {
        plus.sqlite.selectSql({
          name: PREGEN_DB_NAME,
          sql,
          success: (rows) => {
            try {
              if (!rows || rows.length === 0) {
                setPregenCache(key, null);
                resolve(null);
                return;
              }
              const result = parsePregenRow(rows[0]);
              setPregenCache(key, result);
              resolve(result);
            } catch (err) {
              logger.error('getPregenWord 解析结果异常', err);
              resolve(null);
            }
          },
          fail: (e) => {
            logger.error('pregen selectSql 失败', e);
            resolve(null);
          },
        });
      } catch (err) {
        logger.error('getPregenWord selectSql 调用异常', err);
        resolve(null);
      }
    });
  });
}

/**
 * 批量查询多个单词的预生成数据（用于首页列表补全）
 * @param {string[]} englishList 英文单词列表，会转小写
 * @returns {Promise<Object>} { "word_lower": { chinese, examples, synonyms, antonyms }, ... }
 */
export function getPregenWordsBatch(englishList) {
  if (!Array.isArray(englishList) || englishList.length === 0) return Promise.resolve({});
  const keys = [...new Set(englishList.map((w) => (w || '').trim().toLowerCase()).filter(Boolean))];
  if (keys.length === 0) return Promise.resolve({});
  if (!isApp()) return Promise.resolve({});
  return ensureOpen().then((ok) => {
    if (!ok) return {};
    return new Promise((resolve) => {
      const safeKeys = keys.map((k) => sqlLiteralStr(k));
      const inClause = safeKeys.slice(0, 500).join(',');
      const sql = `SELECT * FROM vocab WHERE english IN (${inClause})`;
      plus.sqlite.selectSql({
        name: PREGEN_DB_NAME,
        sql,
        success: (rows) => {
          const out = {};
          if (!rows || !rows.length) {
            resolve(out);
            return;
          }
          for (const r of rows) {
            const english = (r.english || '').trim().toLowerCase();
            if (!english) continue;
            out[english] = parsePregenRow(r);
          }
          resolve(out);
        },
        fail: () => resolve({}),
      });
    });
  });
}

/** 已废弃：不再全量加载 JSON，返回空；首页补全请用 getPregenWordsBatch(englishList) */
export function loadPregenVocab() {
  return Promise.resolve(null);
}

/**
 * 获取一批单词的预生成数据作为“缓存”对象，供首页 enrich 使用
 * @param {string[]} englishList 当前列表中的英文单词
 * @returns {Promise<Object>} { "word_lower": { chinese, examples, synonyms, antonyms }, ... }
 */
export async function getPregenVocabCache(englishList) {
  if (Array.isArray(englishList) && englishList.length > 0) {
    return getPregenWordsBatch(englishList);
  }
  return {};
}
