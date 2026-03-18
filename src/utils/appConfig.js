/**
 * 应用配置管理
 * 统一管理应用的各种配置参数
 */

/**
 * 缓存配置
 */
export const CacheConfig = {
  // 内存缓存
  MEMORY_CACHE_SIZE: 500,
  MEMORY_CACHE_TTL_MS: 5 * 60 * 1000, // 5 分钟

  // 本地存储缓存
  STORAGE_CACHE_TTL_MS: 24 * 60 * 60 * 1000, // 24 小时

  // 学习中心缓存
  PROFILE_CACHE_SIZE: 500,
  PROFILE_CACHE_TTL_MS: 5 * 60 * 1000,
  MISTAKES_CACHE_SIZE: 200,
  MISTAKES_CACHE_TTL_MS: 5 * 60 * 1000,

  // 主库缓存
  MASTER_DB_CACHE_SIZE: 200,
  MASTER_DB_CACHE_TTL_MS: 10 * 60 * 1000, // 10 分钟
};

/**
 * 数据库配置
 */
export const DatabaseConfig = {
  // SQLite 配置
  DB_NAME: 'wordbook_db',
  DB_PATH: '_doc/wordbook.db',

  // 主库配置
  MASTER_DB_NAME: 'master_db',
  MASTER_DB_PATH: '_doc/vocal_master.db',
  MASTER_DB_SOURCE: '_www/static/vocal_master.db',
  MASTER_DB_VERSION: 4,

  // 分页配置
  PAGE_SIZE: 50,
  FIRST_SCREEN_COUNT: 120,
  HOT_TOP_COUNT: 20,

  // 查询超时
  QUERY_TIMEOUT_MS: 30000,
};

/**
 * 复习配置
 */
export const ReviewConfig = {
  // 默认复习数量
  DEFAULT_REVIEW_COUNT: 20,

  // 复习模式
  MODES: ['choice', 'fill', 'spell', 'ai'],
  DEFAULT_MODE: 'choice',

  // 排序方式
  SORT_OPTIONS: ['smart', 'error', 'new'],
  DEFAULT_SORT: 'smart',

  // 难度
  DIFFICULTIES: ['normal', 'hard'],
  DEFAULT_DIFFICULTY: 'normal',

  // 首日复习间隔（毫秒）
  FIRST_DAY_INTERVALS: [
    10 * 60 * 1000,      // 10 分钟
    20 * 60 * 1000,      // 20 分钟
    6 * 60 * 60 * 1000,  // 6 小时
    24 * 60 * 60 * 1000, // 24 小时
  ],
};

/**
 * 学习配置
 */
export const LearningConfig = {
  // 掌握度阈值
  MASTERY_THRESHOLDS: {
    STRONG: 80,
    NORMAL: 60,
    WEAK: 35,
    DANGER: 0,
  },

  // 错误词恢复阈值
  MISTAKE_RECOVERY_THRESHOLD: 2,

  // 连续正确阈值
  CONSECUTIVE_CORRECT_THRESHOLD: 3,

  // 历史记录保留数量
  MAX_HISTORY_RECORDS: 400,
};

/**
 * 日志配置
 */
export const LogConfig = {
  // 最小日志级别
  MIN_LOG_LEVEL: 0, // DEBUG

  // 最大日志数量
  MAX_LOGS: 500,

  // 是否启用控制台输出
  ENABLE_CONSOLE: true,

  // 是否启用本地存储
  ENABLE_STORAGE: true,

  // 日志存储键
  STORAGE_KEY: 'app_logs',
};

/**
 * 性能配置
 */
export const PerformanceConfig = {
  // 长操作警告阈值（毫秒）
  SLOW_OPERATION_THRESHOLD: 1000,

  // 数据库查询警告阈值
  SLOW_QUERY_THRESHOLD: 500,

  // 内存使用警告阈值（字节）
  MEMORY_WARNING_THRESHOLD: 100 * 1024 * 1024, // 100MB

  // 性能监控采样率
  PERFORMANCE_SAMPLE_RATE: 0.1, // 10%
};

/**
 * 功能开关
 */
export const FeatureFlags = {
  // 启用缓存
  ENABLE_CACHE: true,

  // 启用事务
  ENABLE_TRANSACTIONS: true,

  // 启用错误处理
  ENABLE_ERROR_HANDLING: true,

  // 启用性能监控
  ENABLE_PERFORMANCE_MONITORING: true,

  // 启用日志
  ENABLE_LOGGING: true,

  // 启用自动清理
  ENABLE_AUTO_CLEANUP: true,

  // 自动清理间隔（毫秒）
  AUTO_CLEANUP_INTERVAL: 10 * 60 * 1000, // 10 分钟
};

/**
 * 应用配置管理器
 */
class AppConfig {
  constructor() {
    this.cache = CacheConfig;
    this.database = DatabaseConfig;
    this.review = ReviewConfig;
    this.learning = LearningConfig;
    this.log = LogConfig;
    this.performance = PerformanceConfig;
    this.features = FeatureFlags;
  }

  /**
   * 获取配置值
   */
  get(path, defaultValue = null) {
    const parts = path.split('.');
    let value = this;

    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return defaultValue;
      }
    }

    return value;
  }

  /**
   * 设置配置值
   */
  set(path, value) {
    const parts = path.split('.');
    const lastPart = parts.pop();
    let obj = this;

    for (const part of parts) {
      if (!(part in obj)) {
        obj[part] = {};
      }
      obj = obj[part];
    }

    obj[lastPart] = value;
  }

  /**
   * 获取所有配置
   */
  getAll() {
    return {
      cache: this.cache,
      database: this.database,
      review: this.review,
      learning: this.learning,
      log: this.log,
      performance: this.performance,
      features: this.features,
    };
  }

  /**
   * 重置为默认配置
   */
  reset() {
    this.cache = { ...CacheConfig };
    this.database = { ...DatabaseConfig };
    this.review = { ...ReviewConfig };
    this.learning = { ...LearningConfig };
    this.log = { ...LogConfig };
    this.performance = { ...PerformanceConfig };
    this.features = { ...FeatureFlags };
  }

  /**
   * 验证配置
   */
  validate() {
    const errors = [];

    // 验证缓存配置
    if (this.cache.MEMORY_CACHE_SIZE <= 0) {
      errors.push('MEMORY_CACHE_SIZE 必须大于 0');
    }

    if (this.cache.MEMORY_CACHE_TTL_MS <= 0) {
      errors.push('MEMORY_CACHE_TTL_MS 必须大于 0');
    }

    // 验证数据库配置
    if (!this.database.DB_NAME) {
      errors.push('DB_NAME 不能为空');
    }

    if (!this.database.DB_PATH) {
      errors.push('DB_PATH 不能为空');
    }

    // 验证复习配置
    if (this.review.DEFAULT_REVIEW_COUNT <= 0) {
      errors.push('DEFAULT_REVIEW_COUNT 必须大于 0');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * 导出配置为 JSON
   */
  exportAsJson() {
    return JSON.stringify(this.getAll(), null, 2);
  }
}

// 导出全局配置实例
export const appConfig = new AppConfig();

/**
 * 便捷函数
 */
export function getConfig(path, defaultValue = null) {
  return appConfig.get(path, defaultValue);
}

export function setConfig(path, value) {
  appConfig.set(path, value);
}

export function validateConfig() {
  return appConfig.validate();
}
