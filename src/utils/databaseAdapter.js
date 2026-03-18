/**
 * 数据库适配器 - 分离 H5 和 App 实现
 * 解决 H5/App 代码混杂的问题
 */

import { bindSql, toJsonString, parseJsonSafe } from './sqlHelper.js';

const H5_STORAGE_KEY = 'wordbook_h5_words';

/**
 * 获取 H5 存储的单词列表
 */
const getH5Words = () => {
  try {
    const raw = uni.getStorageSync(H5_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('[H5Adapter] 读取 H5 单词列表失败:', e);
    return [];
  }
};

/**
 * 保存 H5 单词列表
 */
const setH5Words = (words) => {
  try {
    uni.setStorageSync(H5_STORAGE_KEY, JSON.stringify(words));
  } catch (e) {
    console.error('[H5Adapter] 保存 H5 单词列表失败:', e);
  }
};

/**
 * H5 数据库适配器
 */
export class H5DatabaseAdapter {
  async init() {
    // H5 无需初始化
    return Promise.resolve();
  }

  async query(sql, params = []) {
    // H5 不支持 SQL，返回空
    return Promise.resolve([]);
  }

  async execute(sql, params = []) {
    // H5 不支持 SQL，返回成功
    return Promise.resolve();
  }

  async getWords() {
    return Promise.resolve(getH5Words());
  }

  async addWord(word) {
    if (!word.english) throw new Error('单词不能为空');

    const words = getH5Words();
    const newWord = {
      ...word,
      id: Date.now().toString(),
      create_time: new Date().toISOString(),
      update_time: new Date().toISOString(),
      examples: word.examples || [],
      synonyms: word.synonyms || [],
      antonyms: word.antonyms || [],
      view_count: 0
    };
    words.unshift(newWord);
    setH5Words(words);
    return Promise.resolve(newWord);
  }

  async updateWord(id, updates) {
    if (!id) throw new Error('无效 id');

    const words = getH5Words();
    const idx = words.findIndex(w => w.id === id);
    if (idx === -1) throw new Error('未找到单词');

    words[idx] = {
      ...words[idx],
      ...updates,
      update_time: new Date().toISOString()
    };
    setH5Words(words);
    return Promise.resolve();
  }

  async deleteWord(id) {
    if (!id) throw new Error('无效 id');

    const words = getH5Words().filter(w => w.id !== id);
    setH5Words(words);
    return Promise.resolve();
  }

  async getWordById(id) {
    if (!id) return Promise.resolve(null);

    const words = getH5Words();
    const found = words.find(w => w.id === id);
    return Promise.resolve(found || null);
  }

  async getWordByEnglish(english) {
    if (!english) return Promise.resolve(null);

    const key = String(english).trim().toLowerCase();
    const words = getH5Words();
    const found = words.find(w => (w.english || '').toLowerCase() === key);
    return Promise.resolve(found || null);
  }

  async getRandomDistractors(excludeId, count = 3) {
    const words = getH5Words().filter(w => w.id !== excludeId);

    // Fisher-Yates 洗牌算法 - 产生均匀分布的随机排列
    for (let i = words.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [words[i], words[j]] = [words[j], words[i]];
    }

    return Promise.resolve(words.slice(0, count).map(w => w.chinese));
  }

  async getWordsByTag(tag, excludeId) {
    if (!tag || !tag.trim()) return Promise.resolve([]);

    const t = tag.trim();
    const words = getH5Words();
    return Promise.resolve(
      words
        .filter(w => w.id !== excludeId && (w.tags || '').split(/[,，\s]+/).map(x => x.trim()).filter(Boolean).includes(t))
        .slice(0, 20)
        .map(w => ({ id: w.id, english: w.english, chinese: w.chinese }))
    );
  }
}

/**
 * App SQLite 数据库适配器
 */
export class AppDatabaseAdapter {
  constructor(dbName = 'wordbook_db', dbPath = '_doc/wordbook.db') {
    this.dbName = dbName;
    this.dbPath = dbPath;
    this.isOpen = false;
  }

  async init() {
    console.log('[AppAdapter] init() 被调用');
    if (this.isOpen) {
      console.log('[AppAdapter] 数据库已打开，跳过初始化');
      return Promise.resolve();
    }

    try {
      console.log('[AppAdapter] 检查数据库是否已打开...');
      console.log('[AppAdapter] plus:', typeof plus);
      console.log('[AppAdapter] plus.sqlite:', typeof plus?.sqlite);

      if (plus && plus.sqlite && plus.sqlite.isOpenDatabase({ name: this.dbName, path: this.dbPath })) {
        console.log('[AppAdapter] 数据库已打开');
        this.isOpen = true;
        return Promise.resolve();
      }

      console.log('[AppAdapter] 打开数据库...');
      await this.openDatabase();
      this.isOpen = true;
      console.log('[AppAdapter] 数据库打开成功');
      return Promise.resolve();
    } catch (error) {
      console.error('[AppAdapter] 初始化失败:', error);
      throw error;
    }
  }

  openDatabase() {
    return new Promise((resolve, reject) => {
      plus.sqlite.openDatabase({
        name: this.dbName,
        path: this.dbPath,
        success: () => {
          console.log('[AppAdapter] 数据库打开成功');
          resolve();
        },
        fail: (e) => {
          console.error('[AppAdapter] 数据库打开失败:', e);
          reject(e);
        }
      });
    });
  }

  async query(sql, params = []) {
    await this.init();

    return new Promise((resolve) => {
      plus.sqlite.selectSql({
        name: this.dbName,
        sql: bindSql(sql, params),
        success: (data) => resolve(data || []),
        fail: (e) => {
          console.error('[AppAdapter] 查询失败:', e);
          resolve([]);
        }
      });
    });
  }

  async execute(sql, params = []) {
    await this.init();

    return new Promise((resolve, reject) => {
      plus.sqlite.executeSql({
        name: this.dbName,
        sql: bindSql(sql, params),
        success: resolve,
        fail: reject
      });
    });
  }

  async transaction(callback) {
    await this.init();

    try {
      await this.execute('BEGIN TRANSACTION');
      await callback();
      await this.execute('COMMIT');
    } catch (error) {
      await this.execute('ROLLBACK').catch(() => {});
      throw error;
    }
  }

  async getWords() {
    const data = await this.query('SELECT * FROM words ORDER BY create_time DESC');
    return data || [];
  }

  async addWord(word) {
    if (!word.english) return Promise.reject('单词不能为空');

    const wordId = Date.now().toString();
    const now = new Date().toISOString();

    const sql = `INSERT INTO words (
      id, english, chinese, tags, source_page, year, importance, repeat_count, view_count,
      difficulty_score, stability, retrievability, interval_days, lapse_count, review_count,
      next_review_time, last_reviewed_at, examples, synonyms, antonyms, create_time, update_time
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const params = [
      wordId,
      word.english,
      word.chinese || '',
      word.tags || '',
      word.source_page || '',
      word.year || '',
      word.importance || 3,
      word.repeat_count || 1,
      word.view_count != null ? word.view_count : 0,
      word.difficulty_score || 0.35,
      word.stability || 0.6,
      word.retrievability || 0.92,
      word.interval_days || 0,
      word.lapse_count || 0,
      word.review_count || 0,
      word.next_review_time || '',
      word.last_reviewed_at || '',
      toJsonString(word.examples || []),
      toJsonString(word.synonyms || []),
      toJsonString(word.antonyms || []),
      now,
      now
    ];

    await this.execute(sql, params);
    return Promise.resolve({ ...word, id: wordId });
  }

  async updateWord(id, updates) {
    if (!id) return Promise.reject('无效 id');

    const fields = [];
    const params = [];

    for (const [key, value] of Object.entries(updates)) {
      if (value === undefined) continue;
      fields.push(`${key} = ?`);
      params.push(value);
    }

    if (fields.length === 0) return Promise.resolve();

    fields.push('update_time = ?');
    params.push(new Date().toISOString());
    params.push(id);

    const sql = `UPDATE words SET ${fields.join(', ')} WHERE id = ?`;
    await this.execute(sql, params);
    return Promise.resolve();
  }

  async deleteWord(id) {
    if (!id) return Promise.reject('无效 id');

    await this.execute('DELETE FROM words WHERE id = ?', [id]);
    return Promise.resolve();
  }

  async getWordById(id) {
    if (!id) return Promise.resolve(null);

    const data = await this.query('SELECT * FROM words WHERE id = ?', [id]);
    return Promise.resolve(data && data.length ? data[0] : null);
  }

  async getWordByEnglish(english) {
    if (!english) return Promise.resolve(null);

    const key = String(english).trim().toLowerCase();
    const data = await this.query('SELECT * FROM words WHERE LOWER(english) = ? LIMIT 1', [key]);
    return Promise.resolve(data && data.length ? data[0] : null);
  }

  async getRandomDistractors(excludeId, count = 3) {
    const data = await this.query(
      'SELECT id, chinese FROM words WHERE id != ? ORDER BY RANDOM() LIMIT ?',
      [excludeId, count + 5]
    );
    return Promise.resolve((data || []).slice(0, count).map(item => item.chinese));
  }

  async getWordsByTag(tag, excludeId) {
    if (!tag || !tag.trim()) return Promise.resolve([]);

    const t = tag.trim();
    const data = await this.query(
      'SELECT id, english, chinese, tags FROM words WHERE (tags LIKE ? OR tags LIKE ? OR tags LIKE ? OR tags = ?) LIMIT 30',
      [`%,${t},%`, `${t},%`, `%,${t}`, t]
    );

    return Promise.resolve(
      (data || [])
        .filter(item => item.id !== excludeId &&
          (item.tags || '').split(/[,，\s]+/).map(x => x.trim()).filter(Boolean).includes(t))
        .slice(0, 20)
        .map(item => ({ id: item.id, english: item.english, chinese: item.chinese }))
    );
  }
}

/**
 * 数据库工厂 - 根据环境选择适配器
 */
export function createDatabaseAdapter() {
  console.log('[databaseAdapter] 检查运行环境...');
  console.log('[databaseAdapter] typeof plus:', typeof plus);
  console.log('[databaseAdapter] typeof plus.sqlite:', typeof plus?.sqlite);

  // 在 App 环境中，plus 应该存在
  const isApp = typeof plus !== 'undefined' && typeof plus.sqlite !== 'undefined';
  console.log('[databaseAdapter] isApp:', isApp);

  if (isApp) {
    console.log('[databaseAdapter] 使用 AppDatabaseAdapter');
    return new AppDatabaseAdapter();
  } else {
    console.log('[databaseAdapter] 使用 H5DatabaseAdapter');
    return new H5DatabaseAdapter();
  }
}
