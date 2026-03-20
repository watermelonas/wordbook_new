/**
 * 词书单词的"已斩"状态存储
 * 由于词书单词不存在于本地数据库，需要单独存储其"已斩"状态
 * 已斩列表是全局的，斯掉后在所有词书都不会出现
 */

import { logger } from './errorHandler.js';
const MASTERED_WORDBOOK_WORDS_KEY = 'mastered_wordbook_words_global_v1';

/**
 * 获取全局已斩单词集合
 * @returns {Set<string>} 已斩单词的英文集合
 */
export const getGlobalMasteredWords = () => {
  try {
    const raw = uni.getStorageSync(MASTERED_WORDBOOK_WORDS_KEY);
    const data = raw ? JSON.parse(raw) : [];
    return new Set(data);
  } catch (e) {
    logger.error('getGlobalMasteredWords 失败:', e);
    return new Set();
  }
};

/**
 * 标记单词为全局已斩
 * @param {string} english 单词英文
 */
export const addGlobalMasteredWord = (english) => {
  try {
    const raw = uni.getStorageSync(MASTERED_WORDBOOK_WORDS_KEY);
    const data = raw ? JSON.parse(raw) : [];
    if (!data.includes(english)) {
      data.push(english);
    }
    uni.setStorageSync(MASTERED_WORDBOOK_WORDS_KEY, JSON.stringify(data));
    logger.debug('addGlobalMasteredWord: 成功标记', english);
  } catch (e) {
    logger.error('addGlobalMasteredWord 失败:', e);
  }
};

/**
 * 取消单词的全局已斩状态
 * @param {string} english 单词英文
 */
export const removeGlobalMasteredWord = (english) => {
  try {
    const raw = uni.getStorageSync(MASTERED_WORDBOOK_WORDS_KEY);
    const data = raw ? JSON.parse(raw) : [];
    const filtered = data.filter(w => w !== english);
    uni.setStorageSync(MASTERED_WORDBOOK_WORDS_KEY, JSON.stringify(filtered));
    logger.debug('removeGlobalMasteredWord: 成功取消', english);
  } catch (e) {
    logger.error('removeGlobalMasteredWord 失败:', e);
  }
};

/**
 * 检查单词是否已全局斯掉
 * @param {string} english 单词英文
 * @returns {boolean}
 */
export const isGlobalMasteredWord = (english) => {
  const masteredSet = getGlobalMasteredWords();
  return masteredSet.has(english);
};

/**
 * 获取某个词书的已斩单词集合（兼容旧代码）
 * @param {string} wordbookId 词书ID（已弃用，保留兼容性）
 * @returns {Set<string>} 已斩单词的英文集合
 */
export const getMasteredWordbookWords = (wordbookId) => {
  // 返回全局已斩列表
  return getGlobalMasteredWords();
};

/**
 * 标记词书单词为已斩（兼容旧代码）
 * @param {string} wordbookId 词书ID（已弃用，保留兼容性）
 * @param {string} english 单词英文
 */
export const addMasteredWordbookWord = (wordbookId, english) => {
  // 使用全局已斩列表
  addGlobalMasteredWord(english);
};

/**
 * 取消词书单词的"已斩"状态（兼容旧代码）
 * @param {string} wordbookId 词书ID（已弃用，保留兼容性）
 * @param {string} english 单词英文
 */
export const removeMasteredWordbookWord = (wordbookId, english) => {
  // 使用全局已斩列表
  removeGlobalMasteredWord(english);
};

/**
 * 检查词书单词是否已斩（兼容旧代码）
 * @param {string} wordbookId 词书ID（已弃用，保留兼容性）
 * @param {string} english 单词英文
 * @returns {boolean}
 */
export const isWordbookWordMastered = (wordbookId, english) => {
  // 使用全局已斩列表
  return isGlobalMasteredWord(english);
};
