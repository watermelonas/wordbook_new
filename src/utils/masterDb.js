/**
 * 统一数据源：vocal_master.db 按需查询，不加载大 JSON。
 * 单例初始化：复制+打开在整个 App 生命周期内只执行一次，避免多点词触发多次复制导致 IO 锁死。
 */

import { logger } from './errorHandler.js';
/** 查询时 name/path 必须与 openDatabase 完全一致，否则 selectSql 会挂起或报错 */
const MASTER_DB_NAME = 'master_db';
const MASTER_DB_PATH = '_doc/vocal_master.db';
const MASTER_DB_SOURCE = '_www/static/vocal_master.db';
const MASTER_DB_VERSION = 4;
const MASTER_DB_VERSION_KEY = 'vocal_master_db_version';

let masterDbOpen = false;
/** 关键：缓存初始化 Promise，保证复制+打开只执行一次，后续请求只 await 同一 Promise */
let initPromise = null;
let repairPromise = null;

function isApp() {
  return typeof plus !== 'undefined' && plus.sqlite;
}

/** 兼容部分环境返回列名大小写不一致，统一为小写键 */
function normalizeRow(r) {
  if (!r || typeof r !== 'object') return r;
  const out = {};
  for (const k of Object.keys(r)) out[k.toLowerCase()] = r[k];
  return out;
}

/** 检查 _doc 下是否已有 vocal_master.db，避免重复复制 */
function checkDocDbExists() {
  return new Promise((resolve) => {
    if (typeof plus === 'undefined' || !plus.io) {
      resolve(false);
      return;
    }
    plus.io.resolveLocalFileSystemURL(MASTER_DB_PATH, () => resolve(true), () => resolve(false));
  });
}

function getStoredDbVersion() {
  try {
    return Number(uni.getStorageSync(MASTER_DB_VERSION_KEY) || 0);
  } catch (_) {
    return 0;
  }
}

function setStoredDbVersion(version) {
  try {
    uni.setStorageSync(MASTER_DB_VERSION_KEY, Number(version) || 0);
  } catch (_) {}
}

function rawSelectSqlRows(sql) {
  return new Promise((resolve) => {
    plus.sqlite.selectSql({
      name: MASTER_DB_NAME,
      sql,
      success: (rows) => resolve(rows || []),
      fail: (e) => {
        logger.error('[masterDb] selectSql 失败', e);
        resolve({ __error: e, __rows: [] });
      },
    });
  });
}

function isMissingExamTableError(err) {
  const msg = String((err && (err.message || err.errMsg)) || '').toLowerCase();
  return (
    Number(err && err.code) === -1404 &&
    (msg.includes('no such table: word_exam_stats') ||
      msg.includes('no such table: word_exam_sentences') ||
      msg.includes('no such table: word_exam_'))
  );
}

async function validateMasterSchema() {
  if (!isApp()) return false;
  const rows = await rawSelectSqlRows(
    "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('vocab_master','word_exam_stats','word_exam_sentences')"
  );
  if (!Array.isArray(rows)) return false;
  const names = rows.map((row) => String((normalizeRow(row) || {}).name || '').trim());
  return names.includes('vocab_master') && names.includes('word_exam_stats') && names.includes('word_exam_sentences');
}

async function repairMasterDbFromStatic() {
  if (repairPromise) return repairPromise;
  repairPromise = (async () => {
    logger.warn('[masterDb] 检测到主库缺表，开始强制重建 _doc 主库副本');
    masterDbOpen = false;
    initPromise = null;
    await closeMasterDbIfOpen();
    const copied = await copyMasterDbToDoc(true);
    if (!copied) {
      logger.error('[masterDb] 强制重拷贝主库失败');
      return false;
    }
    masterDbOpen = false;
    initPromise = null;
    const reopened = await initMasterDb();
    if (!reopened) return false;
    const schemaOk = await validateMasterSchema();
    if (!schemaOk) {
      logger.error('[masterDb] 重建后仍缺少必要数据表');
      return false;
    }
    logger.debug('[masterDb] 主库缺表自愈完成');
    return true;
  })().finally(() => {
    repairPromise = null;
  });
  return repairPromise;
}

