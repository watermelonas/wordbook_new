/**
 * 复习算法模块 (reviewAlgo.js)
 *
 * 功能：
 * - 实现 FSRS（Free Spaced Repetition Scheduler）算法
 * - 计算单词的难度、稳定性、可检索性
 * - 安排最优的复习时间
 * - 根据答题结果更新单词参数
 *
 * 核心概念：
 * - 难度（Difficulty）：单词的学习难度，范围 0.15-0.98
 * - 稳定性（Stability）：单词的记忆稳定性，单位为天
 * - 可检索性（Retrievability）：能回忆起单词的概率，范围 0.05-0.99
 * - 复习间隔（Interval）：下次复习的天数
 *
 * 算法原理：
 * 基于遗忘曲线理论，通过计算单词的各项参数，为每个单词安排最优的复习时间。
 * 当用户答对时，增加稳定性和复习间隔；当用户答错时，降低稳定性和可检索性。
 *
 * 参考文献：
 * - Ebbinghaus Forgetting Curve（艾宾浩斯遗忘曲线）
 * - SM-2 Algorithm（间隔重复算法）
 * - FSRS Algorithm（自由间隔重复调度器）
 */

import { FSRS_CONFIG } from './algorithmConfig.js';

/**
 * 复习字段的默认值
 * 新单词初始化时使用这些默认值
 * @type {object}
 */
export const REVIEW_DEFAULTS = {
  difficulty_score: FSRS_CONFIG.INITIAL_DIFFICULTY,  // 初始难度
  stability: FSRS_CONFIG.INITIAL_STABILITY,  // 初始稳定性
  retrievability: FSRS_CONFIG.INITIAL_RETRIEVABILITY,  // 初始可检索性
  interval_days: 0,  // 初始复习间隔
  lapse_count: 0,  // 初始失误次数
  review_count: 0,  // 初始复习次数
  next_review_time: '',  // 下次复习时间
  last_reviewed_at: '',  // 上次复习时间
};

/**
 * 数值夹紧函数
 * 将数值限制在指定范围内
 *
 * 用途：
 * - 防止参数超出有效范围
 * - 确保算法的稳定性
 *
 * @param {number} num - 要夹紧的数值
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @returns {number} 夹紧后的数值
 *
 * @example
 * clamp(5, 0, 10)   // 返回 5
 * clamp(-5, 0, 10)  // 返回 0
 * clamp(15, 0, 10)  // 返回 10
 */
export const clamp = (num, min, max) => Math.min(max, Math.max(min, num));

/**
 * 规范化复习字段
 * 确保所有复习相关字段都在有效范围内
 *
 * 功能：
 * - 转换字段类型为数字
 * - 应用默认值
 * - 夹紧到有效范围
 *
 * @param {object} word - 单词对象
 * @returns {object} 规范化后的复习字段
 *
 * @example
 * const word = { difficulty_score: 1.5, stability: -0.5 };
 * const normalized = normalizeReviewFields(word);
 * // normalized.difficulty_score = 0.98（被夹紧到最大值）
 * // normalized.stability = 0.2（被夹紧到最小值）
 */
export const normalizeReviewFields = (word = {}) => ({
  difficulty_score: clamp(
    Number(word.difficulty_score ?? REVIEW_DEFAULTS.difficulty_score) || REVIEW_DEFAULTS.difficulty_score,
    FSRS_CONFIG.DIFFICULTY_MIN,
    FSRS_CONFIG.DIFFICULTY_MAX
  ),
  stability: Math.max(
    FSRS_CONFIG.STABILITY_MIN,
    Number(word.stability ?? REVIEW_DEFAULTS.stability) || REVIEW_DEFAULTS.stability
  ),
  retrievability: clamp(
    Number(word.retrievability ?? REVIEW_DEFAULTS.retrievability) || REVIEW_DEFAULTS.retrievability,
    FSRS_CONFIG.RETRIEVABILITY_MIN,
    FSRS_CONFIG.RETRIEVABILITY_MAX
  ),
  interval_days: Math.max(0, Number(word.interval_days ?? REVIEW_DEFAULTS.interval_days) || 0),
  lapse_count: Math.max(0, Number(word.lapse_count ?? REVIEW_DEFAULTS.lapse_count) || 0),
  review_count: Math.max(0, Number(word.review_count ?? word.review_frequency ?? REVIEW_DEFAULTS.review_count) || 0),
  next_review_time: word.next_review_time || '',
  last_reviewed_at: word.last_reviewed_at || '',
});

