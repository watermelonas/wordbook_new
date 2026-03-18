/**
 * 应用初始化模块
 * 在应用启动时执行必要的初始化操作
 */

import { globalErrorManager, logger } from './errorHandler.js';
import { appConfig, validateConfig } from './appConfig.js';
import { cleanupExpiredCaches } from './learningCenter_v2.js';
import db from './db_v2.js';

/**
 * 初始化管理器
 */
class AppInitializer {
  constructor() {
    this.initialized = false;
    this.initPromise = null;
    this.cleanupInterval = null;
  }

  /**
   * 初始化
   */
  async initialize() {
    console.log('[AppInitializer.initialize] 被调用');
    if (this.initialized) {
      console.log('[AppInitializer.initialize] 已初始化，返回');
      return Promise.resolve();
    }
    if (this.initPromise) {
      console.log('[AppInitializer.initialize] 初始化中，返回现有 Promise');
      return this.initPromise;
    }

    console.log('[AppInitializer.initialize] 开始新的初始化');
    this.initPromise = this.doInitialize();
    return this.initPromise;
  }

  /**
   * 执行初始化
   */
  async doInitialize() {
    try {
      logger.info('AppInitializer', '开始初始化应用...');
      console.log('[AppInitializer] 开始初始化应用...');

      // 1. 验证配置
      console.log('[AppInitializer] 验证配置...');
      const validation = validateConfig();
      if (!validation.valid) {
        logger.warn('AppInitializer', '配置验证失败', validation.errors);
        console.warn('[AppInitializer] 配置验证失败:', validation.errors);
      }
      console.log('[AppInitializer] 配置验证完成');

      // 2. 初始化数据库
      console.log('[AppInitializer] 开始初始化数据库...');
      await this.initializeDatabase();
      console.log('[AppInitializer] 数据库初始化完成');

      // 3. 设置全局错误处理
      console.log('[AppInitializer] 设置全局错误处理...');
      this.setupErrorHandling();
      console.log('[AppInitializer] 全局错误处理设置完成');

      // 4. 启动自动清理
      console.log('[AppInitializer] 启动自动清理...');
      this.startAutoCleanup();
      console.log('[AppInitializer] 自动清理启动完成');

      // 5. 设置性能监控
      console.log('[AppInitializer] 设置性能监控...');
      this.setupPerformanceMonitoring();
      console.log('[AppInitializer] 性能监控设置完成');

      logger.info('AppInitializer', '应用初始化完成');
      console.log('[AppInitializer] 应用初始化完成');
      this.initialized = true;
      return true;
    } catch (error) {
      logger.error('AppInitializer', '应用初始化失败', error);
      console.error('[AppInitializer] 应用初始化失败:', error);
      throw error;
    }
  }

  /**
   * 初始化数据库
   */
  async initializeDatabase() {
    try {
      console.log('[AppInitializer] 初始化数据库开始...');
      logger.info('AppInitializer', '初始化数据库...');

      console.log('[AppInitializer] 调用 db.init()...');
      await db.init();

      console.log('[AppInitializer] 数据库初始化成功');
      logger.info('AppInitializer', '数据库初始化成功');
    } catch (error) {
      console.error('[AppInitializer] 数据库初始化失败:', error);
      logger.error('AppInitializer', '数据库初始化失败', error);

      // 关键修复：检查是否是 plus 未就绪导致的失败
      // 如果是，等待一下后重试
      if (error && (error.message?.includes('plus') || error.message?.includes('sqlite'))) {
        console.warn('[AppInitializer] 检测到 plus 相关错误，等待 500ms 后重试...');
        await new Promise(resolve => setTimeout(resolve, 500));

        try {
          console.log('[AppInitializer] 重试 db.init()...');
          await db.init();
          console.log('[AppInitializer] 重试成功');
          logger.info('AppInitializer', '数据库初始化重试成功');
          return;
        } catch (retryError) {
          console.error('[AppInitializer] 重试失败:', retryError);
          logger.error('AppInitializer', '数据库初始化重试失败', retryError);
        }
      }

      throw error;
    }
  }

