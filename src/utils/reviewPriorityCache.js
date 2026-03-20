/**
 * 复习优先级缓存管理器
 * 用于缓存单词的优先级分数，避免重复计算
 * 提升复习单词列表加载性能
 */

import { calculateReviewPriority } from './reviewAlgo.js';
import { logger } from './errorHandler.js';

class ReviewPriorityCache {
  constructor(maxSize = 1000, ttlMs = 30 * 60 * 1000) {
    this.cache = new Map();
    this.timestamps = new Map();
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * 获取单词的优先级分数（带缓存）
   */
  getPriority(word, hardMode = false) {
    if (!word || !word.english) return null;

    const key = this.getKey(word.english, hardMode);

    // 检查缓存是否存在且未过期
    if (this.cache.has(key)) {
      const timestamp = this.timestamps.get(key);
      if (Date.now() - timestamp < this.ttlMs) {
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
   */
  set(key, priority) {
    // 如果超过容量，删除最旧的
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
   */
  getKey(english, hardMode) {
    return `${english.toLowerCase()}:${hardMode ? 'hard' : 'normal'}`;
  }

  /**
   * 清除特定单词的缓存
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
