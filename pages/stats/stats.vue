<template>
  <view class="container">
    <!-- 状态栏占位 -->
    <view class="status-bar"></view>
    
    <view class="card">
      <view class="card-title">当前词书</view>
      <view class="card-sub">{{ currentBookLabel }}</view>
      <view class="summary-grid">
        <view class="summary-item">
          <text class="summary-value">{{ stats.dueCount || 0 }}</text>
          <text class="summary-label">今日到期</text>
        </view>
        <view class="summary-item">
          <text class="summary-value">{{ stats.mistakeCount || 0 }}</text>
          <text class="summary-label">错词待练</text>
        </view>
        <view class="summary-item">
          <text class="summary-value">{{ stats.reviewedCount || 0 }}</text>
          <text class="summary-label">已建档词</text>
        </view>
        <view class="summary-item">
          <text class="summary-value">{{ stats.streak || 0 }}</text>
          <text class="summary-label">连续学习</text>
        </view>
      </view>
    </view>

    <view class="card">
      <view class="card-title">掌握度分层</view>
      <view class="bucket-list">
        <view class="bucket-item bucket-strong">
          <view class="bucket-left">
            <text class="bucket-dot dot-strong">●</text>
            <text class="bucket-name">熟练</text>
          </view>
          <view class="bucket-right">
            <view class="bucket-bar-bg"><view class="bucket-bar-fill bar-strong" :style="{ width: getBucketPercent('strong') + '%' }"></view></view>
            <text class="bucket-count">{{ stats.masteryBuckets?.strong || 0 }}</text>
          </view>
        </view>
        <view class="bucket-item bucket-normal">
          <view class="bucket-left">
            <text class="bucket-dot dot-normal">●</text>
            <text class="bucket-name">稳定</text>
          </view>
          <view class="bucket-right">
            <view class="bucket-bar-bg"><view class="bucket-bar-fill bar-normal" :style="{ width: getBucketPercent('normal') + '%' }"></view></view>
            <text class="bucket-count">{{ stats.masteryBuckets?.normal || 0 }}</text>
          </view>
        </view>
        <view class="bucket-item bucket-weak">
          <view class="bucket-left">
            <text class="bucket-dot dot-weak">●</text>
            <text class="bucket-name">薄弱</text>
          </view>
          <view class="bucket-right">
            <view class="bucket-bar-bg"><view class="bucket-bar-fill bar-weak" :style="{ width: getBucketPercent('weak') + '%' }"></view></view>
            <text class="bucket-count">{{ stats.masteryBuckets?.weak || 0 }}</text>
          </view>
        </view>
        <view class="bucket-item bucket-danger">
          <view class="bucket-left">
            <text class="bucket-dot dot-danger">●</text>
            <text class="bucket-name">危险</text>
          </view>
          <view class="bucket-right">
            <view class="bucket-bar-bg"><view class="bucket-bar-fill bar-danger" :style="{ width: getBucketPercent('danger') + '%' }"></view></view>
            <text class="bucket-count">{{ stats.masteryBuckets?.danger || 0 }}</text>
          </view>
        </view>
      </view>
    </view>

    <view class="card">
      <view class="card-title">近 7 天趋势</view>
      <view v-if="trend.length === 0" class="empty-text">还没有形成学习记录</view>
      <view v-else class="trend-list">
        <view v-for="item in trend" :key="item.day" class="trend-item">
          <view class="trend-meta">
            <text class="trend-day">{{ item.day.slice(5) }}</text>
            <text class="trend-review">复习 {{ item.reviewedCount }}</text>
          </view>
          <view class="trend-bar-wrap">
            <view class="trend-bar-bg">
              <view class="trend-bar-fill" :style="{ width: getAccuracy(item) + '%' }"></view>
            </view>
            <text class="trend-acc">{{ getAccuracy(item) }}%</text>
          </view>
        </view>
      </view>
    </view>

    <view class="card">
      <view class="card-title">快速入口</view>
      <view class="action-row">
        <button class="pill-btn" @click="goToReview('due')">到期复习</button>
        <button class="pill-btn secondary" @click="goToReview('wrong')">错词再练</button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onShow, onUnload } from '@dcloudio/uni-app';
import db from '../../src/utils/db_v2';
import { getCurrentWordbook, isLocalWordbookKey, loadLocalWordbook, getWordbookWords } from '../../src/utils/wordbookSource.js';
import { getStudyStats } from '../../src/utils/learningCenter.js';
import { logger } from '../../src/utils/errorHandler.js';
import { cleanupExpiredCaches } from '../../src/utils/learningCenter_v2.js';

const stats = ref({
  dueCount: 0,
  mistakeCount: 0,
  reviewedCount: 0,
  streak: 0,
  masteryBuckets: { strong: 0, normal: 0, weak: 0, danger: 0 },
});
const trend = ref([]);

const currentBookLabel = computed(() => getCurrentWordbook() || '当前词书');

const getWordPool = async () => {
  const book = getCurrentWordbook();
  if (book === 'self') return await db.getAllWords();
  if (isLocalWordbookKey(book)) return await loadLocalWordbook(book);
  return getWordbookWords(book) || [];
};

