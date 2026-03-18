/**
 * 快速参考指南
 * Quick Reference Guide
 *
 * 本文件提供新模块和集成的快速参考
 */

/**
 * ============================================================================
 * 新模块快速参考
 * ============================================================================
 */

/**
 * 1. sqlHelper.js - SQL 工具
 *
 * 导入：
 *   import { sqlLiteral, bindSql, toJsonString, parseJsonSafe } from './sqlHelper.js';
 *
 * 常用函数：
 *   - sqlLiteral(value)              // SQL 参数转义
 *   - bindSql(sql, params)           // SQL 参数绑定
 *   - toJsonString(obj)              // 对象转 JSON 字符串
 *   - parseJsonSafe(str, default)    // 安全解析 JSON
 */

/**
 * 2. cacheManager.js - 缓存管理
 *
 * 导入：
 *   import { MemoryCache, StorageCache, HybridCache } from './cacheManager.js';
 *
 * 使用示例：
 *   const cache = new MemoryCache(100, 5 * 60 * 1000);  // 100 条记录，5 分钟过期
 *   cache.set('key', value);
 *   const value = cache.get('key');
 *   cache.clear();
 */

/**
 * 3. databaseAdapter.js - 数据库适配器
 *
 * 导入：
 *   import { createDatabaseAdapter } from './databaseAdapter.js';
 *
 * 使用示例：
 *   const adapter = createDatabaseAdapter();
 *   await adapter.execute(sql, params);
 *   const result = await adapter.query(sql, params);
 */

/**
 * 4. db_v2.js - 改进的数据库管理器
 *
 * 导入：
 *   import db from './db_v2.js';
 *
 * 常用方法：
 *   - await db.init()                           // 初始化
 *   - await db.getWords()                       // 获取所有单词
 *   - await db.addWord(word)                    // 添加单词
 *   - await db.updateWord(id, updates)          // 更新单词
 *   - await db.deleteWord(id)                   // 删除单词
 *   - await db.masterWord(id)                   // 标记为已掌握（事务保护）
 */

/**
 * 5. learningCenter_v2.js - 改进的学习中心
 *
 * 导入：
 *   import * as learningCenter from './learningCenter_v2.js';
 *
 * 常用函数：
 *   - learningCenter.getWordProfile(word)       // 获取单词档案
 *   - learningCenter.recordReviewOutcome(word, isCorrect)  // 记录复习结果
 *   - learningCenter.getMistakeWords()          // 获取错词
 *   - learningCenter.cleanupExpiredCaches()     // 清理过期缓存
 */

/**
 * 6. errorHandler.js - 错误处理和日志
 *
 * 导入：
 *   import { logger, errorHandler, globalErrorManager } from './errorHandler.js';
 *
 * 常用方法：
 *   - logger.info(tag, message, data)           // 记录信息
 *   - logger.warn(tag, message, data)           // 记录警告
 *   - logger.error(tag, message, error)         // 记录错误
 *   - errorHandler.handleException(error, context)  // 处理异常
 *   - logger.exportAsJson()                     // 导出日志为 JSON
 *   - logger.exportAsCsv()                      // 导出日志为 CSV
 */

/**
 * 7. appConfig.js - 应用配置
 *
 * 导入：
 *   import { appConfig, getConfig, setConfig } from './appConfig.js';
 *
 * 常用方法：
 *   - getConfig('cache.MEMORY_CACHE_SIZE')      // 获取配置
 *   - setConfig('cache.MEMORY_CACHE_SIZE', 300) // 设置配置
 *   - appConfig.validate()                      // 验证配置
 *   - appConfig.exportAsJson()                  // 导出配置
 */

/**
 * 8. appInitializer.js - 应用初始化
 *
 * 导入：
 *   import { initializeApp, cleanupApp } from './appInitializer.js';
 *
 * 使用示例：
 *   // 在 App.vue 的 onLoad 中
 *   await initializeApp();
 *
 *   // 在 App.vue 的 onUnload 中
 *   cleanupApp();
 */

/**
 * ============================================================================
 * 集成快速参考
 * ============================================================================
 */

/**
 * 在 App.vue 中集成：
 *
 * <script>
 *   import { initializeApp, cleanupApp } from './src/utils/appInitializer.js';
 *
 *   export default {
 *     onLaunch() {
 *       await initializeApp();
 *     },
 *     onUnload() {
 *       cleanupApp();
 *     }
 *   }
 * </script>
 */

/**
 * 在页面中集成：
 *
 * <script setup>
 *   import { logger } from '../../src/utils/errorHandler.js';
 *   import { cleanupExpiredCaches } from '../../src/utils/learningCenter_v2.js';
 *   import { onUnload } from '@dcloudio/uni-app';
 *
 *   onUnload(() => {
 *     try {
 *       cleanupExpiredCaches();
 *     } catch (error) {
 *       logger.warn('PageName', '清理缓存失败', error);
 *     }
 *   });
 * </script>
 */

