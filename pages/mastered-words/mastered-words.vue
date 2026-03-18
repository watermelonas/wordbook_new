<template>
  <view class="container">
    <!-- 状态栏占位 -->
    <view class="status-bar"></view>
    
    <!-- 顶部标题 -->
    <view class="header">
      <view class="header-title">已斯单词本</view>
      <view class="header-subtitle">{{ currentBookLabel }}</view>
    </view>

    <!-- 空状态 -->
    <view v-if="masteredWords.length === 0" class="empty-state">
      <view class="empty-icon">📚</view>
      <text class="empty-title">还没有斯掉任何单词</text>
      <text class="empty-desc">开始复习，掌握更多单词吧</text>
    </view>

    <!-- 统计卡片 -->
    <view v-else class="content">
      <view class="section-label">已斯统计</view>
      <view class="card stat-card">
        <view class="stat-row">
          <view class="stat-item">
            <view class="stat-number">{{ masteredWords.length }}</view>
            <view class="stat-text">个单词</view>
          </view>
          <view class="stat-divider"></view>
          <view class="stat-item">
            <view class="stat-number">{{ getStreak() }}</view>
            <view class="stat-text">连续天数</view>
          </view>
        </view>
      </view>

      <!-- 单词列表 -->
      <view class="section-label">单词列表</view>
      <view v-for="item in masteredWords" :key="item.id" class="card word-card">
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
import { ref, computed } from 'vue';
import { onShow, onUnload } from '@dcloudio/uni-app';
import { getCurrentWordbook } from '../../src/utils/wordbookSource.js';
import db from '../../src/utils/db';
import { logger } from '../../src/utils/errorHandler.js';
import { cleanupExpiredCaches } from '../../src/utils/learningCenter_v2.js';
import { getMasteredWordbookWords, removeMasteredWordbookWord, addMasteredWordbookWord } from '../../src/utils/masteredWordbookWords.js';

const masteredWords = ref([]);
const currentBookLabel = computed(() => getCurrentWordbook() || '当前词书');
const showUnmasterModal = ref(false);
const unmasterItem = ref(null);