/**
 * 计算经过的天数
 * 从上次复习（或更新、创建）到现在的天数
 *
 * 用途：
 * - 计算可检索性衰减
 * - 判断是否需要复习
 * - 计算复习优先级
 *
 * @param {object} word - 单词对象
 * @param {Date} [now=new Date()] - 当前时间，默认为现在
 * @returns {number} 经过的天数，如果没有时间戳则返回 999
 *
 * @example
 * const word = { last_reviewed_at: '2026-03-10T00:00:00Z' };
 * const days = computeElapsedDays(word, new Date('2026-03-20T00:00:00Z'));
 * // 返回 10
 */
export const computeElapsedDays = (word = {}, now = new Date()) => {
  const base = word.last_reviewed_at || word.update_time || word.create_time;
  if (!base) return 999;
  return Math.max(0, (now - new Date(base)) / (1000 * 60 * 60 * 24));
};

/**
 * 根据稳定性计算可检索性
 * 使用指数衰减模型：R = e^(-t/S)
 * 其中 R 是可检索性，t 是经过的天数，S 是稳定性
 *
 * @param {number} stability - 稳定性（天数）
 * @param {number} elapsedDays - 经过的天数
 * @returns {number} 可检索性（0.02-0.999）
 *
 * @example
 * // 稳定性为 10 天，经过 10 天后
 * const r = computeRetrievabilityByStability(10, 10);
 * // 返回约 0.368（e^(-1) ≈ 0.368）
 */
export const computeRetrievabilityByStability = (stability, elapsedDays) => {
  const s = Math.max(FSRS_CONFIG.STABILITY_MIN, Number(stability) || REVIEW_DEFAULTS.stability);
  return clamp(Math.exp(-elapsedDays / s), 0.02, 0.999);
};

/**
 * 计算下一次复习状态（FSRS-lite）
 *
 * 这是算法的核心函数，根据用户的答题结果（正确/错误）计算单词的新状态。
 * 包括难度、稳定性、可检索性、复习间隔等参数。
 *
 * 算法流程：
 * 1. 规范化当前单词的复习字段
 * 2. 计算经过的天数和当前可检索性
 * 3. 根据答题结果调整参数：
 *    - 答对：难度降低，稳定性增加，可检索性提高
 *    - 答错：难度增加，稳定性降低，可检索性下降
 * 4. 计算下次复习时间
 *
 * @param {object} word - 当前单词对象，应包含以下字段：
 *   - english: 英文单词
 *   - difficulty_score: 难度系数（0.15-0.98）
 *   - stability: 稳定性（天数）
 *   - retrievability: 可检索性（0.05-0.99）
 *   - interval_days: 复习间隔（天）
 *   - lapse_count: 错误次数
 *   - review_count: 复习次数
 *   - importance: 重要性（0-5）
 *   - last_reviewed_at: 上次复习时间
 * @param {boolean} [isCorrect=false] - 是否答对
 * @param {Date} [now=new Date()] - 当前时间，用于计算经过的天数
 * @returns {object} 新的复习状态，包含：
 *   - difficulty_score: 新的难度系数
 *   - stability: 新的稳定性
 *   - retrievability: 新的可检索性
 *   - interval_days: 新的复习间隔
 *   - lapse_count: 新的错误次数
 *   - review_count: 新的复习次数
 *   - next_review_time: 下次复习时间（ISO 8601 格式）
 *   - last_reviewed_at: 本次复习时间（ISO 8601 格式）
 *
 * @example
 * const word = {
 *   english: 'abandon',
 *   difficulty_score: 0.35,
 *   stability: 0.6,
 *   retrievability: 0.92,
 *   importance: 3,
 *   last_reviewed_at: '2026-03-10T00:00:00Z'
 * };
 *
 * // 用户答对了
 * const newState = scheduleReviewState(word, true);
 * // newState.stability 会增加（记忆更稳定）
 * // newState.interval_days 会增加（下次复习时间延后）
 *
 * // 用户答错了
 * const newState = scheduleReviewState(word, false);
 * // newState.stability 会降低（记忆不稳定）
 * // newState.interval_days 会变小（需要尽快复习）
 */
