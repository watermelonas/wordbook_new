/**
 * 记忆算法配置文件
 * 包含 FSRS-lite 算法的所有参数
 *
 * 这些参数控制单词的学习难度、稳定性、复习间隔等
 * 调整这些参数可以改变学习体验
 */

/**
 * FSRS 算法参数
 * 基于 Spaced Repetition 和 Forgetting Curve 理论
 */
export const FSRS_CONFIG = {
  // ============ 初始值 ============
  // 新单词的初始难度系数（0.15-0.98）
  // 值越高，单词越难
  INITIAL_DIFFICULTY: 0.35,

  // 新单词的初始稳定性（天数）
  // 值越高，遗忘越慢
  INITIAL_STABILITY: 0.6,

  // 新单词的初始可检索性（0.05-0.99）
  // 表示能回忆起单词的概率
  INITIAL_RETRIEVABILITY: 0.92,

  // ============ 难度调整参数 ============
  // 答对时难度的减少量
  DIFFICULTY_DECREASE_ON_CORRECT: 0.06,

  // 答错时难度的增加量
  DIFFICULTY_INCREASE_ON_WRONG: 0.12,

  // 难度的最小值
  DIFFICULTY_MIN: 0.15,

  // 难度的最大值
  DIFFICULTY_MAX: 0.98,

  // ============ 稳定性调整参数 ============
  // 答对时稳定性的增长系数
  STABILITY_GROWTH_FACTOR: 1.55,

  // 答对时难度对稳定性的影响系数
  STABILITY_DIFFICULTY_FACTOR: 0.65,

  // 答对时可检索性对稳定性的影响系数
  STABILITY_RETRIEVABILITY_FACTOR: 0.35,

  // 答对时重要性对稳定性的影响系数
  STABILITY_IMPORTANCE_FACTOR: 0.04,

  // 答错时稳定性的衰减系数
  STABILITY_DECAY_FACTOR: 0.42,

  // 稳定性的最小值
  STABILITY_MIN: 0.2,

  // ============ 复习间隔参数 ============
  // 复习间隔的基础系数
  INTERVAL_BASE_FACTOR: 0.7,

  // 复习间隔的难度系数
  INTERVAL_DIFFICULTY_FACTOR: 0.9,

  // 复习间隔的最大值（天）
  INTERVAL_MAX_DAYS: 90,

  // 答错后的复习间隔（天）
  INTERVAL_ON_WRONG: 0.125,

  // ============ 可检索性参数 ============
  // 答对时的可检索性
  RETRIEVABILITY_ON_CORRECT: 0.97,

  // 答错时的可检索性
  RETRIEVABILITY_ON_WRONG: 0.35,

  // 可检索性的最小值
  RETRIEVABILITY_MIN: 0.05,

  // 可检索性的最大值
  RETRIEVABILITY_MAX: 0.99,

  // ============ 重要性参数 ============
  // 重要性的最小值
  IMPORTANCE_MIN: 0,

  // 重要性的最大值
  IMPORTANCE_MAX: 5,

  // 重要性的默认值
  IMPORTANCE_DEFAULT: 3,

  // ============ 缓存参数 ============
  // 内存缓存过期时间（毫秒）
  MEMORY_CACHE_TTL: 5 * 60 * 1000,  // 5 分钟

  // 存储缓存过期时间（毫秒）
  STORAGE_CACHE_TTL: 24 * 60 * 60 * 1000,  // 24 小时

  // 最大缓存条数
  MAX_CACHE_SIZE: 500,

  // ============ 复习设置 ============
  // 每日默认复习数量
  DAILY_REVIEW_COUNT: 20,

  // 新单词每日学习数量
  DAILY_NEW_WORDS: 10,

  // 首日巩固复习次数
  FIRST_DAY_REVIEW_COUNT: 3,

  // ============ 掌握度阈值 ============
  // 掌握度的最小值（0-100）
  MASTERY_MIN: 0,

  // 掌握度的最大值（0-100）
  MASTERY_MAX: 100,

  // 掌握度分层：熟练（%）
  MASTERY_STRONG_THRESHOLD: 80,

  // 掌握度分层：稳定（%）
  MASTERY_NORMAL_THRESHOLD: 60,

  // 掌握度分层：薄弱（%）
  MASTERY_WEAK_THRESHOLD: 40,

  // 掌握度分层：危险（%）
  MASTERY_DANGER_THRESHOLD: 0,
};

/**
 * 获取配置值
 * @param {string} key - 配置键
 * @param {*} defaultValue - 默认值
 * @returns {*} 配置值
 */
export function getConfig(key, defaultValue = null) {
  return FSRS_CONFIG[key] ?? defaultValue;
}

/**
 * 设置配置值
 * @param {string} key - 配置键
 * @param {*} value - 配置值
 */
export function setConfig(key, value) {
  FSRS_CONFIG[key] = value;
}

/**
 * 获取所有配置
 * @returns {object} 所有配置
 */
export function getAllConfig() {
  return { ...FSRS_CONFIG };
}

/**
 * 重置配置为默认值
 */
export function resetConfig() {
  // 重新导入默认配置
  Object.assign(FSRS_CONFIG, {
    INITIAL_DIFFICULTY: 0.35,
    INITIAL_STABILITY: 0.6,
    INITIAL_RETRIEVABILITY: 0.92,
    DIFFICULTY_DECREASE_ON_CORRECT: 0.06,
    DIFFICULTY_INCREASE_ON_WRONG: 0.12,
    DIFFICULTY_MIN: 0.15,
    DIFFICULTY_MAX: 0.98,
    STABILITY_GROWTH_FACTOR: 1.55,
    STABILITY_DIFFICULTY_FACTOR: 0.65,
    STABILITY_RETRIEVABILITY_FACTOR: 0.35,
    STABILITY_IMPORTANCE_FACTOR: 0.04,
    STABILITY_DECAY_FACTOR: 0.42,
    STABILITY_MIN: 0.2,
    INTERVAL_BASE_FACTOR: 0.7,
    INTERVAL_DIFFICULTY_FACTOR: 0.9,
    INTERVAL_MAX_DAYS: 90,
    INTERVAL_ON_WRONG: 0.125,
    RETRIEVABILITY_ON_CORRECT: 0.97,
    RETRIEVABILITY_ON_WRONG: 0.35,
    RETRIEVABILITY_MIN: 0.05,
    RETRIEVABILITY_MAX: 0.99,
    IMPORTANCE_MIN: 0,
    IMPORTANCE_MAX: 5,
    IMPORTANCE_DEFAULT: 3,
    MEMORY_CACHE_TTL: 5 * 60 * 1000,
    STORAGE_CACHE_TTL: 24 * 60 * 60 * 1000,
    MAX_CACHE_SIZE: 500,
    DAILY_REVIEW_COUNT: 20,
    DAILY_NEW_WORDS: 10,
    FIRST_DAY_REVIEW_COUNT: 3,
    MASTERY_MIN: 0,
    MASTERY_MAX: 100,
    MASTERY_STRONG_THRESHOLD: 80,
    MASTERY_NORMAL_THRESHOLD: 60,
    MASTERY_WEAK_THRESHOLD: 40,
    MASTERY_DANGER_THRESHOLD: 0,
  });
}
