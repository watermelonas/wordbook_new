/**
 * reviewAlgo.js — 记忆算法公共模块（FSRS-lite）
 * db.js 和 learningCenter.js 均从此处 import，避免重复维护。
 * 任何算法参数调整只需改这一个文件。
 */

export const REVIEW_DEFAULTS = {
  difficulty_score: 0.35,
  stability: 0.6,
  retrievability: 0.92,
  interval_days: 0,
  lapse_count: 0,
  review_count: 0,
  next_review_time: '',
  last_reviewed_at: '',
};

export const clamp = (num, min, max) => Math.min(max, Math.max(min, num));

export const normalizeReviewFields = (word = {}) => ({
  difficulty_score: clamp(Number(word.difficulty_score ?? REVIEW_DEFAULTS.difficulty_score) || REVIEW_DEFAULTS.difficulty_score, 0.15, 0.98),
  stability: Math.max(0.2, Number(word.stability ?? REVIEW_DEFAULTS.stability) || REVIEW_DEFAULTS.stability),
  retrievability: clamp(Number(word.retrievability ?? REVIEW_DEFAULTS.retrievability) || REVIEW_DEFAULTS.retrievability, 0.05, 0.99),
  interval_days: Math.max(0, Number(word.interval_days ?? REVIEW_DEFAULTS.interval_days) || 0),
  lapse_count: Math.max(0, Number(word.lapse_count ?? REVIEW_DEFAULTS.lapse_count) || 0),
  review_count: Math.max(0, Number(word.review_count ?? word.review_frequency ?? REVIEW_DEFAULTS.review_count) || 0),
  next_review_time: word.next_review_time || '',
  last_reviewed_at: word.last_reviewed_at || '',
});

export const computeElapsedDays = (word = {}, now = new Date()) => {
  const base = word.last_reviewed_at || word.update_time || word.create_time;
  if (!base) return 999;
  return Math.max(0, (now - new Date(base)) / (1000 * 60 * 60 * 24));
};

export const computeRetrievabilityByStability = (stability, elapsedDays) => {
  const s = Math.max(0.2, Number(stability) || REVIEW_DEFAULTS.stability);
  return clamp(Math.exp(-elapsedDays / s), 0.02, 0.999);
};

/**
 * 计算下一次复习状态（FSRS-lite）。
 * db.js 调用时不传 now（内部用 new Date()）；
 * learningCenter.js 调用时可传入 now 以便单元测试。
 * @param {object} word   当前单词对象（含复习字段）
 * @param {boolean} isCorrect 是否答对
 * @param {Date} [now]    当前时间，默认 new Date()
 */
export const scheduleReviewState = (word = {}, isCorrect = false, now = new Date()) => {
  const importance = clamp(Number(word.importance) || 3, 0, 5);
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
    difficulty = clamp(
      difficulty - 0.06 + (1 - recallProb) * 0.05 - (importance / 100),
      0.15,
      0.95
    );
    stability = Math.max(
      0.5,
      stability * (1.55 + (1 - difficulty) * 0.65 + recallProb * 0.35 + importance * 0.04)
    );
    intervalDays = clamp(stability * (0.7 + (1 - difficulty) * 0.9), 0.5, 90);
    retrievability = 0.97;
  } else {
    difficulty = clamp(
      difficulty + 0.12 + (1 - recallProb) * 0.12 + 0.02 * Math.max(0, 3 - importance),
      0.2,
      0.98
    );
    stability = Math.max(0.2, stability * (0.42 + (1 - difficulty) * 0.22));
    lapseCount += 1;
    intervalDays = 0.125;
    retrievability = 0.35;
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
 * 计算复习优先级分数（用于排序）。
 * @param {object} word
 * @param {boolean} hardMode
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
  const importance = clamp(Number(word.importance) || 3, 0, 5);
  let score =
    forgetProb * 55 +
    fields.difficulty_score * 22 +
    overdueDays * 12 +
    fields.lapse_count * 8 +
    importance * 4;
  if (hardMode) score += forgetProb * 10 + fields.difficulty_score * 8 + (word.error_rate || 0) * 0.2;
  return {
    score,
    forget_probability: Number(forgetProb.toFixed(4)),
    overdue_days: Number(overdueDays.toFixed(3)),
  };
};

/**
 * 计算掌握度（0-99）。
 * @param {object} word
 */
export const calculateMastery = (word = {}) => {
  const fields = normalizeReviewFields(word);
  const elapsedDays = computeElapsedDays(word, new Date());
  const forgetProbability = 1 - computeRetrievabilityByStability(fields.stability, elapsedDays);
  return clamp(
    Math.round((1 - (forgetProbability * 0.72 + fields.difficulty_score * 0.28)) * 100),
    1,
    99
  );
};
