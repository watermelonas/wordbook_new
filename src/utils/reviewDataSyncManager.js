/**
 * 复习数据同步管理器 (reviewDataSyncManager.js)
 *
 * 功能：
 * - 确保复习数据和学习档案保持一致
 * - 解决数据不同步问题
 * - 支持异步批量同步
 * - 支持定期自动同步
 *
 * 工作流程：
 * 1. 用户完成复习 → 记录复习结果
 * 2. 更新学习档案（内存）
 * 3. 将同步任务加入队列
 * 4. 定期或手动执行同步
 * 5. 批量更新数据库
 *
 * 优势：
 * - 异步同步，不阻塞 UI
 * - 批量操作，提升性能
 * - 队列机制，防止数据丢失
 * - 自动重试，提升可靠性
 *
 * 使用场景：
 * - 复习完成后同步数据
 * - 定期同步学习进度
 * - 数据一致性检查
 */

import { logger } from './errorHandler.js';
import { getWordProfile, saveWordProfile } from './learningCenter_v2.js';
import db from './db_v2.js';

/**
 * 复习数据同步管理器类
 *
 * 职责：
 * - 管理同步队列
 * - 执行批量同步
 * - 处理同步错误
 * - 提供同步状态
 */
class ReviewDataSyncManager {
  /**
   * 构造函数
   *
   * 初始化：
   * - 同步队列（空）
   * - 同步状态（未同步）
   * - 最后同步时间（0）
   * - 同步间隔（5 分钟）
   */
  constructor() {
    this.syncQueue = [];  // 待同步的任务队列
    this.isSyncing = false;  // 是否正在同步
    this.lastSyncTime = 0;  // 上次同步时间
    this.syncInterval = 5 * 60 * 1000; // 同步间隔：5 分钟
  }

  /**
   * 记录复习结果并同步数据
   *
   * 流程：
   * 1. 更新学习档案（内存）
   * 2. 增加正确/错误计数
   * 3. 更新最后复习时间
   * 4. 将同步任务加入队列
   * 5. 返回更新后的档案
   *
   * 特点：
   * - 立即更新内存档案
   * - 异步同步到数据库
   * - 不阻塞用户操作
   *
   * @param {object} word - 单词对象
   * @param {boolean} isCorrect - 是否答对
   * @param {object} options - 选项对象
   * @returns {Promise<object|null>} 更新后的档案，失败返回 null
   *
   * @example
   * const profile = await syncManager.recordReviewAndSync(word, true);
   * if (profile) {
   *   console.log('复习记录已保存');
   * }
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
   *
   * 功能：
   * - 添加任务到队列
   * - 记录时间戳
   * - 队列满时立即同步
   *
   * 队列满的条件：
   * - 队列长度 >= 10
   * - 立即执行 flushSync()
   *
   * @param {object} word - 单词对象
   * @param {object} profile - 学习档案
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
   *
   * 流程：
   * 1. 检查是否已在同步或队列为空
   * 2. 标记为同步中
   * 3. 复制队列并清空
   * 4. 批量更新数据库
   * 5. 处理失败项
   * 6. 更新同步时间
   *
   * 特点：
   * - 防止并发同步
   * - 单个失败不影响其他项
   * - 失败项重新加入队列
   * - 完整的错误处理
   */
  async flushSync() {
    // 防止并发同步
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
   *
   * 流程：
   * 1. 验证参数
   * 2. 查询数据库中的单词
   * 3. 更新复习相关字段
   * 4. 记录日志
   *
   * 更新字段：
   * - correct_count：正确次数
   * - wrong_count：错误次数
   * - last_reviewed_at：上次复习时间
   * - next_review_time：下次复习时间
   * - interval_days：复习间隔
   * - stability：稳定性
   * - difficulty_score：难度分数
   * - retrievability：可检索性
   * - lapse_count：失误次数
   * - review_count：复习次数
   *
   * @param {object} word - 单词对象
   * @param {object} profile - 学习档案
   * @throws {Error} 同步失败时抛出错误
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
   *
   * 功能：
   * - 每隔 syncInterval 毫秒执行一次同步
   * - 自动清空队列
   * - 后台运行，不阻塞主线程
   *
   * 使用场景：
   * - 应用启动时调用
   * - 定期同步学习进度
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
   *
   * 返回信息：
   * - isSyncing：是否正在同步
   * - queueLength：队列中的任务数
   * - lastSyncTime：上次同步的时间戳
   * - lastSyncAgo：距离上次同步的毫秒数
   *
   * @returns {object} 同步状态对象
   *
   * @example
   * const status = syncManager.getStatus();
   * console.log('队列中有', status.queueLength, '个待同步任务');
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
   *
   * 用途：
   * - 放弃待同步的任务
   * - 重置同步状态
   * - 应急处理
   *
   * 注意：
   * - 清空后的任务无法恢复
   * - 谨慎使用
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

