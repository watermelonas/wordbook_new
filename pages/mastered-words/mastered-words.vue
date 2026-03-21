<!--
  已斯掉单词本页面 (mastered-words.vue)

  功能：
  - 显示用户已经斯掉（掌握）的所有单词
  - 统计已斯掉单词的数量
  - 支持查看单词详情
  - 支持取消斯掉状态
  - 使用虚拟滚动优化性能

  页面结构：
  1. 顶部标题栏
  2. 空状态提示（无单词时）
  3. 统计卡片（显示已斯掉单词数）
  4. 单词列表（虚拟滚动）
  5. 取消斯掉确认弹窗

  性能优化：
  - 虚拟滚动：只渲染可见区域的单词
  - 缓存清理：页面卸载时清理过期缓存
  - 异步加载：不阻塞 UI 线程
-->
<template>
  <view class="container">
    <!-- 状态栏占位 -->
    <view class="status-bar"></view>

    <!-- 顶部标题 -->
    <view class="header">
      <view class="header-title">已斯掉单词本</view>
    </view>

    <!-- 空状态：当没有已斯掉的单词时显示 -->
    <view v-if="masteredWords.length === 0" class="empty-state">
      <view class="empty-icon">📚</view>
      <text class="empty-title">还没有斯掉任何单词</text>
      <text class="empty-desc">开始复习，掌握更多单词吧</text>
    </view>

    <!-- 统计卡片和单词列表：当有已斯掉的单词时显示 -->
    <view v-else class="content">
      <!-- 统计部分 -->
      <view class="section-label">已斯掉统计</view>
      <view class="card stat-card">
        <view class="stat-row">
          <view class="stat-item">
            <view class="stat-number">{{ masteredWords.length }}</view>
            <view class="stat-text">个单词</view>
          </view>
        </view>
      </view>

      <!-- 单词列表：使用虚拟滚动提升性能 -->
      <view class="section-label">单词列表</view>
      <VirtualScroller
        :items="masteredWords"
        :item-height="110"
        :container-height="containerHeight"
        :buffer-size="5"
        key-field="id"
        @scroll="handleVirtualScroll"
        class="words-list"
      >
        <!-- 单词卡片模板 -->
        <template #default="{ item, index }">
          <view class="card word-card">
            <!-- 单词信息：英文、中文、斯掉日期 -->
            <view class="word-header">
              <view class="word-info">
                <text class="word-english">{{ item.english }}</text>
                <text class="word-chinese">{{ item.chinese || '—' }}</text>
              </view>
              <view class="word-date">{{ formatDate(item.mastered_at) }}</view>
            </view>
            <!-- 操作按钮：查看详情、取消斯掉 -->
            <view class="word-actions">
              <button class="action-btn detail-btn" @click="goToDetail(item)">查看详情</button>
              <button class="action-btn unmaster-btn" @click="showUnmasterConfirm(item)">取消斯掉</button>
            </view>
          </view>
        </template>
      </VirtualScroller>
    </view>

    <!-- 取消斯掉确认弹窗 -->
    <view v-if="showUnmasterModal" class="modal-overlay" @click="showUnmasterModal = false">
      <view class="modal-content" @click.stop>
        <text class="modal-title">取消斯掉？</text>
        <text class="modal-text">{{ unmasterItem?.english }} - {{ unmasterItem?.chinese }}</text>
        <text class="modal-hint">取消后该单词将重新加入复习队列</text>
        <view class="modal-actions">
          <button class="modal-btn cancel-btn" @click="showUnmasterModal = false">保留</button>
          <button class="modal-btn confirm-btn" @click="confirmUnmaster">确认取消</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * 已斯掉单词本页面脚本
 *
 * 主要功能：
 * - 加载已斯掉单词列表
 * - 显示单词统计信息
 * - 处理虚拟滚动
 * - 管理取消斯掉操作
 */

import { ref } from 'vue';
import { onShow, onUnload } from '@dcloudio/uni-app';
import VirtualScroller from '../../src/components/VirtualScroller.vue';
import { getWordbookWords, setWordbookWords } from '../../src/utils/wordbookSource.js';
import { logger } from '../../src/utils/errorHandler.js';
import { cleanupExpiredCaches } from '../../src/utils/learningCenter_v2.js';

// ========== 响应式数据 ==========
// 已斯掉的单词列表
const masteredWords = ref([]);

