/**
 * 数据修复工具模块 (dataRepair.js)
 *
 * 功能：
 * - 检测学习档案中的数据一致性问题
 * - 自动修复无效或不一致的数据
 * - 验证数据的有效性和完整性
 * - 生成修复报告
 *
 * 检测项：
 * 1. 无效的 key：档案 key 不符合规范
 * 2. 缺失字段：必填字段（如 english）为空
 * 3. 无效值：数值超出有效范围
 * 4. 计数错误：计数字段为负数
 *
 * 修复策略：
 * - 无效档案：直接删除
 * - 缺失字段：使用默认值
 * - 无效值：夹紧到有效范围
 * - 计数错误：重置为 0
 *
 * 使用场景：
 * - 应用启动时检测数据完整性
 * - 数据迁移时修复不兼容的数据
 * - 定期维护数据库
 */

import { logger } from './errorHandler.js';
import { normalizeProfile, normalizeWordKey } from './learningCenter_v2.js';

/**
 * 检测数据一致性问题
 *
 * 功能：
 * - 遍历所有学习档案
 * - 检查每个档案的有效性
 * - 记录所有发现的问题
 * - 生成问题报告
 *
 * 检查项：
 * - 档案对象的有效性
 * - 必填字段的完整性
 * - 数值字段的范围有效性
 * - 计数字段的非负性
 *
 * @param {object} profiles - 学习档案对象，格式 { key: profile, ... }
 * @returns {object} 问题报告，包含：
 *   - invalidKeys: 无效 key 的列表
 *   - missingFields: 缺失字段的列表
 *   - invalidValues: 无效值的列表
 *   - total: 问题总数
 *
 * @example
 * const issues = detectDataIssues(profiles);
 * if (issues.total > 0) {
 *   console.log('发现', issues.total, '个问题');
 *   console.log('无效 key:', issues.invalidKeys);
 * }
 */
export function detectDataIssues(profiles = {}) {
  const issues = {
    invalidKeys: [],  // 无效的档案 key
    missingFields: [],  // 缺失的必填字段
    invalidValues: [],  // 无效的字段值
    total: 0,  // 问题总数
  };

  // 遍历所有档案
  for (const [key, profile] of Object.entries(profiles)) {
    // 检查档案对象的有效性
    if (!profile || typeof profile !== 'object') {
      issues.invalidKeys.push(key);
      issues.total++;
      continue;
    }

    // 检查必填字段：english（单词英文）
    if (!profile.english || typeof profile.english !== 'string') {
      issues.missingFields.push({ key, field: 'english' });
      issues.total++;
    }

    // 检查掌握度（0-100）
    if (profile.mastery !== undefined) {
      const mastery = Number(profile.mastery);
      if (isNaN(mastery) || mastery < 0 || mastery > 100) {
        issues.invalidValues.push({ key, field: 'mastery', value: profile.mastery });
        issues.total++;
      }
    }

    // 检查难度分数（0.15-0.98）
    if (profile.difficulty_score !== undefined) {
      const score = Number(profile.difficulty_score);
      if (isNaN(score) || score < 0.15 || score > 0.98) {
        issues.invalidValues.push({ key, field: 'difficulty_score', value: profile.difficulty_score });
        issues.total++;
      }
    }

    // 检查计数字段（必须是非负整数）
    const countFields = ['seenCount', 'correctCount', 'wrongCount', 'lapse_count', 'review_count'];
    for (const field of countFields) {
      if (profile[field] !== undefined) {
        const count = Number(profile[field]);
        if (isNaN(count) || count < 0) {
          issues.invalidValues.push({ key, field, value: profile[field] });
          issues.total++;
        }
      }
    }
  }

  return issues;
}

/**
 * 修复数据一致性问题
 */
