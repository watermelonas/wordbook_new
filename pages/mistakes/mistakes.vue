<template>
  <view class="container">
    <!-- 状态栏占位 -->
    <view class="status-bar"></view>

    <view class="card top-card">
      <view>
        <view class="card-title">错词本</view>
        <view class="card-sub">当前词书：{{ currentBookLabel }}</view>
      </view>
      <button class="review-btn" @click="goToWrongReview">开始再练</button>
    </view>

    <view v-if="mistakes.length === 0" class="card empty-card">
      <text class="empty-text">当前没有待消灭的错词</text>
    </view>

    <VirtualScroller
      v-else
      :items="mistakes"
      :item-height="100"
      :container-height="containerHeight"
      :buffer-size="5"
      key-field="key"
      @scroll="handleVirtualScroll"
      class="mistakes-list"
    >
      <template #default="{ item, index }">
        <view class="card mistake-card">
          <view class="mistake-head">
            <view>
              <text class="mistake-word">{{ item.english }}</text>
              <text class="mistake-chi">{{ item.chinese || '—' }}</text>
            </view>
            <view class="mistake-meta">
              <text>错 {{ item.error_count || 0 }} 次</text>
              <text>{{ formatTime(item.last_wrong_at) }}</text>
            </view>
          </view>
          <view class="action-row">
            <button class="pill-btn secondary" @click="goToDetail(item)">查看详情</button>
            <button class="pill-btn tertiary" @click="clearOne(item)">标记已掌握</button>
          </view>
        </view>
      </template>
    </VirtualScroller>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onShow, onUnload } from '@dcloudio/uni-app';
import VirtualScroller from '../../src/components/VirtualScroller.vue';
import { getCurrentWordbook } from '../../src/utils/wordbookSource.js';
import { getMistakeWords, clearMistake } from '../../src/utils/learningCenter_v2.js';
import { logger } from '../../src/utils/errorHandler.js';
import { cleanupExpiredCaches } from '../../src/utils/learningCenter_v2.js';

const mistakes = ref([]);
const containerHeight = ref(600);
const currentBookLabel = computed(() => getCurrentWordbook() || '当前词书');

const loadMistakes = () => {
  mistakes.value = getMistakeWords(getCurrentWordbook(), true);
};

const formatTime = (time) => {
  if (!time) return '最近新增';
  const date = new Date(time);
  if (Number.isNaN(date.getTime())) return '最近新增';
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  const h = `${date.getHours()}`.padStart(2, '0');
  const min = `${date.getMinutes()}`.padStart(2, '0');
  return `${m}/${d} ${h}:${min}`;
};

const goToWrongReview = () => {
  uni.navigateTo({ url: '/pages/review/review?preset=wrong' });
};

const goToDetail = (item) => {
  if (!item || !item.english) return;
  uni.navigateTo({ url: `/pages/word-detail/word-detail?english=${encodeURIComponent(item.english)}&fromWordbook=1` });
};

const clearOne = (item) => {
  clearMistake(item.english);
  loadMistakes();
  uni.showToast({ title: '已从错词本移除', icon: 'none' });
};

/**
 * 虚拟滚动事件处理
 */
const handleVirtualScroll = (event) => {
  logger.debug('Mistakes', '虚拟滚动', {
    scrollTop: event.scrollTop,
    visibleCount: event.visibleItems.length
  });
};

onShow(() => {
  loadMistakes();

  // 计算虚拟滚动容器高度
  try {
    uni.getSystemInfo({
      success: (res) => {
        // 屏幕高度 - 状态栏 - 顶部卡片 - 底部导航
        const statusBarHeight = res.statusBarHeight || 0;
        const topCardHeight = 80; // 顶部卡片高度
        const footerHeight = 50; // 底部导航
        const containerH = res.windowHeight - statusBarHeight - topCardHeight - footerHeight;
        containerHeight.value = Math.max(400, containerH);
      }
    });
  } catch (e) {
    logger.warn('Mistakes', '计算容器高度失败', e);
  }
});

onUnload(() => {
  // 清理过期缓存
  try {
    cleanupExpiredCaches();
  } catch (error) {
    logger.warn('Mistakes', '清理缓存失败', error);
  }
});
</script>

<style scoped>
.container {
  min-height: 100vh;
  background: #FFF8FB;
  padding: 16px;
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
  margin: 0 -16px;
  padding: 0 16px;
}

.top-card {
  margin-bottom: 14px;
}

.mistakes-list {
  flex: 1;
  min-height: 0;
  padding: 0 -16px;
}

:deep(.virtual-scroller-wrapper) {
  background-color: #FFF8FB !important;
}

:deep(.virtual-scroller) {
  background-color: #FFF8FB !important;
}

.card {
  background: #FFFFFF;
  border-radius: 22px;
  padding: 18px;
  margin-bottom: 14px;
  box-shadow: 0 8px 22px rgba(255, 133, 161, 0.08);
}

.top-card,
.mistake-head,
.mistake-meta,
.action-row {
  display: flex;
}

.top-card,
.mistake-head {
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.card-title {
  font-size: 17px;
  font-weight: 700;
  color: #4A4E69;
}

.card-sub,
.mistake-chi,
.mistake-meta {
  font-size: 13px;
  color: #8E8798;
}

.review-btn,
.pill-btn {
  border-radius: 999px !important;
}

.review-btn {
  height: 40px;
  padding: 0 18px !important;
  background: #FF85A1 !important;
  color: #FFFFFF !important;
}

.mistake-word {
  display: block;
  font-size: 22px;
  color: #B85C6F;
  font-weight: 800;
  margin-bottom: 6px;
}

.mistake-meta {
  flex-direction: column;
  gap: 6px;
  text-align: right;
}

.action-row {
  gap: 10px;
  margin-top: 14px;
}

.pill-btn {
  flex: 1;
  height: 42px;
  background: #FFF1F5 !important;
  color: #B85C6F !important;
  border: 1px solid #F3DCE5 !important;
}

.pill-btn.tertiary {
  background: #FF85A1 !important;
  color: #FFFFFF !important;
}

.empty-card {
  text-align: center;
}

.empty-text {
  font-size: 14px;
  color: #8E8798;
}
</style>
