/**
 * 参数验证模块
 * 统一的数据验证和错误处理
 */

import { logger } from './errorHandler.js';

/**
 * 验证单词对象
 */
export function validateWord(word) {
  if (!word || typeof word !== 'object') {
    throw new Error('单词必须是对象');
  }

  if (!word.english || typeof word.english !== 'string') {
    throw new Error('单词英文不能为空');
  }

  if (word.english.trim().length === 0) {
    throw new Error('单词英文不能为空字符串');
  }

  if (word.chinese && typeof word.chinese !== 'string') {
    throw new Error('单词中文必须是字符串');
  }

  if (word.importance !== undefined && word.importance !== null) {
    const imp = Number(word.importance);
    if (isNaN(imp) || imp < 0 || imp > 5) {
      throw new Error('重要性必须是 0-5 之间的数字');
    }
  }

  return true;
}

/**
 * 验证复习数据
 */
export function validateReviewData(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('复习数据必须是对象');
  }

  if (typeof data.isCorrect !== 'boolean') {
    throw new Error('isCorrect 必须是布尔值');
  }

  if (data.difficulty_score !== undefined && data.difficulty_score !== null) {
    const score = Number(data.difficulty_score);
    if (isNaN(score) || score < 0.15 || score > 0.98) {
      throw new Error('难度分数必须在 0.15-0.98 之间');
    }
  }

  if (data.stability !== undefined && data.stability !== null) {
    const stab = Number(data.stability);
    if (isNaN(stab) || stab < 0.2) {
      throw new Error('稳定性必须是正数');
    }
  }

  return true;
}

/**
 * 验证 SQL 参数（防止 SQL 注入）
 */
export function validateSqlParams(params) {
  if (!Array.isArray(params)) {
    throw new Error('SQL 参数必须是数组');
  }

  // 检查参数中是否包含危险的 SQL 关键字
  for (const param of params) {
    if (typeof param === 'string') {
      const dangerous = [
        'DROP TABLE',
        'DELETE FROM',
        'TRUNCATE',
        'ALTER TABLE',
        'INSERT INTO',
        'UPDATE',
      ];

      const upper = param.toUpperCase();
      for (const keyword of dangerous) {
        if (upper.includes(keyword)) {
          logger.warn('validators', '检测到潜在的 SQL 注入', { param });
          throw new Error('不允许的 SQL 操作');
        }
      }
    }
  }

  return true;
}

/**
 * 验证单词 ID
 */
export function validateWordId(id) {
  if (!id) {
    throw new Error('单词 ID 不能为空');
  }

  if (typeof id !== 'string' && typeof id !== 'number') {
    throw new Error('单词 ID 必须是字符串或数字');
  }

  return true;
}

/**
 * 验证书籍 ID
 */
export function validateBookId(bookId) {
  if (!bookId) {
    throw new Error('书籍 ID 不能为空');
  }

  if (typeof bookId !== 'string') {
    throw new Error('书籍 ID 必须是字符串');
  }

  return true;
}

/**
 * 验证分页参数
 */
export function validatePaginationParams(pageSize, pageIndex) {
  const size = Number(pageSize);
  const index = Number(pageIndex);

  if (isNaN(size) || size < 1 || size > 1000) {
    throw new Error('页面大小必须在 1-1000 之间');
  }

  if (isNaN(index) || index < 0) {
    throw new Error('页码必须是非负整数');
  }

  return true;
}

/**
 * 安全的数据验证包装器
 */
export function safeValidate(validatorFn, data, errorMessage = '数据验证失败') {
  try {
    return validatorFn(data);
  } catch (e) {
    logger.error('validators', errorMessage, e);
    throw e;
  }
}