const loadStats = async () => {
  const words = await getWordPool();
  const result = getStudyStats(words, getCurrentWordbook());
  stats.value = result;
  trend.value = Array.isArray(result.trend) ? result.trend : [];
};

const getAccuracy = (item) => {
  const total = Number(item.reviewedCount || 0);
  if (!total) return 0;
  return Math.round((Number(item.correctCount || 0) / total) * 100);
};

const getBucketPercent = (key) => {
  const b = stats.value.masteryBuckets;
  if (!b) return 0;
  const total = (b.strong || 0) + (b.normal || 0) + (b.weak || 0) + (b.danger || 0);
  if (!total) return 0;
  return Math.round(((b[key] || 0) / total) * 100);
};

const goToReview = (preset) => {
  uni.navigateTo({ url: `/pages/review/review?preset=${encodeURIComponent(preset)}` });
};

onShow(() => {
  loadStats();
});

onUnload(() => {
  // 清理过期缓存
  try {
    cleanupExpiredCaches();
  } catch (error) {
    logger.warn('Stats', '清理缓存失败', error);
  }
});
</script>

<style scoped>
.container {
  min-height: 100vh;
  background: #FFF8FB;
  padding: 16px;
  padding-top: 0;
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

.card {
  background: #FFFFFF;
  border-radius: 22px;
  padding: 18px;
  margin-bottom: 14px;
  box-shadow: 0 8px 22px rgba(255, 133, 161, 0.08);
}

.card-title {
  font-size: 17px;
  font-weight: 700;
  color: #4A4E69;
  margin-bottom: 6px;
}

.card-sub {
  font-size: 13px;
  color: #8E8798;
  margin-bottom: 12px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.summary-item,
.bucket-item,
.trend-item {
  background: #FFF8FB;
  border: 1px solid #F4DFE8;
  border-radius: 16px;
}

.summary-item {
  padding: 14px 10px;
  text-align: center;
}

.summary-value {
  display: block;
  font-size: 24px;
  line-height: 1.1;
  font-weight: 800;
  color: #B85C6F;
  margin-bottom: 6px;
}

.summary-label,
.trend-review {
  font-size: 12px;
  color: #8E8798;
}

.bucket-list,
.trend-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.bucket-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-left: 4px solid transparent;
  border-radius: 14px;
  background: #FFF8FB;
  border-top: 1px solid #F4DFE8;
  border-right: 1px solid #F4DFE8;
  border-bottom: 1px solid #F4DFE8;
}

.bucket-strong { border-left-color: #7EC8A3; }
.bucket-normal { border-left-color: #F4A3B8; }
.bucket-weak   { border-left-color: #F6C47E; }
.bucket-danger { border-left-color: #E57373; }

.bucket-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 56px;
}

.bucket-dot {
  font-size: 10px;
}

.dot-strong { color: #7EC8A3; }
.dot-normal { color: #F4A3B8; }
.dot-weak   { color: #F6C47E; }
.dot-danger { color: #E57373; }

.bucket-name {
  font-size: 14px;
  color: #4A4E69;
  font-weight: 600;
}

.bucket-right {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: 12px;
}

.bucket-bar-bg {
  flex: 1;
  height: 6px;
  border-radius: 999px;
  background: #F0E4EC;
  overflow: hidden;
}

.bucket-bar-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.4s ease;
}

.bar-strong { background: #7EC8A3; }
.bar-normal { background: #F4A3B8; }
.bar-weak   { background: #F6C47E; }
.bar-danger { background: #E57373; }

.bucket-count {
  font-size: 16px;
  font-weight: 700;
  color: #4A4E69;
  min-width: 28px;
  text-align: right;
}

.trend-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  background: #FFF8FB;
  border: 1px solid #F4DFE8;
  border-radius: 14px;
}

.trend-meta {
  min-width: 72px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.trend-day {
  display: block;
  font-size: 14px;
  color: #4A4E69;
  font-weight: 600;
}

.trend-review {
  font-size: 12px;
  color: #8E8798;
}

.trend-bar-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: 12px;
}

.trend-bar-bg {
  flex: 1;
  height: 6px;
  border-radius: 999px;
  background: #F0E4EC;
  overflow: hidden;
}

.trend-bar-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #F9C8D8 0%, #F48FB1 100%);
  transition: width 0.4s ease;
}

.trend-acc {
  font-size: 16px;
  color: #B85C6F;
  font-weight: 700;
  min-width: 42px;
  text-align: right;
}
/*placeholder*/

.action-row {
  display: flex;
  gap: 10px;
}

.pill-btn {
  flex: 1;
  height: 44px;
  border-radius: 999px !important;
  background: #FF85A1 !important;
  color: #FFFFFF !important;
}

.pill-btn.secondary {
  background: #FFF1F5 !important;
  color: #B85C6F !important;
  border: 1px solid #F3DCE5 !important;
}

.empty-text {
  font-size: 14px;
  color: #8E8798;
}
</style>
