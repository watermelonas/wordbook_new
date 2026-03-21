/**
 * 词书单词的"已斩"状态存储模块 (masteredWordbookWords.js)
 *
 * 功能：
 * - 管理词书单词的"已斩"状态
 * - 由于词书单词不存在于本地数据库，需要单独存储其"已斩"状态
 * - 已斩列表是全局的，斯掉后在所有词书都不会出现
 * - 支持添加、删除、查询已斯掉单词
 *
 * 为什么需要单独存储：
 * - 词书单词（如红宝书、真题词汇）来自预生成库，不在本地数据库
 * - 用户的"已斯掉"状态需要单独记录
 * - 已斯掉状态是全局的，不分词书
 *
 * 存储方式：
 * - 使用 localStorage 存储已斯掉单词列表
 * - 格式：JSON 数组，包含已斯掉单词的英文
 * - key：MASTERED_WORDBOOK_WORDS_KEY
 *
 * 使用场景：
 * - 用户斯掉词书中的单词
 * - 查询单词是否已斯掉
 * - 取消单词的已斯掉状态
 * - 导出/导入已斯掉单词列表
 */

import { logger } from './errorHandler.js';

// 存储 key
const MASTERED_WORDBOOK_WORDS_KEY = 'mastered_wordbook_words_global_v1';

/**
 * 获取全局已斯掉单词集合
 *
 * 功能：
 * - 从本地存储读取已斯掉单词列表
 * - 转换为 Set 以提升查询性能
 * - 处理读取失败的情况
 *
 * @returns {Set<string>} 已斯掉单词的英文集合
 *
 * @example
 * const masteredSet = getGlobalMasteredWords();
 * if (masteredSet.has('abandon')) {
 *   console.log('abandon 已斯掉');
 * }
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
 * 标记单词为全局已斯掉
 *
 * 功能：
 * - 将单词添加到已斯掉列表
 * - 避免重复添加
 * - 保存到本地存储
 * - 记录操作日志
 *
 * @param {string} english - 单词英文
 *
 * @example
 * addGlobalMasteredWord('abandon');  // 标记 abandon 为已斯掉
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
 * 取消单词的全局已斯掉状态
 *
 * 功能：
 * - 从已斯掉列表中移除单词
 * - 保存到本地存储
 * - 记录操作日志
 *
 * @param {string} english - 单词英文
 *
 * @example
 * removeGlobalMasteredWord('abandon');  // 取消 abandon 的已斯掉状态
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
 *
 * 功能：
 * - 快速查询单词是否已斯掉
 * - 使用 Set 提升查询性能
 * - 返回布尔值
 *
 * @param {string} english - 单词英文
 * @returns {boolean} 是否已斯掉
 *
 * @example
 * if (isGlobalMasteredWord('abandon')) {
 *   console.log('abandon 已斯掉');
 * }
 */
export const isGlobalMasteredWord = (english) => {
  const masteredSet = getGlobalMasteredWords();
  return masteredSet.has(english);
};

/**
 * 获取某个词书的已斯掉单词集合（兼容旧代码）
 *
 * 注意：
 * - 此函数已弃用，保留仅为兼容性
 * - 返回全局已斯掉列表，不分词书
 * - 新代码应使用 getGlobalMasteredWords()
 *
 * @param {string} wordbookId - 词书 ID（已弃用，保留兼容性）
 * @returns {Set<string>} 已斯掉单词的英文集合
 *
 * @deprecated 使用 getGlobalMasteredWords() 代替
 */
export const getMasteredWordbookWords = (wordbookId) => {
  // 返回全局已斯掉列表
  return getGlobalMasteredWords();
};

/**
 * 标记词书单词为已斯掉（兼容旧代码）
 *
 * 注意：
 * - 此函数已弃用，保留仅为兼容性
 * - 实际调用 addGlobalMasteredWord()
 * - 新代码应使用 addGlobalMasteredWord()
 *
 * @param {string} wordbookId - 词书 ID（已弃用，保留兼容性）
 * @param {string} english - 单词英文
 *
 * @deprecated 使用 addGlobalMasteredWord() 代替
 */
export const addMasteredWordbookWord = (wordbookId, english) => {
  // 使用全局已斯掉列表
  addGlobalMasteredWord(english);
};

/**
 * 取消词书单词的"已斯掉"状态（兼容旧代码）
 *
 * 注意：
 * - 此函数已弃用，保留仅为兼容性
 * - 实际调用 removeGlobalMasteredWord()
 * - 新代码应使用 removeGlobalMasteredWord()
 *
 * @param {string} wordbookId - 词书 ID（已弃用，保留兼容性）
 * @param {string} english - 单词英文
 *
 * @deprecated 使用 removeGlobalMasteredWord() 代替
 */
export const removeMasteredWordbookWord = (wordbookId, english) => {
  // 使用全局已斯掉列表
  removeGlobalMasteredWord(english);
};

/**
 * 检查词书单词是否已斯掉（兼容旧代码）
 *
 * 注意：
 * - 此函数已弃用，保留仅为兼容性
 * - 实际调用 isGlobalMasteredWord()
 * - 新代码应使用 isGlobalMasteredWord()
 *
 * @param {string} wordbookId - 词书 ID（已弃用，保留兼容性）
 * @param {string} english - 单词英文
 * @returns {boolean} 是否已斯掉
 *
 * @deprecated 使用 isGlobalMasteredWord() 代替
 */
export const isWordbookWordMastered = (wordbookId, english) => {
  // 使用全局已斯掉列表
  return isGlobalMasteredWord(english);
};
