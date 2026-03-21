/**
 * 记忆算法配置模块 (algorithmConfig.js)
 *
 * 功能：
 * - 定义 FSRS 算法的所有参数
 * - 控制单词的学习难度、稳定性、复习间隔
 * - 支持参数调整以改变学习体验
 *
 * 算法原理：
 * 基于 Spaced Repetition（间隔重复）和 Forgetting Curve（遗忘曲线）理论
 * 通过计算单词的难度、稳定性、可检索性，为每个单词安排最优的复习时间
 *
 * 参数调整建议：
 * - 增加 INITIAL_STABILITY：给用户更多消化时间
 * - 增加 STABILITY_GROWTH_FACTOR：加快学习进度
 * - 减少 INTERVAL_ON_WRONG：答错后立即复习
 */

/**
 * FSRS 算法参数配置
 * 这些参数控制整个学习系统的行为
 */
export const FSRS_CONFIG = {
  // ========== 初始值 ==========
  // 新单词的初始难度系数（0.15-0.98）
  // 值越高，单词越难，复习间隔越短
  INITIAL_DIFFICULTY: 0.35,

  // 新单词的初始稳定性（天数）
  // 值越高，遗忘越慢，复习间隔越长
  // 改进：从 0.6 天改为 1.5 天，给用户更多消化时间
  INITIAL_STABILITY: 1.5,

  // 新单词的初始可检索性（0.05-0.99）
  // 表示能回忆起单词的概率
  // 新单词初始可检索性较高（0.92），表示用户刚学会
  INITIAL_RETRIEVABILITY: 0.92,

  // ========== 难度调整参数 ==========
  // 答对时难度的减少量
  // 答对会降低难度，使复习间隔增加
  DIFFICULTY_DECREASE_ON_CORRECT: 0.06,

  // 答错时难度的增加量
  // 答错会增加难度，使复习间隔减少
  DIFFICULTY_INCREASE_ON_WRONG: 0.12,

  // 难度的最小值
  DIFFICULTY_MIN: 0.15,

  // 难度的最大值
  DIFFICULTY_MAX: 0.98,

  // ========== 稳定性调整参数 ==========
  // 答对时稳定性的增长系数
  // 值越大，稳定性增长越快，复习间隔增加越快
  // 改进：从 1.55 改为 1.8，加快学习进度
  STABILITY_GROWTH_FACTOR: 1.8,

  // 答对时难度对稳定性的影响系数
  // 难度越低，稳定性增长越快
  STABILITY_DIFFICULTY_FACTOR: 0.65,

  // 答对时可检索性对稳定性的影响系数
  // 可检索性越高，稳定性增长越快
  STABILITY_RETRIEVABILITY_FACTOR: 0.35,

  // 答对时重要性对稳定性的影响系数
  // 重要性越高，稳定性增长越快
  STABILITY_IMPORTANCE_FACTOR: 0.04,

  // 答错时稳定性的衰减系数
  // 答错会降低稳定性，使复习间隔减少
  STABILITY_DECAY_FACTOR: 0.42,

  // 稳定性的最小值
  STABILITY_MIN: 0.2,

  // ========== 复习间隔参数 ==========
  // 复习间隔的基础系数
  // 用于计算复习间隔的基础值
  INTERVAL_BASE_FACTOR: 0.7,

  // 复习间隔的难度系数
  // 难度越高，复习间隔越短
  INTERVAL_DIFFICULTY_FACTOR: 0.9,

  // 复习间隔的最大值（天）
  // 防止复习间隔过长
  INTERVAL_MAX_DAYS: 90,

  // 答错后的复习间隔（天）
  // 改进：从 0.125 天改为 0.04 天（1 小时），立即复习
  INTERVAL_ON_WRONG: 0.04,

  // ========== 可检索性参数 ==========
  // 答对时的可检索性
  // 答对会增加可检索性
  RETRIEVABILITY_ON_CORRECT: 0.97,

  // 答错时的可检索性
  // 答错会降低可检索性
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

  // ============ 算法版本 ============
  // 用于追踪算法版本，升级时用于数据迁移
  ALGORITHM_VERSION: 2,
};

/**
 * 获取优化后的 FSRS 配置
 * 根据用户的学习特点调整参数
 *
 * @param {object} userProfile - 用户学习档案
 *   - learningSpeed: 'fast' | 'normal' | 'slow'
 *   - masteryThreshold: 0-100，用户期望的掌握度阈值
 * @returns {object} 优化后的配置
 */