export const scheduleReviewState = (word = {}, isCorrect = false, now = new Date()) => {
  const importance = clamp(Number(word.importance) || FSRS_CONFIG.IMPORTANCE_DEFAULT, FSRS_CONFIG.IMPORTANCE_MIN, FSRS_CONFIG.IMPORTANCE_MAX);
  const prev = normalizeReviewFields(word);
  const elapsedDays = computeElapsedDays(word, now);
  const recallProb = computeRetrievabilityByStability(prev.stability, elapsedDays);
  const nextReviewCount = prev.review_count + 1;

  let difficulty = prev.difficulty_score;
  let stability = prev.stability;
  let lapseCount = prev.lapse_count;
  let retrievability = prev.retrievability;
  let intervalDays = prev.interval_days;

  if (isCorrect) {
    // ========== 答对时的参数调整 ==========
    // 难度降低：答对说明单词不如预期难
    // 公式：d' = d - 0.06 + (1 - R) * 0.05 - (importance / 100)
    // - 基础降低 0.06
    // - 如果可检索性低（容易忘记），难度降低更多
    // - 重要性高的单词难度降低更多
    difficulty = clamp(
      difficulty - FSRS_CONFIG.DIFFICULTY_DECREASE_ON_CORRECT +
      (1 - recallProb) * FSRS_CONFIG.STABILITY_RETRIEVABILITY_FACTOR -
      (importance / 100),
      FSRS_CONFIG.DIFFICULTY_MIN,
      0.95
    );

    // 稳定性增加：答对说明记忆稳定
    // 公式：S' = S * (1.55 + (1 - d) * 0.65 + R * 0.35 + importance * 0.04)
    // - 基础增长系数 1.55
    // - 难度低的单词稳定性增加更多
    // - 可检索性高的单词稳定性增加更多
    // - 重要性高的单词稳定性增加更多
    stability = Math.max(
      0.5,
      stability * (FSRS_CONFIG.STABILITY_GROWTH_FACTOR +
        (1 - difficulty) * FSRS_CONFIG.STABILITY_DIFFICULTY_FACTOR +
        recallProb * FSRS_CONFIG.STABILITY_RETRIEVABILITY_FACTOR +
        importance * FSRS_CONFIG.STABILITY_IMPORTANCE_FACTOR)
    );

    // 复习间隔增加
    // 公式：I' = S' * (0.7 + (1 - d) * 0.9)
    // - 稳定性越高，间隔越长
    // - 难度越低，间隔越长
    intervalDays = clamp(
      stability * (FSRS_CONFIG.INTERVAL_BASE_FACTOR +
        (1 - difficulty) * FSRS_CONFIG.INTERVAL_DIFFICULTY_FACTOR),
      0.5,
      FSRS_CONFIG.INTERVAL_MAX_DAYS
    );

    // 可检索性设为高值
    retrievability = FSRS_CONFIG.RETRIEVABILITY_ON_CORRECT;
  } else {
    // ========== 答错时的参数调整 ==========
    // 难度增加：答错说明单词比预期难
    // 公式：d' = d + 0.12 + (1 - R) * 0.12 + 0.02 * max(0, 3 - importance)
    difficulty = clamp(
      difficulty + FSRS_CONFIG.DIFFICULTY_INCREASE_ON_WRONG +
      (1 - recallProb) * FSRS_CONFIG.DIFFICULTY_INCREASE_ON_WRONG +
      0.02 * Math.max(0, FSRS_CONFIG.IMPORTANCE_DEFAULT - importance),
      FSRS_CONFIG.DIFFICULTY_MIN + 0.05,
      FSRS_CONFIG.DIFFICULTY_MAX
    );

    // 稳定性降低：答错说明记忆不稳定
    // 公式：S' = S * (0.42 + (1 - d) * 0.22)
    stability = Math.max(
      FSRS_CONFIG.STABILITY_MIN,
      stability * (FSRS_CONFIG.STABILITY_DECAY_FACTOR +
        (1 - difficulty) * 0.22)
    );

    // 错误次数增加
    lapseCount += 1;

    // 改进的复习间隔计算：答错时应该立即复习
    // 根据错误次数调整间隔：
    // - 第 1 次错误：1 小时（0.04 天）
    // - 第 2 次错误：3 小时（0.125 天）
    // - 第 3+ 次错误：6 小时（0.25 天）
    if (lapseCount === 1) {
      intervalDays = 0.04;  // 1 小时
    } else if (lapseCount === 2) {
      intervalDays = 0.125;  // 3 小时
    } else {
      intervalDays = 0.25;  // 6 小时
    }

    // 可检索性设为低值
    retrievability = FSRS_CONFIG.RETRIEVABILITY_ON_WRONG;
  }

  return {
    difficulty_score: Number(difficulty.toFixed(4)),
    stability: Number(stability.toFixed(4)),
    retrievability: Number(retrievability.toFixed(4)),
    interval_days: Number(intervalDays.toFixed(4)),
    lapse_count: lapseCount,
    review_count: nextReviewCount,
    review_frequency: nextReviewCount,
    next_review_time: new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000).toISOString(),
    last_reviewed_at: now.toISOString(),
  };
};