function closeMasterDbIfOpen() {
  return new Promise((resolve) => {
    try {
      const isOpen = plus.sqlite.isOpenDatabase({
        name: MASTER_DB_NAME,
        path: MASTER_DB_PATH,
      });
      if (!isOpen) {
        masterDbOpen = false;
        resolve(true);
        return;
      }
      plus.sqlite.closeDatabase({
        name: MASTER_DB_NAME,
        success: () => {
          masterDbOpen = false;
          resolve(true);
        },
        fail: () => {
          masterDbOpen = false;
          resolve(false);
        },
      });
    } catch (_) {
      masterDbOpen = false;
      resolve(false);
    }
  });
}

function removeDocDbFile() {
  return new Promise((resolve) => {
    if (typeof plus === 'undefined' || !plus.io) {
      resolve(false);
      return;
    }
    plus.io.resolveLocalFileSystemURL(
      MASTER_DB_PATH,
      (entry) => {
        entry.remove(() => resolve(true), () => resolve(false));
      },
      () => resolve(true)
    );
  });
}

/** 极致优化版：强行原生态复制 + 强制超时，防止 Promise 永不 resolve */
function copyMasterDbToDoc(forceReplace = false) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      logger.error('[masterDb] 复制操作超时，强制退出');
      resolve(false);
    }, 15000);

    const cleanup = (res) => {
      clearTimeout(timer);
      resolve(res);
    };

    if (typeof plus === 'undefined' || !plus.io) return cleanup(false);

    logger.debug('[masterDb] 准备从:', MASTER_DB_SOURCE);
    const doCopy = () => {
      plus.io.resolveLocalFileSystemURL(MASTER_DB_SOURCE, (entry) => {
        plus.io.resolveLocalFileSystemURL('_doc/', (dir) => {
          entry.copyTo(dir, 'vocal_master.db', () => {
            logger.debug('[masterDb] 原生 copyTo 物理完成！');
            cleanup(true);
          }, (err) => {
            logger.error('[masterDb] copyTo 失败:', err);
            cleanup(false);
          });
        }, (e) => {
          logger.error('[masterDb] 解析 _doc 失败', e);
          cleanup(false);
        });
      }, (e) => {
        logger.error('[masterDb] 解析源文件失败，请确认 MASTER_DB_SOURCE 路径正确:', e);
        cleanup(false);
      });
    };

    if (!forceReplace) {
      doCopy();
      return;
    }
    closeMasterDbIfOpen()
      .then(() => removeDocDbFile())
      .then(() => doCopy())
      .catch(() => cleanup(false));
  });
}

/**
 * 单例初始化：整个 App 运行期间只执行一次复制+打开，多次调用返回同一 Promise。
 * 先检查 _doc 下文件是否存在，不存在才复制，再 openDatabase。
 */