/**
 * 在操作中添加错误处理：
 *
 * import { errorHandler } from '../../src/utils/errorHandler.js';
 *
 * try {
 *   await db.addWord(word);
 * } catch (error) {
 *   errorHandler.handleException(error, { operation: 'addWord' });
 *   uni.showToast({ title: '添加失败', icon: 'error' });
 * }
 */

/**
 * ============================================================================
 * 常用配置
 * ============================================================================
 */

/**
 * 缓存配置：
 *   cache.MEMORY_CACHE_SIZE: 500              // 内存缓存大小
 *   cache.MEMORY_CACHE_TTL_MS: 5 * 60 * 1000  // 内存缓存过期时间（5 分钟）
 *   cache.STORAGE_CACHE_TTL_MS: 24 * 60 * 60 * 1000  // 存储缓存过期时间（24 小时）
 *
 * 功能开关：
 *   features.ENABLE_CACHE: true                // 启用缓存
 *   features.ENABLE_ERROR_HANDLING: true       // 启用错误处理
 *   features.ENABLE_AUTO_CLEANUP: true         // 启用自动清理
 *   features.AUTO_CLEANUP_INTERVAL: 10 * 60 * 1000  // 自动清理间隔（10 分钟）
 *
 * 日志配置：
 *   log.MIN_LOG_LEVEL: 0                       // 最小日志级别（0=DEBUG）
 *   log.MAX_LOGS: 500                          // 最大日志数量
 *   log.ENABLE_CONSOLE: true                   // 启用控制台输出
 *   log.ENABLE_STORAGE: true                   // 启用本地存储
 */

/**
 * ============================================================================
 * 文档导航
 * ============================================================================
 *
 * 详细文档：
 * - MIGRATION_GUIDE.js       - 迁移指南（如何从旧模块迁移到新模块）
 * - REFACTOR_SUMMARY.js      - 重构总结（改进详情和性能数据）
 * - INTEGRATION_GUIDE.js     - 集成指南（完整的集成示例）
 * - FINAL_SUMMARY.js         - 最终总结（重构完成情况）
 * - INTEGRATION_STATUS.js    - 集成状态（集成进度和测试建议）
 * - PROJECT_COMPLETION.js    - 项目完成总结（整体工作成果）
 *
 * 快速开始：
 * 1. 阅读本文件了解快速参考
 * 2. 查看 INTEGRATION_GUIDE.js 了解集成步骤
 * 3. 参考 INTEGRATION_STATUS.js 了解集成进度
 * 4. 根据需要查看其他详细文档
 */

/**
 * ============================================================================
 * 常见问题快速解答
 * ============================================================================
 */

/**
 * Q: 如何查看错误日志？
 * A: 使用 logger.getLogs() 获取日志数组，或 logger.exportAsJson() 导出为 JSON。
 *
 * Q: 如何禁用某个功能？
 * A: 在 appConfig.js 中修改 FeatureFlags，或使用 setConfig() 动态修改。
 *
 * Q: 缓存过期时间可以调整吗？
 * A: 可以。在 appConfig.js 中修改 CacheConfig，或使用 setConfig() 动态修改。
 *
 * Q: 如何添加自定义错误处理？
 * A: 使用 errorHandler.addHandler() 添加自定义处理器。
 *
 * Q: 新模块会影响现有功能吗？
 * A: 不会。新模块完全向后兼容，所有旧功能保持不变。
 *
 * Q: 如何监控应用性能？
 * A: 使用 globalErrorManager.getDiagnostics() 获取诊断信息。
 */

export const QUICK_REFERENCE = {
  version: '1.0',
  date: '2026-03-17',
  modules: [
    'sqlHelper.js',
    'cacheManager.js',
    'databaseAdapter.js',
    'db_v2.js',
    'learningCenter_v2.js',
    'errorHandler.js',
    'appConfig.js',
    'appInitializer.js',
  ],
  documents: [
    'MIGRATION_GUIDE.js',
    'REFACTOR_SUMMARY.js',
    'INTEGRATION_GUIDE.js',
    'FINAL_SUMMARY.js',
    'INTEGRATION_STATUS.js',
    'PROJECT_COMPLETION.js',
    'QUICK_REFERENCE.js',
  ],
  integratedPages: [
    'App.vue',
    'pages/index/index.vue',
    'pages/review/review.vue',
    'pages/word-detail/word-detail.vue',
    'pages/quick-add/quick-add.vue',
    'pages/mistakes/mistakes.vue',
    'pages/stats/stats.vue',
    'pages/mastered-words/mastered-words.vue',
    'pages/wordbook-list/wordbook-list.vue',
    'pages/my/my.vue',
  ],
};