/**
 * ✅ 验证算法输出的合理性
 */
export const validateScheduleOutput = (output) => {
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
  if (typeof output.difficulty_score !== 'number' || output.difficulty_score < FSRS_CONFIG.DIFFICULTY_MIN || output.difficulty_score > FSRS_CONFIG.DIFFICULTY_MAX) {
    throw new Error(`难度分数必须在 ${FSRS_CONFIG.DIFFICULTY_MIN}-${FSRS_CONFIG.DIFFICULTY_MAX} 之间`);
  }

  // 验证稳定性
  if (typeof output.stability !== 'number' || output.stability < FSRS_CONFIG.STABILITY_MIN) {
    throw new Error(`稳定性必须 >= ${FSRS_CONFIG.STABILITY_MIN}`);
  }

  return true;
};

/**
 * 计算复习优先级分数
 *
 * 用于排序单词，决定哪些单词应该优先复习。
 * 优先级分数越高，单词越需要立即复习。
 *
 * 优先级计算因素：
 * - 遗忘概率（55%权重）：最重要，容易忘记的单词优先复习
 * - 难度系数（22%权重）：难的单词需要更多复习
 * - 逾期天数（12%权重）：超期的单词需要立即复习
 * - 错误次数（8%权重）：经常出错的单词需要加强
 * - 重要性（4%权重）：重要的单词优先复习
 *
 * @param {object} word - 单词对象
 * @param {boolean} [hardMode=false] - 是否启用困难模式
 *   - 困难模式会增加遗忘概率和难度的权重
 *   - 适合想要更高效学习的用户
 * @returns {object} 优先级信息：
 *   - score: 优先级分数（越高越需要复习）
 *   - forget_probability: 遗忘概率（0-1）
 *   - overdue_days: 逾期天数
 *
 * @example
 * const word = { english: 'abandon', stability: 5, difficulty_score: 0.6 };
 * const priority = calculateReviewPriority(word);
 * // priority.score 可能是 45.2
 * // 用于排序：score 越高，单词越靠前
 */