function initMasterDb() {
  if (masterDbOpen) {
    logger.debug('[masterDb] 主库已打开，直接返回');
    return Promise.resolve(true);
  }
  if (initPromise) {
    logger.debug('[masterDb] 初始化进行中，等待同一 Promise（避免重复复制）');
    return initPromise;
  }
  if (!isApp()) return Promise.resolve(false);

  logger.debug('[masterDb] 首次初始化：复制并打开主库（仅此一次）');
  const initWork = checkDocDbExists().then((exists) => {
    const shouldForceReplace = getStoredDbVersion() !== MASTER_DB_VERSION;
    if (exists) {
      if (!shouldForceReplace) {
        logger.debug('[masterDb] _doc 下已存在 vocal_master.db 且版本匹配，跳过复制');
        return true;
      }
      logger.debug('[masterDb] 检测到主库版本变更，开始刷新 _doc/vocal_master.db');
      return copyMasterDbToDoc(true).then((copied) => {
        if (copied) logger.debug('[masterDb] 主库刷新完成');
        else logger.warn('[masterDb] 主库刷新失败');
        return copied;
      });
    }
    logger.debug('[masterDb] 目标文件不存在，开始从 static 复制 22MB...');
    return copyMasterDbToDoc().then((copied) => {
      if (copied) logger.debug('[masterDb] 复制完成');
      else logger.warn('[masterDb] 复制未成功');
      return copied;
    });
  }).then((ready) => {
    if (!ready) return false;
    return new Promise((resolve) => {
      const isOpen = plus.sqlite.isOpenDatabase({
        name: MASTER_DB_NAME,
        path: MASTER_DB_PATH,
      });
      if (isOpen) {
        logger.debug('[masterDb] 检测到数据库已在打开状态，直接进入查询阶段');
        masterDbOpen = true;
        return resolve(true);
      }

      plus.sqlite.openDatabase({
        name: MASTER_DB_NAME,
        path: MASTER_DB_PATH,
        success: async () => {
          masterDbOpen = true;
          logger.debug('[masterDb] 数据库真正打开成功！name=', MASTER_DB_NAME, 'path=', MASTER_DB_PATH);
          logger.debug('[masterDb] 库已就绪，开始执行挂起的查询');
          plus.sqlite.executeSql({
            name: MASTER_DB_NAME,
            sql: 'CREATE UNIQUE INDEX IF NOT EXISTS idx_word ON vocab_master(english)',
            success: async () => {
              logger.debug('[masterDb] idx_word 索引已确保');
              setStoredDbVersion(MASTER_DB_VERSION);
              const schemaOk = await validateMasterSchema();
              if (!schemaOk) {
                const repaired = await repairMasterDbFromStatic();
                resolve(repaired);
                return;
              }
              resolve(true);
            },
            fail: async (e) => {
              logger.warn('[masterDb] 创建索引失败(可忽略)', e);
              setStoredDbVersion(MASTER_DB_VERSION);
              const schemaOk = await validateMasterSchema();
              if (!schemaOk) {
                const repaired = await repairMasterDbFromStatic();
                resolve(repaired);
                return;
              }
              resolve(true);
            },
          });
        },
        fail: (e) => {
          const code = e && e.code;
          const msg = (e && (e.message || e.errMsg)) || '';
          if (code === -1402 || (typeof msg === 'string' && msg.includes('Already Open'))) {
            logger.debug('[masterDb] 忽略 -1402 错误（库已打开），继续执行');
            masterDbOpen = true;
            setStoredDbVersion(MASTER_DB_VERSION);
            return resolve(true);
          }
          logger.error('[masterDb] openDatabase 失败', e);
          initPromise = null;
          if (typeof uni !== 'undefined' && uni.showModal) {
            uni.showModal({ title: '主库打开失败', content: msg || JSON.stringify(e), showCancel: false });
          }
          resolve(false);
        },
      });
    });
  }).catch((e) => {
    logger.error('[masterDb] initMasterDb 异常', e);
    initPromise = null;
    return false;
  });

  const timeoutMs = 30000;
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      if (!masterDbOpen) {
        logger.error('[masterDb] 初始化超时', timeoutMs, 'ms');
        initPromise = null;
        if (typeof uni !== 'undefined' && uni.showModal) {
          uni.showModal({
            title: '主库初始化超时',
            content: timeoutMs / 1000 + ' 秒内未完成复制或打开，请检查 static 下是否有 vocal_master.db，或稍后重试。',
            showCancel: false,
          });
        }
        reject(new Error('主库初始化超时'));
      }
    }, timeoutMs);
  });

  initPromise = Promise.race([initWork, timeoutPromise]).then((v) => v, () => false);
  return initPromise;
}

/** 对外保持原名，内部改为单例 init */
export function ensureMasterOpen() {
  return initMasterDb();
}

/**
 * 将任意值转为 SQL 安全字面量（与 db.js 的 sqlLiteral 保持一致）。
 * - null/undefined  -> NULL
 * - 数字            -> 数字字符串
 * - 布尔            -> 1/0
 * - 字符串          -> 单引号包裹，内部单引号转义为 ''
 * 注意：调用方需自行在拼接时加外层单引号（或直接用 sqlLiteralQuoted）
 */
