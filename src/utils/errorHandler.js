/**
 * 全局错误处理和日志系统
 * 统一处理应用中的错误和日志
 */

/**
 * 日志级别
 */
export const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

/**
 * 日志管理器
 */
class Logger {
  constructor(minLevel = LogLevel.INFO, maxLogs = 500) {
    this.minLevel = minLevel;
    this.maxLogs = maxLogs;
    this.logs = [];
    this.listeners = [];
  }

  /**
   * 添加日志监听器
   */
  addListener(callback) {
    // 防止重复添加同一个监听器
    if (!this.listeners.includes(callback)) {
      this.listeners.push(callback);
    }
    // 监听器数量过多时发出警告
    if (this.listeners.length > 100) {
      console.warn('[Logger] 监听器数量过多（>100），可能存在内存泄漏');
    }
  }

  /**
   * 移除日志监听器
   */
  removeListener(callback) {
    this.listeners = this.listeners.filter(l => l !== callback);
  }

  /**
   * 记录日志
   */
  log(level, tag, message, data = null) {
    if (level < this.minLevel) return;

    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      tag,
      message,
      data,
    };

    this.logs.push(logEntry);

    // 保持日志数量在限制内
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // 通知监听器
    this.listeners.forEach(listener => {
      try {
        listener(logEntry);
      } catch (e) {
        console.error('[Logger] 监听器执行失败:', e);
      }
    });

    // 输出到控制台
    this.printToConsole(level, tag, message, data);
  }

  /**
   * 输出到控制台
   */
  printToConsole(level, tag, message, data) {
    const levelName = Object.keys(LogLevel).find(k => LogLevel[k] === level) || 'UNKNOWN';
    const prefix = `[${levelName}] [${tag}]`;

    if (data !== null && data !== undefined) {
      console.log(`${prefix} ${message}`, data);
    } else {
      console.log(`${prefix} ${message}`);
    }
  }

  /**
   * 调试日志
   */
  debug(tag, message, data) {
    this.log(LogLevel.DEBUG, tag, message, data);
  }

  /**
   * 信息日志
   */
  info(tag, message, data) {
    this.log(LogLevel.INFO, tag, message, data);
  }

  /**
   * 警告日志
   */
  warn(tag, message, data) {
    this.log(LogLevel.WARN, tag, message, data);
  }

  /**
   * 错误日志
   */
  error(tag, message, data) {
    this.log(LogLevel.ERROR, tag, message, data);
  }

  /**
   * 获取所有日志
   */
  getLogs(level = null) {
    if (level === null) return [...this.logs];
    return this.logs.filter(log => log.level >= level);
  }

  /**
   * 清空日志
   */
  clear() {
    this.logs = [];
  }

  /**
   * 导出日志为 JSON
   */
  exportAsJson() {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * 导出日志为 CSV
   */
  exportAsCsv() {
    const headers = ['Timestamp', 'Level', 'Tag', 'Message', 'Data'];
    const rows = this.logs.map(log => [
      log.timestamp,
      Object.keys(LogLevel).find(k => LogLevel[k] === log.level),
      log.tag,
      log.message,
      typeof log.data === 'object' ? JSON.stringify(log.data) : log.data,
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    return csv;
  }
}

/**
 * 错误处理器
 */
class ErrorHandler {
  constructor(logger) {
    this.logger = logger;
    this.errorHandlers = [];
  }

  /**
   * 添加错误处理器
   */
  addHandler(handler) {
    this.errorHandlers.push(handler);
  }

  /**
   * 处理错误
   */
  handle(error, context = {}) {
    const errorInfo = {
      message: error.message || String(error),
      stack: error.stack || '',
      type: error.constructor.name,
      context,
      timestamp: new Date().toISOString(),
    };

    // 记录错误
    this.logger.error('ErrorHandler', `${errorInfo.type}: ${errorInfo.message}`, errorInfo);

    // 调用错误处理器
    this.errorHandlers.forEach(handler => {
      try {
        handler(errorInfo);
      } catch (e) {
        this.logger.error('ErrorHandler', '错误处理器执行失败', e);
      }
    });

    return errorInfo;
  }

  /**
   * 处理 Promise 拒绝
   */
  handleRejection(reason, context = {}) {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    return this.handle(error, { ...context, type: 'UnhandledRejection' });
  }

  /**
   * 处理异常
   */
  handleException(error, context = {}) {
    return this.handle(error, { ...context, type: 'UncaughtException' });
  }
}

/**
 * 全局错误和日志管理器
 */
class GlobalErrorManager {
  constructor() {
    this.logger = new Logger(LogLevel.DEBUG);
    this.errorHandler = new ErrorHandler(this.logger);
    this.setupGlobalHandlers();
  }

  /**
   * 设置全局错误处理
   */
  setupGlobalHandlers() {
    // 处理未捕获的 Promise 拒绝
    if (typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', (event) => {
        this.errorHandler.handleRejection(event.reason, { source: 'unhandledrejection' });
      });

      // 处理全局错误
      window.addEventListener('error', (event) => {
        this.errorHandler.handleException(event.error, { source: 'error' });
      });
    }

    // uni-app 错误处理
    if (typeof uni !== 'undefined' && uni.onError) {
      uni.onError((error) => {
        this.errorHandler.handleException(error, { source: 'uni.onError' });
      });
    }
  }

  /**
   * 获取日志器
   */
  getLogger() {
    return this.logger;
  }

  /**
   * 获取错误处理器
   */
  getErrorHandler() {
    return this.errorHandler;
  }

  /**
   * 记录性能指标
   */
  logPerformance(tag, duration, metadata = {}) {
    this.logger.info(tag, `性能指标: ${duration}ms`, { duration, ...metadata });
  }

  /**
   * 记录用户操作
   */
  logUserAction(action, data = {}) {
    this.logger.info('UserAction', action, data);
  }

  /**
   * 记录数据库操作
   */
  logDatabaseOperation(operation, duration, success = true, error = null) {
    if (success) {
      this.logger.info('Database', `${operation} 成功 (${duration}ms)`);
    } else {
      this.logger.error('Database', `${operation} 失败 (${duration}ms)`, error);
    }
  }

  /**
   * 获取诊断信息
   */
  getDiagnostics() {
    return {
      timestamp: new Date().toISOString(),
      logs: this.logger.getLogs(),
      logCount: this.logger.logs.length,
      memoryUsage: this.getMemoryUsage(),
    };
  }

  /**
   * 获取内存使用情况
   */
  getMemoryUsage() {
    if (typeof performance !== 'undefined' && performance.memory) {
      return {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
      };
    }
    return null;
  }

  /**
   * 导出诊断信息
   */
  exportDiagnostics(format = 'json') {
    const diagnostics = this.getDiagnostics();

    if (format === 'json') {
      return JSON.stringify(diagnostics, null, 2);
    } else if (format === 'csv') {
      return this.logger.exportAsCsv();
    }

    return diagnostics;
  }
}