export function getOptimizedFSRSConfig(userProfile = {}) {
  const config = { ...FSRS_CONFIG };
  const learningSpeed = userProfile.learningSpeed || 'normal';

  // 根据学习速度调整参数
  if (learningSpeed === 'fast') {
    // 快速学习者：增加稳定性增长，缩短复习间隔
    config.STABILITY_GROWTH_FACTOR = 2.0;
    config.INITIAL_STABILITY = 2.0;
    config.INTERVAL_BASE_FACTOR = 0.9;
  } else if (learningSpeed === 'slow') {
    // 慢速学习者：降低稳定性增长，延长复习间隔
    config.STABILITY_GROWTH_FACTOR = 1.3;
    config.INITIAL_STABILITY = 1.0;
    config.INTERVAL_BASE_FACTOR = 0.5;
  }

  // 根据掌握度阈值调整参数
  const masteryThreshold = userProfile.masteryThreshold || 60;
  if (masteryThreshold > 80) {
    // 高掌握度要求：增加难度权重
    config.DIFFICULTY_INCREASE_ON_WRONG = 0.15;
  } else if (masteryThreshold < 40) {
    // 低掌握度要求：降低难度权重
    config.DIFFICULTY_INCREASE_ON_WRONG = 0.08;
  }

  return config;
}

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
    INITIAL_STABILITY: 1.5,
    INITIAL_RETRIEVABILITY: 0.92,
    DIFFICULTY_DECREASE_ON_CORRECT: 0.06,
    DIFFICULTY_INCREASE_ON_WRONG: 0.12,
    DIFFICULTY_MIN: 0.15,
    DIFFICULTY_MAX: 0.98,
    STABILITY_GROWTH_FACTOR: 1.8,
    STABILITY_DIFFICULTY_FACTOR: 0.65,
    STABILITY_RETRIEVABILITY_FACTOR: 0.35,
    STABILITY_IMPORTANCE_FACTOR: 0.04,
    STABILITY_DECAY_FACTOR: 0.42,
    STABILITY_MIN: 0.2,
    INTERVAL_BASE_FACTOR: 0.7,
    INTERVAL_DIFFICULTY_FACTOR: 0.9,
    INTERVAL_MAX_DAYS: 90,
    INTERVAL_ON_WRONG: 0.04,
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
    ALGORITHM_VERSION: 2,
  });
}

/**
 * ✅ 算法版本历史
 */
export const ALGORITHM_VERSIONS = {
  1: {
    name: 'FSRS-lite v1.0',
    deprecated: true,
    description: '初始版本',
  },
  2: {
    name: 'FSRS-lite v2.0',
    deprecated: false,
    description: '改进版本：增加稳定性增长，缩短答错复习间隔',
  },
};

/**
 * ✅ 参数迁移机制
 * 从旧版本参数迁移到新版本
 */
export function migrateAlgorithmParams(oldVersion, params = {}) {
  if (oldVersion === 1 && FSRS_CONFIG.ALGORITHM_VERSION === 2) {
    // 从 v1.0 迁移到 v2.0
    return {
      ...params,
      // v1.0 的参数可能需要调整
      STABILITY_GROWTH_FACTOR: params.STABILITY_GROWTH_FACTOR || 1.8,
      INITIAL_STABILITY: params.INITIAL_STABILITY || 1.5,
      INTERVAL_ON_WRONG: params.INTERVAL_ON_WRONG || 0.04,
    };
  }
  return params;
}

/**
 * ✅ 验证算法输出的合理性
 */
export function validateAlgorithmOutput(output) {
  if (!output || typeof output !== 'object') {
    throw new Error('算法输出必须是对象');
  }

  // 验证复习间隔
  if (typeof output.interval_days !== 'number' || output.interval_days < 0) {
    throw new Error('复习间隔必须是非负数');
  }

  // 验证下次复习时间
  if (typeof output.next_review_time !== 'string') {
    throw new Error('下次复习时间必须是字符串');
  }

  // 验证难度分数
  if (output.difficulty_score !== undefined) {
    const score = Number(output.difficulty_score);
    if (isNaN(score) || score < FSRS_CONFIG.DIFFICULTY_MIN || score > FSRS_CONFIG.DIFFICULTY_MAX) {
      throw new Error(`难度分数必须在 ${FSRS_CONFIG.DIFFICULTY_MIN}-${FSRS_CONFIG.DIFFICULTY_MAX} 之间`);
    }
  }

  // 验证稳定性
  if (output.stability !== undefined) {
    const stab = Number(output.stability);
    if (isNaN(stab) || stab < FSRS_CONFIG.STABILITY_MIN) {
      throw new Error(`稳定性必须 >= ${FSRS_CONFIG.STABILITY_MIN}`);
    }
  }

  return true;
}

/**
 * ✅ 获取算法版本信息
 */
export function getAlgorithmVersionInfo() {
  return {
    currentVersion: FSRS_CONFIG.ALGORITHM_VERSION,
    versionName: ALGORITHM_VERSIONS[FSRS_CONFIG.ALGORITHM_VERSION]?.name || 'Unknown',
    isDeprecated: ALGORITHM_VERSIONS[FSRS_CONFIG.ALGORITHM_VERSION]?.deprecated || false,
    availableVersions: ALGORITHM_VERSIONS,
  };
}