function safeSqlValue(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '';
  if (typeof value === 'boolean') return value ? '1' : '0';
  return String(value).replace(/'/g, "''");
}

/** 返回带外层单引号的完整 SQL 字面量，用于字符串字段拼接 */
function sqlLiteralStr(value) {
  if (value === null || value === undefined) return 'NULL';
  return `'${safeSqlValue(String(value))}'`;
}

function selectSqlRows(sql) {
  return rawSelectSqlRows(sql).then(async (result) => {
    if (Array.isArray(result)) return result;
    const err = result && result.__error;
    if (isMissingExamTableError(err)) {
      const repaired = await repairMasterDbFromStatic();
      if (repaired) {
        const retry = await rawSelectSqlRows(sql);
        return Array.isArray(retry) ? retry : [];
      }
    }
    return [];
  });
}

function parseJsonSafe(raw, fallback) {
  try {
    const data = typeof raw === 'string' ? JSON.parse(raw || '') : raw;
    return data == null ? fallback : data;
  } catch (_) {
    return fallback;
  }
}

function normalizeDefType(rawType) {
  const value = String(rawType || '').trim().toLowerCase();
  if (!value) return 'normal';
  if ([
    'freq',
    'important',
    'important_meaning',
    'importantmeaning',
    '重点',
    '重点义',
    '重要',
    '重要义',
    '重要意思',
    '常考',
    '高频',
  ].includes(value)) {
    return 'freq';
  }
  if ([
    'rare',
    'rare_meaning',
    'raremeaning',
    '僻义',
    '熟词僻义',
    '熟词生义',
    '生义',
  ].includes(value)) {
    return 'rare';
  }
  return 'normal';
}

function normalizeDefs(defs) {
  if (!Array.isArray(defs)) return [];
  return defs
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const pos = String(item.pos || '').trim();
      const trans = String(item.trans || '').trim();
      if (!trans) return null;
      return {
        ...item,
        pos,
        trans,
        type: normalizeDefType(item.type),
      };
    })
    .filter(Boolean);
}

function buildChineseFromDefs(defs, fallback = '') {
  if (!Array.isArray(defs) || defs.length === 0) return fallback || '';
  const parts = [];
  for (const d of defs) {
    if (!d || typeof d !== 'object') continue;
    const pos = String(d.pos || '').trim();
    const trans = String(d.trans || '').trim();
    if (!trans) continue;
    parts.push(pos ? `${pos} ${trans}` : trans);
    if (parts.length >= 4) break;
  }
  return parts.length ? parts.join('；') : (fallback || '');
}

function parseCoreRow(row) {
  const nr = normalizeRow(row || {});
  const data = parseJsonSafe(nr.data_json, {}) || {};
  const defs = normalizeDefs(data.defs);
  return {
    english: (nr.english || '').trim().toLowerCase(),
    chinese: buildChineseFromDefs(defs, (nr.chinese || '').trim()),
    examples: Array.isArray(data.examples) ? data.examples : [],
    synonyms: Array.isArray(data.synonyms) ? data.synonyms : [],
    antonyms: Array.isArray(data.antonyms) ? data.antonyms : [],
    defs,
    exam_tip: typeof data.exam_tip === 'string' ? data.exam_tip : '',
    sentiment: (data.sentiment === 'pos' || data.sentiment === 'neg' || data.sentiment === 'neu') ? data.sentiment : 'neu',
    data_json: {
      ...data,
      defs,
    },
  };
}

function parseExamStatsRow(row) {
  if (!row) return null;
  const nr = normalizeRow(row);
  const years = parseJsonSafe(nr.years_json, []);
  const byYear = parseJsonSafe(nr.by_year_json, {});
  const bySection = parseJsonSafe(nr.by_section_json, {});
  const positions = parseJsonSafe(nr.positions_json, []);
  const tags = parseJsonSafe(nr.tags_json, []);
  return {
    total_count: Number(nr.total_count) || 0,
    years: Array.isArray(years) ? years : [],
    by_year: byYear && typeof byYear === 'object' ? byYear : {},
    by_section: bySection && typeof bySection === 'object' ? bySection : {},
    positions: Array.isArray(positions) ? positions : [],
    importance: nr.importance != null ? (Number(nr.importance) || 0) : 0,
    tags: Array.isArray(tags) ? tags : [],
  };
}

function parseExamSentenceRows(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return [];
  return rows.map((row) => {
    const nr = normalizeRow(row);
    return {
      year: nr.year || '',
      section: nr.section || '',
      exam_type: nr.exam_type || '',
      sentence: nr.sentence || '',
    };
  }).filter((item) => (item.sentence || '').trim());
}

/**
 * 按 english 查询一条完整数据。先 await 单例初始化，再 selectSql。
 */