export function repairData(profiles = {}) {
  const repaired = {};
  let fixedCount = 0;

  for (const [key, profile] of Object.entries(profiles)) {
    try {
      if (!profile || typeof profile !== 'object') {
        logger.warn('dataRepair', '跳过无效档案', { key });
        continue;
      }

      // 规范化档案
      const normalized = normalizeProfile(profile);

      // 修复缺失的必填字段
      if (!normalized.english) {
        logger.warn('dataRepair', '档案缺少 english 字段，跳过', { key });
        continue;
      }

      // 修复数值范围
      if (normalized.mastery < 0 || normalized.mastery > 100) {
        normalized.mastery = Math.max(0, Math.min(100, normalized.mastery));
        fixedCount++;
      }

      // 修复计数字段
      const countFields = ['seenCount', 'correctCount', 'wrongCount', 'lapse_count', 'review_count'];
      for (const field of countFields) {
        if (normalized[field] < 0) {
          normalized[field] = 0;
          fixedCount++;
        }
      }

      // 确保 correctCount <= seenCount
      if (normalized.correctCount > normalized.seenCount) {
        normalized.correctCount = normalized.seenCount;
        fixedCount++;
      }

      // 确保 wrongCount <= seenCount
      if (normalized.wrongCount > normalized.seenCount) {
        normalized.wrongCount = normalized.seenCount;
        fixedCount++;
      }

      repaired[normalized.key] = normalized;
    } catch (e) {
      logger.error('dataRepair', '修复档案失败', { key, error: e.message });
    }
  }

  logger.info('dataRepair', '数据修复完成', { total: Object.keys(profiles).length, fixed: fixedCount });
  return { repaired, fixedCount };
}

/**
 * 验证修复后的数据
 */
export function validateRepairResult(original = {}, repaired = {}) {
  const validation = {
    originalCount: Object.keys(original).length,
    repairedCount: Object.keys(repaired).length,
    issues: detectDataIssues(repaired),
    isValid: true,
  };

  if (validation.issues.total > 0) {
    validation.isValid = false;
    logger.warn('dataRepair', '修复后仍存在问题', validation.issues);
  }

  return validation;
}

/**
 * 生成修复报告
 */
export function generateRepairReport(original = {}, repaired = {}, fixedCount = 0) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      originalCount: Object.keys(original).length,
      repairedCount: Object.keys(repaired).length,
      fixedCount,
      successRate: Object.keys(original).length > 0
        ? ((Object.keys(repaired).length / Object.keys(original).length) * 100).toFixed(2) + '%'
        : '0%',
    },
    beforeIssues: detectDataIssues(original),
    afterIssues: detectDataIssues(repaired),
  };

  logger.info('dataRepair', '修复报告', report);
  return report;
}

/**
 * 自动修复存储中的数据
 */
export async function autoRepairStorageData(storageKey, readFn, writeFn) {
  try {
    logger.info('dataRepair', '开始自动修复存储数据', { storageKey });

    // 读取原始数据
    const original = readFn();
    if (!original || Object.keys(original).length === 0) {
      logger.info('dataRepair', '没有数据需要修复');
      return { success: true, message: '没有数据需要修复' };
    }

    // 检测问题
    const issues = detectDataIssues(original);
    if (issues.total === 0) {
      logger.info('dataRepair', '数据完整性检查通过');
      return { success: true, message: '数据完整性检查通过' };
    }

    // 修复数据
    const { repaired, fixedCount } = repairData(original);

    // 验证修复结果
    const validation = validateRepairResult(original, repaired);
    if (!validation.isValid) {
      logger.error('dataRepair', '修复失败，数据仍存在问题', validation);
      return { success: false, message: '修复失败', validation };
    }

    // 保存修复后的数据
    writeFn(repaired);

    // 生成报告
    const report = generateRepairReport(original, repaired, fixedCount);

    return {
      success: true,
      message: '数据修复成功',
      report,
    };
  } catch (e) {
    logger.error('dataRepair', '自动修复失败', e);
    return { success: false, message: '自动修复失败', error: e.message };
  }
}
