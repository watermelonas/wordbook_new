/**
 * 新模块集成指南
 *
 * 本指南说明如何在现有项目中集成新的重构模块
 * 保持向后兼容性，逐步迁移
 */

/**
 * ============================================================================
 * 第一步：在 App.vue 中初始化应用
 * ============================================================================
 *
 * 打开 App.vue，在 onLoad 和 onUnload 中添加初始化代码：
 *
 * <script setup>
 * import { onLoad, onUnload } from '@dcloudio/uni-app';
 * import { initializeApp, cleanupApp } from './src/utils/appInitializer.js';
 *
 * onLoad(async () => {
 *   try {
 *     await initializeApp();
 *   } catch (error) {
 *     console.error('应用初始化失败:', error);
 *   }
 * });
 *
 * onUnload(() => {
 *   cleanupApp();
 * });
 * </script>
 */

/**
 * ============================================================================
 * 第二步：在页面中使用新的数据库模块
 * ============================================================================
 *
 * 旧代码：
 *   import db from '../../src/utils/db';
 *
 * 新代码：
 *   import db from '../../src/utils/db_v2';
 *
 * 使用方式完全相同，无需修改其他代码。
 */

/**
 * ============================================================================
 * 第三步：在页面中使用新的学习中心模块
 * ============================================================================
 *
 * 旧代码：
 *   import * as learningCenter from '../../src/utils/learningCenter.js';
 *
 * 新代码：
 *   import * as learningCenter from '../../src/utils/learningCenter_v2.js';
 *
 * 使用方式完全相同，无需修改其他代码。
 */

/**
 * ============================================================================
 * 第四步：添加错误处理
 * ============================================================================
 *
 * 在关键操作中添加错误处理：
 *
 * import { logger, errorHandler } from '../../src/utils/errorHandler.js';
 *
 * try {
 *   await db.addWord(word);
 * } catch (error) {
 *   errorHandler.handleException(error, { operation: 'addWord' });
 *   uni.showToast({ title: '添加失败', icon: 'error' });
 * }
 *
 * 或使用包装器简化代码：
 *
 * import { withErrorHandling } from '../../src/utils/errorHandler.js';
 *
 * const addWordSafe = withErrorHandling(db.addWord, 'AddWord');
 * await addWordSafe(word);
 */

/**
 * ============================================================================
 * 第五步：在页面卸载时清理缓存
 * ============================================================================
 *
 * 在页面的 onUnload 中添加缓存清理：
 *
 * import { cleanupExpiredCaches } from '../../src/utils/learningCenter_v2.js';
 *
 * onUnload(() => {
 *   cleanupExpiredCaches();
 * });
 */

/**
 * ============================================================================
 * 第六步：配置应用参数
 * ============================================================================
 *
 * 如需自定义配置，在 appInitializer.js 之后修改：
 *
 * import { setConfig } from '../../src/utils/appConfig.js';
 *
 * // 修改缓存大小
 * setConfig('cache.MEMORY_CACHE_SIZE', 300);
 *
 * // 修改缓存过期时间
 * setConfig('cache.MEMORY_CACHE_TTL_MS', 10 * 60 * 1000);
 *
 * // 启用/禁用功能
 * setConfig('features.ENABLE_AUTO_CLEANUP', true);
 */

/**
 * ============================================================================
 * 完整示例：更新 pages/index/index.vue
 * ============================================================================
 *
 * <template>
 *   <view class="container">
 *     <!-- 页面内容 -->
 *   </view>
 * </template>
 *
 * <script setup>
 * import { ref, onLoad, onUnload } from 'vue';
 * import { onShow } from '@dcloudio/uni-app';
 * import db from '../../src/utils/db_v2';
 * import * as learningCenter from '../../src/utils/learningCenter_v2.js';
 * import { logger, errorHandler } from '../../src/utils/errorHandler.js';
 * import { cleanupExpiredCaches } from '../../src/utils/learningCenter_v2.js';
 *
 * const words = ref([]);
 * const loading = ref(false);
 *
 * const loadWords = async () => {
 *   loading.value = true;
 *   try {
 *     const result = await db.getWordsForList(20, 0, 'create_time', 'desc');
 *     words.value = result;
 *     logger.info('Index', '加载单词成功', { count: result.length });
 *   } catch (error) {
 *     errorHandler.handleException(error, { operation: 'loadWords' });
 *     uni.showToast({ title: '加载失败', icon: 'error' });
 *   } finally {
 *     loading.value = false;
 *   }
 * };
 *
 * onLoad(() => {
 *   loadWords();
 * });
 *
 * onShow(() => {
 *   // 页面显示时刷新数据
 *   loadWords();
 * });
 *
 * onUnload(() => {
 *   // 页面卸载时清理缓存
 *   cleanupExpiredCaches();
 * });
 * </script>
 */