export async function getWordFullDetail(word) {
  if (!word || typeof word !== 'string') return null;
  const english = word.trim().toLowerCase();
  if (!english) return null;
  if (!isApp()) return null;
  // 内存缓存命中直接返回，避免翻页重复查询
  if (wordDetailCache.has(english)) return wordDetailCache.get(english);
  logger.debug('[masterDb] 收到查询请求:', english);
  try {
    await initMasterDb();
    const isOpen = plus.sqlite.isOpenDatabase && plus.sqlite.isOpenDatabase({ name: MASTER_DB_NAME, path: MASTER_DB_PATH });
    if (!isOpen) {
      logger.error('[masterDb] 主库未打开');
      return null;
    }
    const safe = sqlLiteralStr(english);
    const [coreRows, statsRows, sentenceRows] = await Promise.all([
      selectSqlRows(`SELECT english, chinese, data_json FROM vocab_master WHERE english = ${safe} LIMIT 1`),
      selectSqlRows(`SELECT * FROM word_exam_stats WHERE english = ${safe} LIMIT 1`),
      selectSqlRows(`SELECT year, section, exam_type, sentence FROM word_exam_sentences WHERE english = ${safe} ORDER BY year, id`),
    ]);
    logger.debug('[masterDb] 查询结果返回！core=', coreRows.length, 'stats=', statsRows.length, 'sentences=', sentenceRows.length);
    if ((!coreRows || coreRows.length === 0) && (!statsRows || statsRows.length === 0) && (!sentenceRows || sentenceRows.length === 0)) {
      return null;
    }
    const core = coreRows && coreRows.length ? parseCoreRow(coreRows[0]) : parseCoreRow({ english, chinese: '', data_json: '{}' });
    const result = {
      chinese: core.chinese,
      examples: core.examples,
      synonyms: core.synonyms,
      antonyms: core.antonyms,
      examStats: statsRows && statsRows.length ? parseExamStatsRow(statsRows[0]) : null,
      examSentences: parseExamSentenceRows(sentenceRows),
      defs: core.defs,
      exam_tip: core.exam_tip,
      sentiment: core.sentiment,
      data_json: core.data_json,
    };
    setDetailCache(english, result);
    return result;
  } catch (err) {
    logger.error('[masterDb] 流程中断:', err);
    return null;
  }
}

export async function getWordExamData(word) {
  if (!word || typeof word !== 'string') return { examStats: null, examSentences: [] };
  const english = word.trim().toLowerCase();
  if (!english || !isApp()) return { examStats: null, examSentences: [] };
  try {
    await initMasterDb();
    const isOpen = plus.sqlite.isOpenDatabase && plus.sqlite.isOpenDatabase({ name: MASTER_DB_NAME, path: MASTER_DB_PATH });
    if (!isOpen) return { examStats: null, examSentences: [] };
    const safe = sqlLiteralStr(english);
    const [statsRows, sentenceRows] = await Promise.all([
      selectSqlRows(`SELECT * FROM word_exam_stats WHERE english = ${safe} LIMIT 1`),
      selectSqlRows(`SELECT year, section, exam_type, sentence FROM word_exam_sentences WHERE english = ${safe} ORDER BY year, id`),
    ]);
    return {
      examStats: statsRows && statsRows.length ? parseExamStatsRow(statsRows[0]) : null,
      examSentences: parseExamSentenceRows(sentenceRows),
    };
  } catch (err) {
    logger.error('[masterDb] getWordExamData 失败', err);
    return { examStats: null, examSentences: [] };
  }
}

