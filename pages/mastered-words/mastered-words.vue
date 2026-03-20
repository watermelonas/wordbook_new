<template>
  <view class="container">
    <!-- 状态栏占位 -->
    <view class="status-bar"></view>

    <!-- 顶部标题 -->
    <view class="header">
      <view class="header-title">已斯单词本</view>
    </view>

    <!-- 空状态 -->
    <view v-if="masteredWords.length === 0" class="empty-state">
      <view class="empty-icon">📚</view>
      <text class="empty-title">还没有斯掉任何单词</text>
      <text class="empty-desc">开始复习，掌握更多单词吧</text>
    </view>

    <!-- 统计卡片和单词列表 -->
    <view v-else class="content">
      <view class="section-label">已斯统计</view>
      <view class="card stat-card">
        <view class="stat-row">
          <view class="stat-item">
            <view class="stat-number">{{ masteredWords.length }}</view>
            <view class="stat-text">个单词</view>
          </view>
        </view>
      </view>

      <!-- 单词列表 - 使用虚拟滚动 -->
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
        <template #default="{ item, index }">
          <view class="card word-card">
            <view class="word-header">
              <view class="word-info">
                <text class="word-english">{{ item.english }}</text>
                <text class="word-chinese">{{ item.chinese || '—' }}</text>
              </view>
              <view class="word-date">{{ formatDate(item.mastered_at) }}</view>
            </view>
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
import { ref } from 'vue';
import { onShow, onUnload } from '@dcloudio/uni-app';
import VirtualScroller from '../../src/components/VirtualScroller.vue';
import { getWordbookWords, setWordbookWords } from '../../src/utils/wordbookSource.js';
import { logger } from '../../src/utils/errorHandler.js';
import { cleanupExpiredCaches } from '../../src/utils/learningCenter_v2.js';

const masteredWords = ref([]);
const containerHeight = ref(600);
const showUnmasterModal = ref(false);
const unmasterItem = ref(null);

const loadMasteredWords = async () => {
  try {
    // 加载"已斯"单词本
    const words = getWordbookWords('mastered') || [];
    masteredWords.value = words.map((w, index) => ({
      ...w,
      id: w.id || `mastered_${index}_${w.english}`
    }));
  } catch (e) {
    logger.error('MasteredWords', '加载已斯单词本失败', e);
    masteredWords.value = [];
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
};

const goToDetail = (item) => {
  if (!item.english) return;
  uni.navigateTo({
    url: `/pages/word-detail/word-detail?english=${encodeURIComponent(item.english)}`
  });
};

/**
 * 虚拟滚动事件处理
 */
const handleVirtualScroll = (event) => {
  logger.debug('MasteredWords', '虚拟滚动', {
    scrollTop: event.scrollTop,
    visibleCount: event.visibleItems.length
  });
};

const showUnmasterConfirm = (item) => {
  unmasterItem.value = item;
  showUnmasterModal.value = true;
};

const confirmUnmaster = async () => {
  if (!unmasterItem.value) return;

  try {
    // 从"已斯"单词本中移除
    const words = getWordbookWords('mastered') || [];
    const filtered = words.filter(w => (w.english || '').trim().toLowerCase() !== (unmasterItem.value.english || '').trim().toLowerCase());
    setWordbookWords('mastered', filtered);

    masteredWords.value = filtered.map((w, index) => ({
      ...w,
      id: w.id || `mastered_${index}_${w.english}`
    }));

    showUnmasterModal.value = false;
    unmasterItem.value = null;
    uni.showToast({ title: '已取消斯掉', icon: 'success' });
  } catch (e) {
    logger.error('取消斯掉失败:', e);
    uni.showToast({ title: '操作失败', icon: 'none' });
  }
};

onShow(() => {
  loadMasteredWords();

  // 计算虚拟滚动容器高度
  try {
    uni.getSystemInfo({
      success: (res) => {
        // 屏幕高度 - 状态栏 - 顶部标题 - 统计卡片 - 单词列表标签 - 底部导航
        const statusBarHeight = res.statusBarHeight || 0;
        const headerHeight = 50; // 顶部标题
        const statCardHeight = 100; // 统计卡片
        const labelHeight = 40; // 单词列表标签
        const footerHeight = 50; // 底部导航
        const containerH = res.windowHeight - statusBarHeight - headerHeight - statCardHeight - labelHeight - footerHeight;
        containerHeight.value = Math.max(400, containerH);
      }
    });
  } catch (e) {
    logger.warn('MasteredWords', '计算容器高度失败', e);
  }
});

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