// 虚拟滚动容器的高度（像素）
const containerHeight = ref(600);

// 是否显示取消斯掉确认弹窗
const showUnmasterModal = ref(false);

// 待取消斯掉的单词项
const unmasterItem = ref(null);

/**
 * 加载已斯掉单词列表
 *
 * 流程：
 * 1. 从本地存储读取"已斯掉"单词本
 * 2. 为每个单词生成唯一 ID
 * 3. 更新响应式数据
 * 4. 处理错误情况
 */
const loadMasteredWords = async () => {
  try {
    // 加载"已斯掉"单词本
    const words = getWordbookWords('mastered') || [];
    masteredWords.value = words.map((w, index) => ({
      ...w,
      // 生成唯一 ID：用于虚拟滚动的 key
      id: w.id || `mastered_${index}_${w.english}`
    }));
  } catch (e) {
    logger.error('MasteredWords', '加载已斯掉单词本失败', e);
    masteredWords.value = [];
  }
};

/**
 * 格式化日期
 *
 * 功能：
 * - 将 ISO 日期字符串转换为本地日期格式
 * - 格式：MM-DD（如 03-21）
 * - 无效日期返回 "—"
 *
 * @param {string} dateStr - ISO 日期字符串
 * @returns {string} 格式化后的日期
 */
const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
};

/**
 * 跳转到单词详情页面
 *
 * 功能：
 * - 验证单词英文不为空
 * - 编码单词英文（处理特殊字符）
 * - 导航到单词详情页面
 *
 * @param {object} item - 单词对象
 */
const goToDetail = (item) => {
  if (!item.english) return;
  uni.navigateTo({
    url: `/pages/word-detail/word-detail?english=${encodeURIComponent(item.english)}`
  });
};

/**
 * 虚拟滚动事件处理
 *
 * 功能：
 * - 记录滚动位置
 * - 记录可见单词数量
 * - 用于性能监控和调试
 *
 * @param {object} event - 滚动事件对象
 */
const handleVirtualScroll = (event) => {
  logger.debug('MasteredWords', '虚拟滚动', {
    scrollTop: event.scrollTop,
    visibleCount: event.visibleItems.length
  });
};

/**
 * 显示取消斯掉确认弹窗
 *
 * 功能：
 * - 保存待取消斯掉的单词
 * - 显示确认弹窗
 *
 * @param {object} item - 单词对象
 */
const showUnmasterConfirm = (item) => {
  unmasterItem.value = item;
  showUnmasterModal.value = true;
};

/**
 * 确认取消斯掉
 *
 * 流程：
 * 1. 验证待取消斯掉的单词
 * 2. 从本地存储读取已斯掉单词列表
 * 3. 过滤掉该单词
 * 4. 保存更新后的列表
 * 5. 更新页面显示
 * 6. 关闭弹窗
 * 7. 显示成功提示
 *
 * 错误处理：
 * - 操作失败时显示错误提示
 * - 记录错误日志
 */
const confirmUnmaster = async () => {
  if (!unmasterItem.value) return;

  try {
    // 从"已斯掉"单词本中移除
    const words = getWordbookWords('mastered') || [];
    const filtered = words.filter(w =>
      (w.english || '').trim().toLowerCase() !==
      (unmasterItem.value.english || '').trim().toLowerCase()
    );
    setWordbookWords('mastered', filtered);

    // 更新页面显示
    masteredWords.value = filtered.map((w, index) => ({
      ...w,
      id: w.id || `mastered_${index}_${w.english}`
    }));

    // 关闭弹窗
    showUnmasterModal.value = false;
    unmasterItem.value = null;

    // 显示成功提示
    uni.showToast({ title: '已取消斯掉', icon: 'success' });
  } catch (e) {
    logger.error('取消斯掉失败:', e);
    uni.showToast({ title: '操作失败', icon: 'none' });
  }
};

/**
 * 页面显示时的生命周期钩子
 *
 * 功能：
 * 1. 加载已斯掉单词列表
 * 2. 计算虚拟滚动容器的高度
 *
 * 高度计算：
 * - 屏幕高度 - 状态栏 - 顶部标题 - 统计卡片 - 单词列表标签 - 底部导航
 * - 最小高度：400px
 */
