/**
 * 缓存管理模块 (cacheManager.js)
 *
 * 功能：
 * - 实现 LRU（Least Recently Used）缓存
 * - 实现内存缓存和本地存储缓存
 * - 支持缓存过期机制
 * - 防止内存泄漏
 *
 * 缓存类型：
 * 1. LRUCache：内存缓存，支持 TTL（生存时间）
 * 2. MemoryCache：简化的内存缓存
 * 3. StorageCache：本地存储缓存，支持过期机制
 *
 * 使用场景：
 * - 缓存数据库查询结果
 * - 缓存 API 响应
 * - 缓存计算结果
 * - 减少重复操作
 */

/**
 * LRU 缓存实现
 *
 * 工作原理：
 * - 最多存储 maxSize 个项目
 * - 每个项目有 TTL（生存时间）
 * - 访问时移到最后（标记为最近使用）
 * - 超过容量时删除最旧的项目
 * - 过期的项目自动删除
 *
 * 性能：
 * - get/set/delete：O(1) 时间复杂度
 * - 内存占用：O(maxSize)
 */
export class LRUCache {
  /**
   * 构造函数
   * @param {number} maxSize - 最大缓存项数（默认 200）
   * @param {number} ttlMs - 缓存生存时间，单位毫秒（默认 5 分钟）
   */
  constructor(maxSize = 200, ttlMs = 5 * 60 * 1000) {
    this.maxSize = maxSize;  // 最大缓存项数
    this.ttlMs = ttlMs;  // 缓存生存时间
    this.cache = new Map();  // 缓存数据
    this.timestamps = new Map();  // 缓存时间戳
  }

  /**
   * 获取缓存值
   *
   * 流程：
   * 1. 检查 key 是否存在
   * 2. 检查是否过期（过期则删除）
   * 3. 移到最后（标记为最近使用）
   * 4. 返回值
   *
   * @param {string} key - 缓存 key
   * @returns {*} 缓存值，不存在或过期返回 undefined
   */
  get(key) {
    if (!this.cache.has(key)) return undefined;

    // 检查是否过期
    const timestamp = this.timestamps.get(key);
    if (timestamp && Date.now() - timestamp > this.ttlMs) {
      this.cache.delete(key);
      this.timestamps.delete(key);
      return undefined;
    }

    // 移到最后（最近使用）- 先保存值再操作
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  /**
   * 设置缓存值
   *
   * 流程：
   * 1. 如果已存在，先删除
   * 2. 如果超过容量，删除最旧的项
   * 3. 添加新项
   * 4. 记录时间戳
   *
   * @param {string} key - 缓存 key
   * @param {*} value - 缓存值
   */
  set(key, value) {
    // 如果已存在，先删除
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // 如果超过容量，删除最旧的（第一个）
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
      this.timestamps.delete(firstKey);
    }

    this.cache.set(key, value);
    this.timestamps.set(key, Date.now());
  }

  /**
   * 检查是否存在
   * @param {string} key - 缓存 key
   * @returns {boolean} 是否存在且未过期
   */
  has(key) {
    return this.get(key) !== undefined;
  }

  /**
   * 删除缓存
   * @param {string} key - 缓存 key
   */
  delete(key) {
    this.cache.delete(key);
    this.timestamps.delete(key);
  }

  /**
   * 清空所有缓存
   */
  clear() {
    this.cache.clear();
    this.timestamps.clear();
  }

  /**
   * 获取缓存大小
   * @returns {number}
   */
  size() {
    return this.cache.size;
  }

  /**
   * 清理过期项
   */
  cleanup() {
    const now = Date.now();
    for (const [key, timestamp] of this.timestamps.entries()) {
      if (now - timestamp > this.ttlMs) {
        this.cache.delete(key);
        this.timestamps.delete(key);
      }
    }
  }
}

/**
 * 本地存储缓存包装器 - 带过期机制
 */
export class StorageCache {
  constructor(key, ttlMs = 24 * 60 * 60 * 1000) {
    this.key = key;
    this.ttlMs = ttlMs;
    this.metaKey = `${key}__meta`;
  }

  /**
   * 获取缓存值
   * @param {*} fallback
   * @returns {*}
   */
  get(fallback = null) {
    try {
      const meta = uni.getStorageSync(this.metaKey);
      const metaObj = meta ? JSON.parse(meta) : null;

      // 检查是否过期
      if (metaObj && metaObj.timestamp && Date.now() - metaObj.timestamp > this.ttlMs) {
        this.clear();
        return fallback;
      }

      const raw = uni.getStorageSync(this.key);
      if (!raw) return fallback;

      if (typeof raw === 'string') {
        return JSON.parse(raw);
      }
      return raw;
    } catch (_) {
      return fallback;
    }
  }

  /**
   * 设置缓存值
   * @param {*} value
   */
  set(value) {
    try {
      uni.setStorageSync(this.key, JSON.stringify(value));
      uni.setStorageSync(this.metaKey, JSON.stringify({
        timestamp: Date.now(),
        ttlMs: this.ttlMs
      }));
    } catch (_) {}
  }

  /**
   * 清空缓存
   */
  clear() {
    try {
      uni.removeStorageSync(this.key);
      uni.removeStorageSync(this.metaKey);
    } catch (_) {}
  }
}

/**
 * 内存缓存包装器 - 带过期和大小限制
 */
export class MemoryCache {
  constructor(maxSize = 200, ttlMs = 5 * 60 * 1000) {
    this.lru = new LRUCache(maxSize, ttlMs);
  }

  get(key, fallback = null) {
    const value = this.lru.get(key);
    return value !== undefined ? value : fallback;
  }

  set(key, value) {
    this.lru.set(key, value);
  }

  has(key) {
    return this.lru.has(key);
  }

  delete(key) {
    this.lru.delete(key);
  }

  clear() {
    this.lru.clear();
  }

  size() {
    return this.lru.size();
  }

  cleanup() {
    this.lru.cleanup();
  }
}

/**
 * 两层缓存：内存 + 本地存储
 */
export class HybridCache {
  constructor(key, memorySize = 100, memoryTtlMs = 5 * 60 * 1000, storageTtlMs = 24 * 60 * 60 * 1000) {
    this.memoryCache = new MemoryCache(memorySize, memoryTtlMs);
    this.storageCache = new StorageCache(key, storageTtlMs);
  }

  get(fallback = null) {
    // 先查内存
    const memKey = '__hybrid_value';
    if (this.memoryCache.has(memKey)) {
      return this.memoryCache.get(memKey, fallback);
    }

    // 再查本地存储
    const value = this.storageCache.get(fallback);
    if (value !== fallback) {
      this.memoryCache.set(memKey, value);
    }
    return value;
  }

  set(value) {
    this.memoryCache.set('__hybrid_value', value);
    this.storageCache.set(value);
  }

  clear() {
    this.memoryCache.clear();
    this.storageCache.clear();
  }
}
