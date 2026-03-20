/**
 * 复习数据同步管理器
 * 确保复习数据和学习档案保持一致
 * 解决数据不同步问题
 */

import { logger } from './errorHandler.js';
import { getWordProfile, saveWordProfile } from './learningCenter_v2.js';
import db from './db_v2.js';

class ReviewDataSyncManager {
  constructor() {
    this.syncQueue = [];
    this.isSyncing = false;
    this.lastSyncTime = 0;
    this.syncInterval = 5 * 60 * 1000; // 5 分钟同步一次
  }

  /**
   * 记录复习结果并同步数据
   * 确保学习档案和数据库数据一致
   */
  async recordReviewAndSync(word, isCorrect, options = {}) {
    try {
      // 1. 更新学习档案
      const profile = saveWordProfile(word, {
        correctCount: (getWordProfile(word)?.correctCount || 0) + (isCorrect ? 1 : 0),
        wrongCount: (getWordProfile(word)?.wrongCount || 0) + (isCorrect ? 0 : 1),
        lastReviewedAt: new Date().toISOString(),
      });

      if (!profile) {
        logger.error('reviewDataSync', '保存学习档案失败');
        return null;
      }

      // 2. 同步到数据库（异步）
      this.queueSync(word, profile);

      return profile;
    } catch (error) {
      logger.error('reviewDataSync', '记录复习结果失败', error);
      return null;
    }
  }

  /**
   * 将同步任务加入队列
   */
  queueSync(word, profile) {
    this.syncQueue.push({
      word,
      profile,
      timestamp: Date.now(),
    });

    // 如果队列长度超过 10，立即同步
    if (this.syncQueue.length >= 10) {
      this.flushSync();
    }
  }

  /**
   * 执行同步
   */
  async flushSync() {
    if (this.isSyncing || this.syncQueue.length === 0) {
      return;
    }

    this.isSyncing = true;
    const queue = [...this.syncQueue];
    this.syncQueue = [];

    try {
      // 批量更新数据库
      for (const item of queue) {
        try {
          await this.syncToDatabase(item.word, item.profile);
        } catch (error) {
          logger.warn('reviewDataSync', `同步 ${item.word.english} 失败`, error);
          // 继续处理其他项
        }
      }

      this.lastSyncTime = Date.now();
      logger.debug('reviewDataSync', `同步了 ${queue.length} 个单词`);
    } catch (error) {
      logger.error('reviewDataSync', '批量同步失败', error);
      // 将失败的项重新加入队列
      this.syncQueue.unshift(...queue);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * 同步单个单词到数据库
   */
  async syncToDatabase(word, profile) {
    if (!word || !profile) return;

    try {
      // 获取数据库中的单词
      const dbWord = await db.getWordByEnglish(word.english || word);

      if (!dbWord) {
        logger.warn('reviewDataSync', `数据库中找不到单词: ${word.english}`);
        return;
      }

      // 更新数据库中的复习数据
      await db.updateWord(dbWord.id, {
        correct_count: profile.correctCount,
        wrong_count: profile.wrongCount,
        last_reviewed_at: profile.lastReviewedAt,
        next_review_time: profile.nextReviewTime,
        interval_days: profile.intervalDays,
        stability: profile.stability,
        difficulty_score: profile.difficultyScore,
        retrievability: profile.retrievability,
        lapse_count: profile.lapseCount,
        review_count: profile.reviewCount,
      });

      logger.debug('reviewDataSync', `同步单词成功: ${word.english}`);
    } catch (error) {
      logger.error('reviewDataSync', `同步单词失败: ${word.english}`, error);
      throw error;
    }
  }

  /**
   * 启动定期同步
   */
  startAutoSync() {
    if (typeof setInterval !== 'undefined') {
      setInterval(() => {
        this.flushSync();
      }, this.syncInterval);
    }
  }

  /**
   * 获取同步状态
   */
  getStatus() {
    return {
      isSyncing: this.isSyncing,
      queueLength: this.syncQueue.length,
      lastSyncTime: this.lastSyncTime,
      lastSyncAgo: Date.now() - this.lastSyncTime,
    };
  }

  /**
   * 清空同步队列
   */
  clear() {
    this.syncQueue = [];
  }
}

// 全局同步管理器实例
const reviewDataSyncManager = new ReviewDataSyncManager();

// 启动定期同步
reviewDataSyncManager.startAutoSync();

export { reviewDataSyncManager, ReviewDataSyncManager };