  /**
   * 设置全局错误处理
   */
  setupErrorHandling() {
    console.log('[AppInitializer.setupErrorHandling] 开始设置全局错误处理...');
    logger.info('AppInitializer', '设置全局错误处理...');

    try {
      // 添加自定义错误处理器
      const handler = globalErrorManager.getErrorHandler();
      console.log('[AppInitializer.setupErrorHandling] 获取错误处理器成功');

      handler.addHandler((errorInfo) => {
        // 可以在这里添加自定义的错误处理逻辑
        // 例如：上报到服务器、显示用户提示等
        if (errorInfo.context.type === 'UncaughtException') {
          logger.error('AppInitializer', '捕获到未处理的异常', errorInfo);
          console.error('[AppInitializer] 捕获到未处理的异常:', errorInfo);
        }
      });

      console.log('[AppInitializer.setupErrorHandling] 错误处理器添加成功');
      logger.info('AppInitializer', '全局错误处理设置完成');
      console.log('[AppInitializer.setupErrorHandling] 全局错误处理设置完成');
    } catch (error) {
      console.error('[AppInitializer.setupErrorHandling] 设置失败:', error);
      logger.error('AppInitializer', '全局错误处理设置失败', error);
    }
  }

  /**
   * 启动自动清理
   */
  startAutoCleanup() {
    console.log('[AppInitializer.startAutoCleanup] 检查是否启用自动清理...');
    if (!appConfig.features.ENABLE_AUTO_CLEANUP) {
      console.log('[AppInitializer.startAutoCleanup] 自动清理已禁用');
      return;
    }

    logger.info('AppInitializer', '启动自动清理...');
    console.log('[AppInitializer.startAutoCleanup] 启动自动清理...');

    try {
      const interval = appConfig.features.AUTO_CLEANUP_INTERVAL;
      console.log('[AppInitializer.startAutoCleanup] 清理间隔:', interval);

      this.cleanupInterval = setInterval(() => {
        try {
          cleanupExpiredCaches();
          logger.debug('AppInitializer', '执行自动清理');
          console.log('[AppInitializer] 执行自动清理');
        } catch (error) {
          logger.error('AppInitializer', '自动清理失败', error);
          console.error('[AppInitializer] 自动清理失败:', error);
        }
      }, interval);

      logger.info('AppInitializer', `自动清理已启动，间隔: ${interval}ms`);
      console.log('[AppInitializer.startAutoCleanup] 自动清理已启动，间隔:', interval);
    } catch (error) {
      console.error('[AppInitializer.startAutoCleanup] 启动失败:', error);
      logger.error('AppInitializer', '启动自动清理失败', error);
    }
  }

  /**
   * 设置性能监控
   */
  setupPerformanceMonitoring() {
    console.log('[AppInitializer.setupPerformanceMonitoring] 检查是否启用性能监控...');
    if (!appConfig.features.ENABLE_PERFORMANCE_MONITORING) {
      console.log('[AppInitializer.setupPerformanceMonitoring] 性能监控已禁用');
      return;
    }

    logger.info('AppInitializer', '设置性能监控...');
    console.log('[AppInitializer.setupPerformanceMonitoring] 设置性能监控...');

    try {
      // 监控长操作
      if (typeof performance !== 'undefined' && performance.mark) {
        // 可以在这里添加性能监控逻辑
        logger.info('AppInitializer', '性能监控已启用');
        console.log('[AppInitializer.setupPerformanceMonitoring] 性能监控已启用');
      } else {
        console.log('[AppInitializer.setupPerformanceMonitoring] 性能 API 不可用');
      }
    } catch (error) {
      console.error('[AppInitializer.setupPerformanceMonitoring] 设置失败:', error);
      logger.error('AppInitializer', '性能监控设置失败', error);
    }
  }

  /**
   * 清理资源
   */
  cleanup() {
    logger.info('AppInitializer', '清理应用资源...');

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    cleanupExpiredCaches();
    logger.info('AppInitializer', '应用资源清理完成');
  }

  /**
   * 获取初始化状态
   */
  getStatus() {
    return {
      initialized: this.initialized,
      config: appConfig.getAll(),
      diagnostics: globalErrorManager.getDiagnostics(),
    };
  }
}

// 导出全局初始化器实例
export const appInitializer = new AppInitializer();

/**
 * 便捷函数
 */
export async function initializeApp() {
  return appInitializer.initialize();
}

export function cleanupApp() {
  appInitializer.cleanup();
}

export function getAppStatus() {
  return appInitializer.getStatus();
}

/**
 * 在应用启动时调用
 * 在 main.js 或 App.vue 中调用
 *
 * 示例:
 *   import { initializeApp } from './src/utils/appInitializer.js';
 *
 *   // 在 App.vue 的 onLoad 中
 *   onLoad(async () => {
 *     await initializeApp();
 *   });
 *
 *   // 在 App.vue 的 onUnload 中
 *   onUnload(() => {
 *     cleanupApp();
 *   });
 */