const loadMasteredWords = async () => {
  try {
    // 加载自用词库的已斯单词
    const selfMastered = await db.getMasteredWords();
    
    // 加载词书的已斯单词
    const bookId = getCurrentWordbook();
    let wordbookMastered = [];
    if (bookId && bookId !== 'self') {
      const masteredSet = getMasteredWordbookWords(bookId);
      const allWords = await getCurrentBookWordPool();
      wordbookMastered = (allWords || [])
        .filter(w => masteredSet.has((w.english || '').trim().toLowerCase()))
        .map(w => ({
          english: w.english,
          chinese: w.chinese,
          mastered_at: new Date().toISOString(),
          id: w.id || `wordbook_${bookId}_${w.english}`
        }));
    }
    
    masteredWords.value = [...selfMastered, ...wordbookMastered];
  } catch (error) {
    console.error('加载已斯单词失败:', error);
    masteredWords.value = [];
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const date = new Date(dateStr);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${month}/${day} ${hour}:${min}`;
  } catch (e) {
    return '—';
  }
};

const getStreak = () => {
  if (masteredWords.value.length === 0) return 0;
  
  const dates = masteredWords.value
    .map(w => {
      if (!w.mastered_at) return null;
      const date = new Date(w.mastered_at);
      return date.toDateString();
    })
    .filter(d => d !== null);
  
  const uniqueDates = [...new Set(dates)].sort().reverse();
  if (uniqueDates.length === 0) return 0;
  
  let streak = 1;
  const today = new Date().toDateString();
  let currentDate = new Date(uniqueDates[0]);
  
  if (uniqueDates[0] !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (uniqueDates[0] !== yesterday.toDateString()) {
      return 0;
    }
  }
  
  for (let i = 1; i < uniqueDates.length; i++) {
    const prevDate = new Date(uniqueDates[i - 1]);
    const currDate = new Date(uniqueDates[i]);
    const diffTime = prevDate - currDate;
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    
    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
};

const goToDetail = (item) => {
  if (!item || !item.english) return;
  uni.navigateTo({
    url: `/pages/word-detail/word-detail?english=${encodeURIComponent(item.english)}&fromWordbook=1`,
    fail: (err) => {
      console.error('跳转失败:', err);
      uni.showToast({ title: '跳转失败', icon: 'none' });
    }
  });
};

const showUnmasterConfirm = (item) => {
  unmasterItem.value = item;
  showUnmasterModal.value = true;
};

const confirmUnmaster = async () => {
  if (!unmasterItem.value) return;
  
  try {
    const bookId = getCurrentWordbook();
    
    if (unmasterItem.value.id && unmasterItem.value.id.startsWith('wordbook_')) {
      // 词书单词：从本地存储中移除
      removeMasteredWordbookWord(bookId, unmasterItem.value.english);
    } else if (unmasterItem.value.id) {
      // 自用词库单词：从数据库中移除
      await db.unmasterWord(unmasterItem.value.id);
    }
    
    uni.showToast({ title: '已取消斯掉', icon: 'success' });
    showUnmasterModal.value = false;
    unmasterItem.value = null;
    await loadMasteredWords();
  } catch (error) {
    console.error('取消斯掉失败:', error);
    uni.showToast({ title: '操作失败', icon: 'none' });
  }
};

const goToReview = () => {
  uni.navigateTo({
    url: '/pages/review/review?preset=all'
  });
};

onShow(() => {
  loadMasteredWords();
});

onUnload(() => {
  // 清理过期缓存
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
  background: #FFF8FB;
  padding: 0;
  display: flex;
  flex-direction: column;
}

.status-bar {
  min-height: 44px;
  height: calc(44px + constant(safe-area-inset-top));
  height: calc(44px + env(safe-area-inset-top));
  width: 100%;
  background: transparent;
}

/* 顶部标题 */
.header {
  padding: 20px 16px 24px;
  background: #FFF8FB;
}

.header-title {
  font-size: 24px;
  font-weight: 700;
  color: #2D1B2E;
  margin-bottom: 4px;
}

.header-subtitle {
  font-size: 13px;
  color: #9B7BA8;
  font-weight: 500;
}

/* 内容区 */
.content {
  flex: 1;
  padding: 0 16px 24px;
}

/* 分类标签 */
.section-label {
  font-size: 14px;
  font-weight: 700;
  color: #2D1B2E;
  margin-bottom: 12px;
  margin-top: 20px;
  padding: 0 4px;
}

.section-label:first-child {
  margin-top: 0;
}

/* 卡片基础样式 */
.card {
  background: white;
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 4px 12px rgba(255, 133, 161, 0.06);
  border: 1px solid rgba(255, 200, 220, 0.2);
}

/* 统计卡片 */
.stat-card {
  padding: 20px 16px;
}

.stat-row {
  display: flex;
  align-items: center;
  justify-content: space-around;
}

.stat-item {
  flex: 1;
  text-align: center;
}

.stat-number {
  font-size: 28px;
  font-weight: 900;
  color: #FF6B9D;
  margin-bottom: 4px;
  letter-spacing: -0.5px;
}

.stat-text {
  font-size: 12px;
  color: #9B7BA8;
  font-weight: 500;
}

.stat-divider {
  width: 1px;
  height: 40px;
  background: #F0E0E8;
  margin: 0 16px;
}

/* 单词卡片 */
.word-card {
  padding: 14px 16px;
}

.word-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  gap: 12px;
}

.word-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.word-english {
  font-size: 18px;
  font-weight: 800;
  color: #FF6B9D;
  letter-spacing: -0.3px;
  line-height: 1.2;
}

.word-chinese {
  font-size: 12px;
  color: #9B7BA8;
  font-weight: 500;
  line-height: 1.3;
}

.word-date {
  font-size: 11px;
  color: #D4A5B8;
  font-weight: 500;
  text-align: right;
  white-space: nowrap;
}

.word-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.action-btn {
  height: 32px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  border: none !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 0 !important;
  line-height: 1 !important;
  transition: all 0.2s ease;
}

.detail-btn {
  background: #FFF1F5 !important;
  color: #FF6B9D !important;
  border: 1px solid #FFD9E8 !important;
}

.detail-btn:active {
  background: #FFE8F0 !important;
}

.unmaster-btn {
  background: #FF6B9D !important;
  color: white !important;
}

.unmaster-btn:active {
  opacity: 0.9;
}

/* 空状态 */
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 56px;
  margin-bottom: 16px;
  opacity: 0.8;
}

.empty-title {
  font-size: 16px;
  font-weight: 700;
  color: #2D1B2E;
  margin-bottom: 8px;
}

.empty-desc {
  font-size: 13px;
  color: #9B7BA8;
  line-height: 1.5;
}

/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 20px;
  padding: 24px;
  width: 85%;
  max-width: 300px;
  text-align: center;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
}

.modal-title {
  font-size: 18px;
  font-weight: 700;
  color: #2D1B2E;
  margin-bottom: 12px;
  display: block;
}

.modal-text {
  font-size: 14px;
  color: #71717A;
  margin-bottom: 8px;
  display: block;
}

.modal-hint {
  font-size: 12px;
  color: #9B7BA8;
  margin-bottom: 20px;
  display: block;
  line-height: 1.5;
}

.modal-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.modal-btn {
  padding: 12px !important;
  border-radius: 10px !important;
  font-size: 14px !important;
  font-weight: 600 !important;
  border: none !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  line-height: 1 !important;
}

.cancel-btn {
  background: #F5F5F7 !important;
  color: #71717A !important;
}

.confirm-btn {
  background: #FF6B9D !important;
  color: white !important;
}
</style>
