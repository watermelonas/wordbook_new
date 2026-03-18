/**
 * 词书单词的"已斯"状态存储
 * 由于词书单词不存在于本地数据库，需要单独存储其"已斯"状态
 */

const MASTERED_WORDBOOK_WORDS_KEY = 'mastered_wordbook_words_v1';

/**
 * 获取某个词书的已斯单词集合
 * @param {string} wordbookId 词书ID（如 'redbook', 'exam_freq' 等）
 * @returns {Set<string>} 已斯单词的英文集合
 */
export const getMasteredWordbookWords = (wordbookId) => {
  try {
    const raw = uni.getStorageSync(MASTERED_WORDBOOK_WORDS_KEY);
    const data = raw ? JSON.parse(raw) : {};
    return new Set(data[wordbookId] || []);
  } catch (e) {
    console.error('getMasteredWordbookWords 失败:', e);
    return new Set();
  }
};

/**
 * 标记词书单词为已斯
 * @param {string} wordbookId 词书ID
 * @param {string} english 单词英文
 */
export const addMasteredWordbookWord = (wordbookId, english) => {
  try {
    const raw = uni.getStorageSync(MASTERED_WORDBOOK_WORDS_KEY);
    const data = raw ? JSON.parse(raw) : {};
    if (!data[wordbookId]) data[wordbookId] = [];
    if (!data[wordbookId].includes(english)) {
      data[wordbookId].push(english);
    }
    uni.setStorageSync(MASTERED_WORDBOOK_WORDS_KEY, JSON.stringify(data));
    console.log('addMasteredWordbookWord: 成功标记', wordbookId, english);
  } catch (e) {
    console.error('addMasteredWordbookWord 失败:', e);
  }
};

/**
 * 取消词书单词的"已斯"状态
 * @param {string} wordbookId 词书ID
 * @param {string} english 单词英文
 */
export const removeMasteredWordbookWord = (wordbookId, english) => {
  try {
    const raw = uni.getStorageSync(MASTERED_WORDBOOK_WORDS_KEY);
    const data = raw ? JSON.parse(raw) : {};
    if (data[wordbookId]) {
      data[wordbookId] = data[wordbookId].filter(w => w !== english);
    }
    uni.setStorageSync(MASTERED_WORDBOOK_WORDS_KEY, JSON.stringify(data));
    console.log('removeMasteredWordbookWord: 成功取消', wordbookId, english);
  } catch (e) {
    console.error('removeMasteredWordbookWord 失败:', e);
  }
};

/**
 * 检查词书单词是否已斯
 * @param {string} wordbookId 词书ID
 * @param {string} english 单词英文
 * @returns {boolean}
 */
export const isWordbookWordMastered = (wordbookId, english) => {
  const masteredSet = getMasteredWordbookWords(wordbookId);
  return masteredSet.has(english);
};