// 导出全局实例
export const globalErrorManager = new GlobalErrorManager();

/**
 * 便捷函数
 */
export const logger = globalErrorManager.getLogger();
export const errorHandler = globalErrorManager.getErrorHandler();

/**
 * 异步函数包装器 - 自动处理错误
 */
export function withErrorHandling(asyncFn, tag = 'AsyncOperation') {
  return async (...args) => {
    const startTime = Date.now();
    try {
      const result = await asyncFn(...args);
      const duration = Date.now() - startTime;
      logger.debug(tag, `操作成功 (${duration}ms)`);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      errorHandler.handleException(error, { tag, duration, args });
      throw error;
    }
  };
}

/**
 * 同步函数包装器 - 自动处理错误
 */
export function withErrorHandlingSync(fn, tag = 'SyncOperation') {
  return (...args) => {
    const startTime = Date.now();
    try {
      const result = fn(...args);
      const duration = Date.now() - startTime;
      logger.debug(tag, `操作成功 (${duration}ms)`);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      errorHandler.handleException(error, { tag, duration, args });
      throw error;
    }
  };
}

/**
 * 性能监控装饰器
 */
export function withPerformanceMonitoring(asyncFn, tag = 'PerformanceMonitoring') {
  return async (...args) => {
    const startTime = Date.now();
    try {
      const result = await asyncFn(...args);
      const duration = Date.now() - startTime;
      globalErrorManager.logPerformance(tag, duration, { success: true });
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      globalErrorManager.logPerformance(tag, duration, { success: false, error: error.message });
      throw error;
    }
  };
}