/**
 * ============================================================================
 * 完整示例：更新 pages/review/review.vue
 * ============================================================================
 *
 * <script setup>
 * import { ref, onLoad, onUnload } from 'vue';
 * import db from '../../src/utils/db_v2';
 * import * as learningCenter from '../../src/utils/learningCenter_v2.js';
 * import { logger, errorHandler, withErrorHandling } from '../../src/utils/errorHandler.js';
 * import { cleanupExpiredCaches } from '../../src/utils/learningCenter_v2.js';
 *
 * const reviewWords = ref([]);
 * const currentIndex = ref(0);
 * const correctCount = ref(0);
 * const wrongCount = ref(0);
 *
 * const loadReviewWords = async () => {
 *   try {
 *     const words = await db.getReviewWords({
 *       sortBy: 'smart',
 *       count: 20,
 *       difficulty: 'normal'
 *     });
 *     reviewWords.value = words;
 *     logger.info('Review', '加载复习单词成功', { count: words.length });
 *   } catch (error) {
 *     errorHandler.handleException(error, { operation: 'loadReviewWords' });
 *   }
 * };
 *
 * const handleAnswer = async (isCorrect) => {
 *   try {
 *     const word = reviewWords.value[currentIndex.value];
 *     if (!word) return;
 *
 *     // 记录复习结果
 *     learningCenter.recordReviewOutcome(word, isCorrect);
 *
 *     // 更新错误率
 *     await db.updateErrorRate(word.id, isCorrect);
 *
 *     // 更新统计
 *     if (isCorrect) {
 *       correctCount.value++;
 *     } else {
 *       wrongCount.value++;
 *     }
 *
 *     // 移到下一个单词
 *     currentIndex.value++;
 *
 *     logger.info('Review', '答题记录', { word: word.english, isCorrect });
 *   } catch (error) {
 *     errorHandler.handleException(error, { operation: 'handleAnswer' });
 *   }
 * };
 *
 * onLoad(() => {
 *   loadReviewWords();
 * });
 *
 * onUnload(() => {
 *   cleanupExpiredCaches();
 * });
 * </script>
 */

/**
 * ============================================================================
 * 迁移检查清单
 * ============================================================================
 *
 * [ ] 在 App.vue 中调用 initializeApp()
 * [ ] 在 App.vue 中调用 cleanupApp()
 * [ ] 更新 pages/index/index.vue 的导入
 * [ ] 更新 pages/review/review.vue 的导入
 * [ ] 更新 pages/word-detail/word-detail.vue 的导入
 * [ ] 更新 pages/quick-add/quick-add.vue 的导入
 * [ ] 添加错误处理到关键操作
 * [ ] 在页面卸载时清理缓存
 * [ ] 测试所有功能
 * [ ] 验证性能改进
 * [ ] 收集用户反馈
 */

/**
 * ============================================================================
 * 常见问题
 * ============================================================================
 *
 * Q: 新模块是否会破坏现有功能？
 * A: 不会。新模块保持了相同的 API，只是改进了内部实现。
 *
 * Q: 是否需要修改数据库结构？
 * A: 不需要。新模块完全兼容现有数据。
 *
 * Q: 如何处理旧的 db.js 和 learningCenter.js？
 * A: 可以保留，也可以删除。建议先保留以便回滚。
 *
 * Q: 缓存过期时间可以调整吗？
 * A: 可以。在 appConfig.js 中修改 CacheConfig。
 *
 * Q: 如何监控应用性能？
 * A: 使用 logger.getLogs() 获取日志，或 globalErrorManager.getDiagnostics() 获取诊断信息。
 *
 * Q: 如何导出日志用于调试？
 * A: 使用 logger.exportAsJson() 或 logger.exportAsCsv()。
 */

/**
 * ============================================================================
 * 性能优化建议
 * ============================================================================
 *
 * 1. 使用缓存减少数据库查询
 *    const cache = new MemoryCache(100, 5 * 60 * 1000);
 *    cache.set('key', value);
 *
 * 2. 使用错误处理包装器简化代码
 *    const safeFn = withErrorHandling(asyncFn, 'MyOperation');
 *
 * 3. 定期清理过期缓存
 *    cleanupExpiredCaches();
 *
 * 4. 监控慢操作
 *    logger.info('SlowOperation', `耗时: ${duration}ms`);
 *
 * 5. 使用性能监控装饰器
 *    const monitoredFn = withPerformanceMonitoring(asyncFn, 'MyOperation');
 */

export const INTEGRATION_GUIDE = {
  version: '1.0',
  date: '2026-03-17',
  steps: [
    '在 App.vue 中初始化应用',
    '更新页面组件的导入语句',
    '添加错误处理',
    '在页面卸载时清理缓存',
    '配置应用参数',
    '测试所有功能',
    '监控性能指标',
  ],
  checklist: [
    '在 App.vue 中调用 initializeApp()',
    '在 App.vue 中调用 cleanupApp()',
    '更新所有页面的导入语句',
    '添加错误处理到关键操作',
    '在页面卸载时清理缓存',
    '测试所有功能',
    '验证性能改进',
  ],
};
