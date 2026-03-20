/**
 * 数据转换工具
 * 将数据库的 snake_case 字段转换为 JavaScript 的 camelCase
 */

/**
 * 数据库行 → JavaScript 对象
 * 将 snake_case 字段转换为 camelCase
 * @param {Object} dbRow - 数据库行对象
 * @returns {Object} JavaScript 对象
 */
export function dbToJs(dbRow) {
  if (!dbRow) return null;

  return {
    // 基础字段
    id: dbRow.id,
    english: dbRow.english,
    chinese: dbRow.chinese,

    // 学习相关（snake_case → camelCase）
    repeatCount: dbRow.repeat_count,
    viewCount: dbRow.view_count,
    examCount: dbRow.exam_count,

    // 时间字段
    createTime: dbRow.create_time,
    updateTime: dbRow.update_time,
    masteredAt: dbRow.mastered_at,
    firstLearnedAt: dbRow.first_learned_at,
    firstDayDueAt: dbRow.first_day_due_at,
    lastWrongAt: dbRow.last_wrong_at,
    createdAt: dbRow.created_at,
    updatedAt: dbRow.updated_at,
    nextReviewTime: dbRow.next_review_time,
    lastReviewedAt: dbRow.last_reviewed_at,

    // 布尔字段
    isFavorite: dbRow.is_favorite,
    isMastered: dbRow.is_mastered,

    // 其他字段
    sourcePage: dbRow.source_page,
    year: dbRow.year,
    tags: dbRow.tags,
    importance: dbRow.importance,

    // FSRS 相关
    difficulty: dbRow.difficulty,
    stability: dbRow.stability,
    retrievability: dbRow.retrievability,
    intervalDays: dbRow.interval_days,
    lapseCount: dbRow.lapse_count,
    reviewCount: dbRow.review_count,

    // 学习统计
    seenCount: dbRow.seen_count,
    correctCount: dbRow.correct_count,
    wrongCount: dbRow.wrong_count,
    consecutiveCorrect: dbRow.consecutive_correct,
    errorCount: dbRow.error_count,
    recoverCount: dbRow.recover_count,

    // 其他
    lastBookId: dbRow.last_book_id,
    firstDayStage: dbRow.first_day_stage,
    wordbookType: dbRow.wordbook_type,
    errorRate: dbRow.error_rate,
    reviewFrequency: dbRow.review_frequency,
    difficultyScore: dbRow.difficulty_score,
  };
}

/**
 * JavaScript 对象 → 数据库行
 * 将 camelCase 字段转换为 snake_case
 * @param {Object} jsObj - JavaScript 对象
 * @returns {Object} 数据库行对象
 */
export function jsToDb(jsObj) {
  if (!jsObj) return null;

  const result = {};

  // 只转换需要更新的字段
  if (jsObj.repeatCount !== undefined) result.repeat_count = jsObj.repeatCount;
  if (jsObj.viewCount !== undefined) result.view_count = jsObj.viewCount;
  if (jsObj.examCount !== undefined) result.exam_count = jsObj.examCount;
  if (jsObj.createTime !== undefined) result.create_time = jsObj.createTime;
  if (jsObj.updateTime !== undefined) result.update_time = jsObj.updateTime;
  if (jsObj.masteredAt !== undefined) result.mastered_at = jsObj.masteredAt;
  if (jsObj.firstLearnedAt !== undefined) result.first_learned_at = jsObj.firstLearnedAt;
  if (jsObj.firstDayDueAt !== undefined) result.first_day_due_at = jsObj.firstDayDueAt;
  if (jsObj.lastWrongAt !== undefined) result.last_wrong_at = jsObj.lastWrongAt;
  if (jsObj.createdAt !== undefined) result.created_at = jsObj.createdAt;
  if (jsObj.updatedAt !== undefined) result.updated_at = jsObj.updatedAt;
  if (jsObj.nextReviewTime !== undefined) result.next_review_time = jsObj.nextReviewTime;
  if (jsObj.lastReviewedAt !== undefined) result.last_reviewed_at = jsObj.lastReviewedAt;
  if (jsObj.isFavorite !== undefined) result.is_favorite = jsObj.isFavorite;
  if (jsObj.isMastered !== undefined) result.is_mastered = jsObj.isMastered;
  if (jsObj.sourcePage !== undefined) result.source_page = jsObj.sourcePage;
  if (jsObj.importance !== undefined) result.importance = jsObj.importance;
  if (jsObj.difficulty !== undefined) result.difficulty = jsObj.difficulty;
  if (jsObj.stability !== undefined) result.stability = jsObj.stability;
  if (jsObj.retrievability !== undefined) result.retrievability = jsObj.retrievability;
  if (jsObj.intervalDays !== undefined) result.interval_days = jsObj.intervalDays;
  if (jsObj.lapseCount !== undefined) result.lapse_count = jsObj.lapseCount;
  if (jsObj.reviewCount !== undefined) result.review_count = jsObj.reviewCount;
  if (jsObj.seenCount !== undefined) result.seen_count = jsObj.seenCount;
  if (jsObj.correctCount !== undefined) result.correct_count = jsObj.correctCount;
  if (jsObj.wrongCount !== undefined) result.wrong_count = jsObj.wrongCount;
  if (jsObj.consecutiveCorrect !== undefined) result.consecutive_correct = jsObj.consecutiveCorrect;
  if (jsObj.errorCount !== undefined) result.error_count = jsObj.errorCount;
  if (jsObj.recoverCount !== undefined) result.recover_count = jsObj.recoverCount;
  if (jsObj.lastBookId !== undefined) result.last_book_id = jsObj.lastBookId;
  if (jsObj.firstDayStage !== undefined) result.first_day_stage = jsObj.firstDayStage;
  if (jsObj.wordbookType !== undefined) result.wordbook_type = jsObj.wordbookType;
  if (jsObj.errorRate !== undefined) result.error_rate = jsObj.errorRate;
  if (jsObj.reviewFrequency !== undefined) result.review_frequency = jsObj.reviewFrequency;
  if (jsObj.difficultyScore !== undefined) result.difficulty_score = jsObj.difficultyScore;

  return result;
}

/**
 * 批量转换数据库行数组
 * @param {Array} rows - 数据库行数组
 * @returns {Array} JavaScript 对象数组
 */
export function dbRowsToJs(rows) {
  return (rows || []).map(dbToJs).filter(Boolean);
}

/**
 * 批量转换 JavaScript 对象数组
 * @param {Array} rows - JavaScript 对象数组
 * @returns {Array} 数据库行数组
 */
export function jsRowsToDb(rows) {
  return (rows || []).map(jsToDb).filter(Boolean);
}

/**
 * 合并两个对象，优先使用第一个对象的值
 * 用于在转换时保留原始字段
 * @param {Object} target - 目标对象
 * @param {Object} source - 源对象
 * @returns {Object} 合并后的对象
 */
export function mergeDbToJs(target, source) {
  return {
    ...dbToJs(source),
    ...target,
  };
}