export const calculateReviewPriority = (word = {}, hardMode = false) => {
  const now = new Date();
  const fields = normalizeReviewFields(word);
  const elapsedDays = computeElapsedDays(word, now);
  const forgetProb = 1 - computeRetrievabilityByStability(fields.stability, elapsedDays);
  const dueAt = fields.next_review_time
    ? new Date(fields.next_review_time)
    : new Date(word.last_reviewed_at || word.update_time || word.create_time || now.toISOString());
  const overdueDays = Math.max(0, (now - dueAt) / (1000 * 60 * 60 * 24));
  const importance = clamp(Number(word.importance) || FSRS_CONFIG.IMPORTANCE_DEFAULT, FSRS_CONFIG.IMPORTANCE_MIN, FSRS_CONFIG.IMPORTANCE_MAX);

  // 改进的优先级分数计算（更科学的权重分配）
  // 权重分配：
  // - 逾期天数 (35%)：超期单词最优先复习
  // - 遗忘概率 (35%)：容易遗忘的单词需要加强
  // - 难度系数 (20%)：难单词需要更多复习
  // - 错误次数 (7%)：经常出错的单词需要加强
  // - 重要性 (3%)：重要单词优先复习

  let score =
    overdueDays * 35 +      // 超期天数权重提升到 35%（从 12%）
    forgetProb * 35 +       // 遗忘概率权重降低到 35%（从 55%）
    fields.difficulty_score * 20 +  // 难度权重提升到 20%（从 22%）
    fields.lapse_count * 7 +        // 错误次数权重降低到 7%（从 8%）
    importance * 3;                 // 重要性权重降低到 3%（从 4%）

  // 困难模式：增加难度和错误次数的权重
  if (hardMode) {
    score += fields.difficulty_score * 15 + fields.lapse_count * 10;
  }

  return {
    score,
    forget_probability: Number(forgetProb.toFixed(4)),
    overdue_days: Number(overdueDays.toFixed(3)),
  };
};

/**
 * 计算单词的掌握度
 *
 * 掌握度是一个 0-99 的分数，表示用户对单词的掌握程度。
 * 掌握度基于：
 * - 遗忘概率（72%权重）：遗忘概率越低，掌握度越高
 * - 难度系数（28%权重）：难度越低，掌握度越高
 *
 * 掌握度分层：
 * - 80-99：熟练（绿色）
 * - 60-79：稳定（蓝色）
 * - 40-59：薄弱（黄色）
 * - 0-39：危险（红色）
 *
 * @param {object} word - 单词对象
 * @returns {number} 掌握度（1-99）
 *
 * @example
 * const word = { english: 'abandon', stability: 20, difficulty_score: 0.3 };
 * const mastery = calculateMastery(word);
 * // 返回 85（掌握度较高）
 */
export const calculateMastery = (word = {}) => {
  const fields = normalizeReviewFields(word);
  const elapsedDays = computeElapsedDays(word, new Date());
  const forgetProbability = 1 - computeRetrievabilityByStability(fields.stability, elapsedDays);

  // 改进的掌握度计算公式
  // 综合考虑多个因素：
  // 1. 遗忘概率（50%权重）：基础因素
  // 2. 正确率（30%权重）：实际表现
  // 3. 连续正确次数（15%权重）：学习动力
  // 4. 难度系数（5%权重）：难度调整

  // 基础掌握度（基于遗忘概率和难度）
  const baseMastery = (1 - (forgetProbability * 0.6 + fields.difficulty_score * 0.4)) * 100;

  // 正确率因素
  const totalReviews = fields.correctCount + fields.wrongCount;
  const correctRate = totalReviews > 0 ? (fields.correctCount / totalReviews) * 100 : 50;

  // 连续正确因素（鼓励用户保持连续正确）
  // 每连续正确 1 次，加 2 分，最多加 15 分
  const consecutiveBonus = Math.min(fields.consecutiveCorrect * 2, 15);

  // 综合掌握度
  const mastery = baseMastery * 0.5 + correctRate * 0.3 + consecutiveBonus * 0.15 + (100 - fields.difficulty_score * 100) * 0.05;

  return clamp(Math.round(mastery), 1, 99);
};