export async function getWordExamStatsBatch(englishList) {
  if (!Array.isArray(englishList) || englishList.length === 0 || !isApp()) return {};
  const keys = [...new Set(englishList.map((w) => (typeof w === 'string' ? w : (w && w.english) || '').trim().toLowerCase()).filter(Boolean))];
  if (keys.length === 0) return {};
  try {
    const ok = await ensureMasterOpen();
    if (!ok) return {};
    const safeKeys = keys.slice(0, 500).map((k) => sqlLiteralStr(k));
    const rows = await selectSqlRows(
      `SELECT english, total_count, importance, tags_json FROM word_exam_stats WHERE english IN (${safeKeys.join(',')})`
    );
    const out = {};
    for (const row of rows) {
      const nr = normalizeRow(row);
      const english = (nr.english || '').trim().toLowerCase();
      if (!english) continue;
      const tags = parseJsonSafe(nr.tags_json, []);
      out[english] = {
        examCount: Number(nr.total_count) || 0,
        importance: nr.importance != null ? (Number(nr.importance) || 0) : 0,
        tags: Array.isArray(tags) ? tags.join(',') : '',
      };
    }
    return out;
  } catch (err) {
    logger.error('[masterDb] getWordExamStatsBatch 失败', err);
    return {};
  }
}

/**
 * 批量查词：释义 + 真题次数 + 标签 + 重要程度。
 * @returns {Promise<Object>} { "word_lower": { chinese, examCount, tags, importance } }
 */
export function getWordBriefBatch(englishList) {
  if (!Array.isArray(englishList) || englishList.length === 0) return Promise.resolve({});
  const keys = [...new Set(englishList.map((w) => (typeof w === 'string' ? w : (w && w.english) || '').trim().toLowerCase()).filter(Boolean))];
  if (keys.length === 0) return Promise.resolve({});
  if (!isApp()) return Promise.resolve({});
  return ensureMasterOpen().then((ok) => {
    if (!ok) return {};
    return new Promise((resolve) => {
      try {
        const safeKeys = keys.slice(0, 500).map((k) => sqlLiteralStr(k));
        const sql = `
          SELECT
            v.english,
            v.chinese,
            v.data_json,
            s.total_count,
            s.importance,
            s.tags_json
          FROM vocab_master v
          LEFT JOIN word_exam_stats s ON v.english = s.english
          WHERE v.english IN (${safeKeys.join(',')})
        `;
        plus.sqlite.selectSql({
          name: MASTER_DB_NAME,
          sql,
          success: (rows) => {
            const out = {};
            if (rows && rows.length) {
              for (const r of rows) {
                const nr = normalizeRow(r);
                const en = (nr.english || '').trim().toLowerCase();
                if (!en) continue;
                const core = parseCoreRow(nr);
                const tags = parseJsonSafe(nr.tags_json, []);
                out[en] = {
                  chinese: core.chinese,
                  examCount: Number(nr.total_count) || 0,
                  tags: Array.isArray(tags) ? tags.join(',') : '',
                  importance: nr.importance != null ? (Number(nr.importance) || 0) : 0,
                };
              }
            }
            logger.debug('[masterDb] getWordBriefBatch 成功, 条数=', rows ? rows.length : 0);
            resolve(out);
          },
          fail: (e) => {
            logger.error('[masterDb] getWordBriefBatch selectSql 失败', e);
            resolve({});
          },
        });
      } catch (e) {
        resolve({});
      }
    });
  });
}

let reviewWordListCache = null;

/** 单词详情内存缓存，避免复习翻页时重复查询同一个词 */
const wordDetailCache = new Map();
const DETAIL_CACHE_MAX = 200;

function setDetailCache(key, value) {
  if (wordDetailCache.size >= DETAIL_CACHE_MAX) {
    // 删除最旧的一批
    const keys = wordDetailCache.keys();
    for (let i = 0; i < 20; i++) {
      const k = keys.next().value;
      if (k !== undefined) wordDetailCache.delete(k);
    }
  }
  wordDetailCache.set(key, value);
}

export function getWordListForReview() {
  if (reviewWordListCache && reviewWordListCache.length > 0) return Promise.resolve(reviewWordListCache);
  if (!isApp()) return Promise.resolve([]);
  return ensureMasterOpen().then((ok) => {
    if (!ok) return [];
    return new Promise((resolve) => {
      plus.sqlite.selectSql({
        name: MASTER_DB_NAME,
        sql: 'SELECT english, chinese FROM vocab_master LIMIT 5000',
        success: (rows) => {
          const list = [];
          if (rows && rows.length) {
            for (const r of rows) {
              const w = (r.english || '').trim();
              if (w) list.push({ word: w, chinese: (r.chinese || '').trim() });
            }
          }
          reviewWordListCache = list;
          resolve(list);
        },
        fail: () => resolve([]),
      });
    });
  });
}
