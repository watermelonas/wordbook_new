/**
 * 复习优先级缓存管理器 (reviewPriorityCache.js)
 *
 * 功能：
 * - 缓存单词的优先级分数
 * - 避免重复计算优先级
 * - 提升复习单词列表加载性能
 * - 支持缓存过期机制
 *
 * 工作原理：
 * - 第一次计算优先级时，将结果存入缓存
 * - 后续请求直接返回缓存值
 * - 缓存过期后自动删除
 * - 超过容量时删除最旧的项
 *
 * 性能提升：
 * - 避免重复的复杂计算
 * - 减少 CPU 占用
 * - 加快列表加载速度
 *
 * 使用场景：
 * - 复习单词列表排序
 * - 单词优先级计算
 * - 性能敏感的操作
 */

import { calculateReviewPriority } from './reviewAlgo.js';
import { logger } from './errorHandler.js';

/**
 * 复习优先级缓存类
 *
 * 特性：
 * - LRU 缓存策略（最近最少使用）
 * - TTL 过期机制（生存时间）
 * - 命中率统计
 * - 容量限制
 */
class ReviewPriorityCache {
  /**
   * 构造函数
   *
   * @param {number} maxSize - 最大缓存项数（默认 1000）
   * @param {number} ttlMs - 缓存生存时间，单位毫秒（默认 30 分钟）
   */
  constructor(maxSize = 1000, ttlMs = 30 * 60 * 1000) {
    this.cache = new Map();  // 缓存数据
    this.timestamps = new Map();  // 缓存时间戳
    this.maxSize = maxSize;  // 最大缓存项数
    this.ttlMs = ttlMs;  // 缓存生存时间
    this.hits = 0;  // 缓存命中次数
    this.misses = 0;  // 缓存未命中次数
  }

  /**
   * 获取单词的优先级分数（带缓存）
   *
   * 流程：
   * 1. 生成缓存 key
   * 2. 检查缓存是否存在且未过期
   * 3. 如果命中，返回缓存值
   * 4. 如果未命中，计算优先级并存入缓存
   * 5. 返回优先级分数
   *
   * @param {object} word - 单词对象
   * @param {boolean} hardMode - 是否为困难模式（默认 false）
   * @returns {number|null} 优先级分数，无效单词返回 null
   */
  getPriority(word, hardMode = false) {
    if (!word || !word.english) return null;

    // 生成缓存 key（包含单词和模式）
    const key = this.getKey(word.english, hardMode);

    // 检查缓存是否存在且未过期
    if (this.cache.has(key)) {
      const timestamp = this.timestamps.get(key);
      if (Date.now() - timestamp < this.ttlMs) {
        // 缓存命中
        this.hits++;
        return this.cache.get(key);
      } else {
        // 缓存已过期，删除
        this.cache.delete(key);
        this.timestamps.delete(key);
      }
    }

    // 缓存未命中，计算优先级
    this.misses++;
    const priority = calculateReviewPriority(word, hardMode);

    // 存储到缓存
    this.set(key, priority);

    return priority;
  }

  /**
   * 设置缓存
   *
   * 流程：
   * 1. 检查是否超过容量
   * 2. 如果超过，删除最旧的项
   * 3. 添加新项
   * 4. 记录时间戳
   *
   * @param {string} key - 缓存 key
   * @param {number} priority - 优先级分数
   */
  set(key, priority) {
    // 如果超过容量，删除最旧的（第一个）
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
      this.timestamps.delete(firstKey);
    }

    this.cache.set(key, priority);
    this.timestamps.set(key, Date.now());
  }

  /**
   * 生成缓存键
   *
   * 格式：`{english}:{mode}`
   * 例如：`abandon:normal` 或 `abandon:hard`
   *
   * @param {string} english - 单词英文
   * @param {boolean} hardMode - 是否为困难模式
   * @returns {string} 缓存 key
   */
  getKey(english, hardMode) {
    return `${english.toLowerCase()}:${hardMode ? 'hard' : 'normal'}`;
  }

  /**
   * 清除特定单词的缓存
   *
   * 用途：
   * - 单词信息更新后清除缓存
   * - 强制重新计算优先级
   *
   * @param {string} english - 单词英文
   * @param {boolean} hardMode - 是否为困难模式（默认 false）
   */
  invalidate(english, hardMode = false) {
    const key = this.getKey(english, hardMode);
    this.cache.delete(key);
    this.timestamps.delete(key);
  }

  /**
   * 清除所有缓存
   */
  clear() {
    this.cache.clear();
    this.timestamps.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * 获取缓存统计信息
   */
  getStats() {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? (this.hits / total * 100).toFixed(2) : 0;
    return {
      hits: this.hits,
      misses: this.misses,
      total,
      hitRate: `${hitRate}%`,
      size: this.cache.size,
      maxSize: this.maxSize,
    };
  }

  /**
   * 清理过期缓存
   */
  cleanup() {
    const now = Date.now();
    let cleaned = 0;
    for (const [key, timestamp] of this.timestamps.entries()) {
      if (now - timestamp > this.ttlMs) {
        this.cache.delete(key);
        this.timestamps.delete(key);
        cleaned++;
      }
    }
    if (cleaned > 0) {
      logger.debug('reviewPriorityCache', `清理了 ${cleaned} 个过期缓存`);
    }
  }
}

// 全局缓存实例
const priorityCache = new ReviewPriorityCache(1000, 30 * 60 * 1000);

// 定期清理过期缓存（每 5 分钟）
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    priorityCache.cleanup();
  }, 5 * 60 * 1000);
}

export { priorityCache, ReviewPriorityCache };
