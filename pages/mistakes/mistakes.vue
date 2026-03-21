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
/**
 * ============================================================================
 * 错词本页面 (mistakes.vue)
 * ============================================================================
 *
 * 功能概述：
 * 本页面展示用户在学习过程中出错的单词，支持以下功能：
 * 1. 显示错词列表（虚拟滚动优化性能）
 * 2. 显示每个错词的错误次数和最后出错时间
 * 3. 支持查看错词详情
 * 4. 支持标记错词为已掌握（从错词本移除）
 * 5. 快速进入错词复习
 *
 * 页面结构：
 * - 顶部卡片：显示错词本标题和"开始再练"按钮
 * - 错词列表：虚拟滚动列表，显示每个错词的信息
 * - 空状态：当没有错词时显示提示
 *
 * 数据来源：
 * - 学习中心（learningCenter_v2.js）
 * - 当前词书（wordbookSource.js）
 *
 * 优化策略：
 * - 虚拟滚动：只渲染可见的错词，减少 DOM 节点
 * - 页面显示时加载错词列表
 * - 页面卸载时清理缓存
 * ============================================================================
 */
import { ref, computed } from 'vue';
import { onShow, onUnload } from '@dcloudio/uni-app';
import VirtualScroller from '../../src/components/VirtualScroller.vue';
import { getCurrentWordbook } from '../../src/utils/wordbookSource.js';
import { getMistakeWords, clearMistake } from '../../src/utils/learningCenter_v2.js';
import { logger } from '../../src/utils/errorHandler.js';
import { cleanupExpiredCaches } from '../../src/utils/learningCenter_v2.js';

// ========== 响应式数据 ==========
/**
 * 错词列表
 * 每个错词对象包含：
 * - english：英文单词
 * - chinese：中文释义
 * - error_count：错误次数
 * - last_wrong_at：最后出错时间
 * - key：唯一标识符（用于虚拟滚动）
 */
const mistakes = ref([]);
// 虚拟滚动容器高度
const containerHeight = ref(600);
// 当前词书标签
const currentBookLabel = computed(() => getCurrentWordbook() || '当前词书');

/**
 * 加载错词列表
 * 从学习中心获取当前词书的错词
 *
 * 流程：
 * 1. 获取当前词书 ID
 * 2. 调用学习中心获取错词列表
 * 3. 更新响应式数据
 */
const loadMistakes = () => {
  mistakes.value = getMistakeWords(getCurrentWordbook(), true);
};

/**
 * 格式化时间显示
 * 显示相对时间（如"01/15 14:30"）
 *
 * 时间格式规则：
 * - 如果时间为空或无效，显示"最近新增"
 * - 否则显示"月/日 时:分"格式
 *
 * 例如：
 * - 2024-01-15 14:30:00 → "01/15 14:30"
 * - null → "最近新增"
 *
 * @param {string} time - ISO 格式的时间字符串
 * @returns {string} 格式化后的时间字符串
 */
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

/**
 * 跳转到错词复习
 */
const goToWrongReview = () => {
  uni.navigateTo({ url: '/pages/review/review?preset=wrong' });
};

/**
 * 跳转到单词详情页
 * @param {object} item - 错词对象
 */
const goToDetail = (item) => {
  if (!item || !item.english) return;
  uni.navigateTo({ url: `/pages/word-detail/word-detail?english=${encodeURIComponent(item.english)}&fromWordbook=1` });
};

/**
 * 标记单词为已掌握（从错词本移除）
 * 流程：
 * 1. 调用学习中心清除错词记录
 * 2. 重新加载错词列表
 * 3. 显示成功提示
 *
 * @param {object} item - 错词对象
 */
const clearOne = (item) => {
  clearMistake(item.english);
  loadMistakes();
  uni.showToast({ title: '已从错词本移除', icon: 'none' });
};

/**
 * 虚拟滚动事件处理
 * 用于调试和性能监控
 *
 * 事件信息：
 * - scrollTop：当前滚动位置
 * - visibleStart：可见区域开始索引
 * - visibleEnd：可见区域结束索引
 * - visibleItems：可见的单词列表
 */
const handleVirtualScroll = (event) => {
  logger.debug('Mistakes', '虚拟滚动', {
    scrollTop: event.scrollTop,
    visibleCount: event.visibleItems.length
  });
};

// 页面显示时加载错词列表
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

// 页面卸载时清理缓存
onUnload(() => {
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