onShow(() => {
  loadMasteredWords();

  // 计算虚拟滚动容器高度
  try {
    uni.getSystemInfo({
      success: (res) => {
        // 各部分高度
        const statusBarHeight = res.statusBarHeight || 0;
        const headerHeight = 50; // 顶部标题
        const statCardHeight = 100; // 统计卡片
        const labelHeight = 40; // 单词列表标签
        const footerHeight = 50; // 底部导航

        // 计算容器高度
        const containerH = res.windowHeight - statusBarHeight - headerHeight - statCardHeight - labelHeight - footerHeight;
        containerHeight.value = Math.max(400, containerH);
      }
    });
  } catch (e) {
    logger.warn('MasteredWords', '计算容器高度失败', e);
  }
});

/**
 * 页面卸载时的生命周期钩子
 *
 * 功能：
 * - 清理过期缓存
 * - 释放内存
 * - 防止内存泄漏
 */
onUnload(() => {
  try {
    cleanupExpiredCaches();
  } catch (error) {
    logger.warn('MasteredWords', '清理缓存失败', error);
  }
});
</script>

<style scoped>
.container {
  min-height: 100vh;
  background-color: #FFF8FB;
  padding: 20px;
  padding-top: 0;
  display: flex;
  flex-direction: column;
}

.status-bar {
  min-height: 44px;
  height: calc(44px + constant(safe-area-inset-top));
  height: calc(44px + env(safe-area-inset-top));
  width: 100%;
  background: #FFF8FB;
  margin: 0 -20px;
  padding: 0 20px;
}

.content {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.words-list {
  flex: 1;
  min-height: 0;
}

:deep(.virtual-scroller-wrapper) {
  background-color: #FFF8FB !important;
}

:deep(.virtual-scroller) {
  background-color: #FFF8FB !important;
}

.header {
  padding: 20px 0;
  text-align: center;
}

.header-title {
  font-size: 24px;
  font-weight: bold;
  color: #4A4E69;
}

.header-subtitle {
  font-size: 14px;
  color: #8E8798;
  margin-top: 8px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 40px 20px;
}

.empty-icon {
  font-size: 60px;
  margin-bottom: 20px;
}

.empty-title {
  font-size: 18px;
  font-weight: 600;
  color: #4A4E69;
  margin-bottom: 8px;
}

.empty-desc {
  font-size: 14px;
  color: #8E8798;
}

.content {
  padding-bottom: 40px;
}

.section-label {
  font-size: 12px;
  font-weight: 600;
  color: #FF85A1;
  margin: 20px 0 12px 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.card {
  background-color: white;
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 4px 12px rgba(255, 133, 161, 0.08);
}

.stat-card {
  padding: 20px;
}

.stat-row {
  display: flex;
  justify-content: space-around;
  align-items: center;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.stat-number {
  font-size: 32px;
  font-weight: bold;
  color: #FF85A1;
}

.stat-text {
  font-size: 12px;
  color: #8E8798;
}

.stat-divider {
  width: 1px;
  height: 40px;
  background-color: #F0E5ED;
}

.word-card {
  padding: 16px;
}

.word-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.word-info {
  flex: 1;
}

.word-english {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: #4A4E69;
  margin-bottom: 4px;
}

.word-chinese {
  display: block;
  font-size: 13px;
  color: #8E8798;
}

.word-date {
  font-size: 12px;
  color: #C4B5D0;
  margin-left: 12px;
}

.word-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  flex: 1;
  padding: 10px 12px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
}

.detail-btn {
  background-color: #FFF5F7;
  color: #FF85A1;
}

.detail-btn:active {
  background-color: #FFE5EC;
}

.unmaster-btn {
  background-color: #F5E7ED;
  color: #C4B5D0;
}

.unmaster-btn:active {
  background-color: #EDD5E5;
}

.modal-overlay {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  width: 85%;
  max-width: 320px;
  background: white;
  border-radius: 16px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: #4A4E69;
}

.modal-text {
  font-size: 14px;
  color: #5B5565;
}

.modal-hint {
  font-size: 12px;
  color: #8E8798;
  margin-bottom: 8px;
}

.modal-actions {
  display: flex;
  gap: 12px;
  margin-top: 12px;
}

.modal-btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
}

.cancel-btn {
  background-color: #FFF1F5;
  color: #7A7284;
}

.cancel-btn:active {
  background-color: #FFE5EC;
}

.confirm-btn {
  background-color: #FF85A1;
  color: white;
}

.confirm-btn:active {
  background-color: #FF6B8A;
}
</style>
