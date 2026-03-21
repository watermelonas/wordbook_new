/**
 * 数据转换工具模块 (dataTransformer.js)
 *
 * 功能：
 * - 将数据库的 snake_case 字段转换为 JavaScript 的 camelCase
 * - 将 JavaScript 的 camelCase 字段转换为数据库的 snake_case
 * - 支持批量转换
 *
 * 为什么需要转换：
 * - 数据库使用 snake_case（SQL 命名规范）
 * - JavaScript 使用 camelCase（JS 命名规范）
 * - 转换层确保两端都遵循各自的规范
 *
 * 字段映射：
 * - repeat_count ↔ repeatCount
 * - view_count ↔ viewCount
 * - create_time ↔ createTime
 * - is_favorite ↔ isFavorite
 * - 等等...
 */

/**
 * 数据库行 → JavaScript 对象
 * 将 snake_case 字段转换为 camelCase
 *
 * 用途：
 * - 从数据库查询后转换数据
 * - 确保 JavaScript 代码使用 camelCase
 * - 提高代码可读性和一致性
 *
 * @param {Object} dbRow - 数据库行对象
 * @returns {Object} JavaScript 对象
 *
 * @example
 * const dbRow = { repeat_count: 5, create_time: '2026-03-21' };
 * const jsObj = dbToJs(dbRow);
 * // jsObj = { repeatCount: 5, createTime: '2026-03-21' }
 */
export function dbToJs(dbRow) {
  if (!dbRow) return null;

  return {
    // ========== 基础字段 ==========
    id: dbRow.id,  // 单词 ID
    english: dbRow.english,  // 英文单词
    chinese: dbRow.chinese,  // 中文释义

    // ========== 学习相关 ==========
    repeatCount: dbRow.repeat_count,  // 学习次数
    viewCount: dbRow.view_count,  // 查看次数
    examCount: dbRow.exam_count,  // 真题出现次数

    // ========== 时间字段 ==========
    createTime: dbRow.create_time,  // 创建时间
    updateTime: dbRow.update_time,  // 更新时间
    masteredAt: dbRow.mastered_at,  // 斩掉时间
    firstLearnedAt: dbRow.first_learned_at,  // 首次学习时间
    firstDayDueAt: dbRow.first_day_due_at,  // 首日巩固到期时间
    lastWrongAt: dbRow.last_wrong_at,  // 上次答错时间
    createdAt: dbRow.created_at,  // 创建时间（备用）
    updatedAt: dbRow.updated_at,  // 更新时间（备用）
    nextReviewTime: dbRow.next_review_time,  // 下次复习时间
    lastReviewedAt: dbRow.last_reviewed_at,  // 上次复习时间

    // ========== 布尔字段 ==========
    isFavorite: dbRow.is_favorite,  // 是否收藏
    isMastered: dbRow.is_mastered,  // 是否已斩掉

    // ========== 其他字段 ==========
    sourcePage: dbRow.source_page,  // 纸质书页码
    year: dbRow.year,  // 真题年份
    tags: dbRow.tags,  // 标签
    importance: dbRow.importance,  // 重要程度

    // ========== FSRS 算法相关 ==========
    difficulty: dbRow.difficulty,  // 难度
    stability: dbRow.stability,  // 稳定性
    retrievability: dbRow.retrievability,  // 可检索性
    intervalDays: dbRow.interval_days,  // 复习间隔（天）
    lapseCount: dbRow.lapse_count,  // 失误次数
    reviewCount: dbRow.review_count,  // 复习次数

    // ========== 学习统计 ==========
    seenCount: dbRow.seen_count,  // 见过次数
    correctCount: dbRow.correct_count,  // 正确次数
    wrongCount: dbRow.wrong_count,  // 错误次数
    consecutiveCorrect: dbRow.consecutive_correct,  // 连续正确次数
    errorCount: dbRow.error_count,  // 错误计数
    recoverCount: dbRow.recover_count,  // 恢复计数

    // ========== 其他 ==========
    lastBookId: dbRow.last_book_id,  // 上次使用的词书 ID
    firstDayStage: dbRow.first_day_stage,  // 首日巩固阶段
    wordbookType: dbRow.wordbook_type,  // 单词本类型
    errorRate: dbRow.error_rate,  // 错误率
    reviewFrequency: dbRow.review_frequency,  // 复习频率
    difficultyScore: dbRow.difficulty_score,  // 难度分数
  };
}

/**
 * JavaScript 对象 → 数据库行
 * 将 camelCase 字段转换为 snake_case
 *
 * 用途：
 * - 保存数据到数据库前转换数据
 * - 确保数据库使用 snake_case
 * - 保持数据库规范一致
 *
 * @param {Object} jsObj - JavaScript 对象
 * @returns {Object} 数据库行对象
 *
 * @example
 * const jsObj = { repeatCount: 5, createTime: '2026-03-21' };
 * const dbRow = jsToDb(jsObj);
 * // dbRow = { repeat_count: 5, create_time: '2026-03-21' }
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
