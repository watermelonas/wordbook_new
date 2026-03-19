<template>
  <view class="selector-container">
    <!-- 导航栏 -->
    <view class="custom-nav-bar">
      <view class="nav-back-btn" @click="$emit('back')">‹</view>
      <text class="nav-title">{{ currentWordbookName }}</text>
      <view class="nav-settings-btn" @click="showSettings = true">⚙</view>
    </view>

    <!-- 初始状态：未开始复习 -->
    <view class="start-review-fixed">

      <!-- 今日进度 -->
      <view class="section-label">今日进度</view>
      <view class="card stat-card-large">
        <view class="stat-value-large">
          <text class="stat-number">{{ todayReviewed }}</text>
          <text class="stat-sep">/ {{ settings.count }}</text>
        </view>
        <view class="stat-bar">
          <view class="stat-bar-fill" :style="{ width: (todayReviewed / settings.count * 100) + '%' }"></view>
        </view>
        <view class="stat-detail-row">新学 {{ sessionNewCount }} · 复习 {{ sessionOldCount }}</view>
      </view>

      <!-- 词书进度 -->
      <view class="section-label">词书进度</view>
      <view class="card stat-card-large">
        <view class="stat-header-row">
          <text class="stat-left-text">已学 {{ learnedUniqueWords }} / {{ bookTotalWords }} 词</text>
          <text class="stat-right-text">{{ currentProgressPercent }}%</text>
        </view>
        <view class="stat-bar">
          <view class="stat-bar-fill" :style="{ width: currentProgressPercent + '%' }"></view>
        </view>
        <view class="stat-detail-row">剩余 {{ remainingNewWords }} 词 · 预计 {{ remainDays }} 天完成</view>
      </view>

      <!-- 推荐复习 -->
      <view class="section-label">推荐复习</view>
      <view class="card recommend-card" @click="$emit('start-recommended')">
        <view class="recommend-info">
          <text class="recommend-title">{{ recommendedPresetTitle }}</text>
          <text class="recommend-desc">{{ recommendedPresetDesc }}</text>
        </view>
        <button class="start-btn">开始复习</button>
      </view>

      <!-- 其他复习方式 -->
      <view class="section-label">其他复习方式</view>
      <view class="other-buttons">
        <view
          v-for="preset in otherPresets"
          :key="preset.key"
          class="card other-btn"
          @click="$emit('start-preset', preset.key)"
        >
          <text class="btn-title">{{ preset.title }}</text>
          <text class="btn-count">{{ preset.count }}个</text>
        </view>
      </view>
    </view>

    <!-- 设置弹窗 -->
    <view v-if="showSettings" class="modal-overlay" @click="showSettings = false">
      <view class="settings-modal" @click.stop>
        <view class="modal-header">
          <text class="modal-title">复习设置</text>
          <view class="modal-close" @click="showSettings = false">✕</view>
        </view>

        <!-- 现代网格卡片布局 - 2x2 -->
        <view class="settings-cards-grid">
          <!-- 复习模式卡片 -->
          <view class="settings-card" @click="openModeSelector">
            <text class="card-title">复习模式</text>
            <text class="card-description">{{ modeDisplayText }}</text>
            <view class="card-arrow-icon">›</view>
          </view>

          <!-- 排序方式卡片 -->
          <view class="settings-card" @click="openSortSelector">
            <text class="card-title">排序方式</text>
            <text class="card-description">{{ sortByText }}</text>
            <view class="card-arrow-icon">›</view>
          </view>

          <!-- 复习数量卡片 -->
          <view class="settings-card" @click="openCountSelector">
            <text class="card-title">复习数量</text>
            <text class="card-description">{{ settings.count }} 个</text>
            <view class="card-arrow-icon">›</view>
          </view>

          <!-- 复习难度卡片 -->
          <view class="settings-card" @click="openDifficultySelector">
            <text class="card-title">复习难度</text>
            <text class="card-description">{{ settings.difficulty === 'hard' ? '困难' : '标准' }}</text>
            <view class="card-arrow-icon">›</view>
          </view>
        </view>

        <!-- 选择器弹窗 -->
        <view v-if="showModeSelector" class="selector-overlay" @click="showModeSelector = false">
          <view class="selector-modal" @click.stop>
            <text class="selector-title">选择复习模式</text>
            <view class="selector-options">
              <view
                v-for="(name, idx) in modeOptions"
                :key="'mode-' + idx"
                class="selector-item"
                :class="{ active: modeIndex === idx }"
                @click="onModeChange(idx); showModeSelector = false"
              >
                {{ name }}
              </view>
            </view>
          </view>
        </view>

        <view v-if="showSortSelector" class="selector-overlay" @click="showSortSelector = false">
          <view class="selector-modal" @click.stop>
            <text class="selector-title">选择排序方式</text>
            <view class="selector-options">
              <view
                v-for="(name, idx) in sortOptions"
                :key="'sort-' + idx"
                class="selector-item"
                :class="{ active: sortIndex === idx }"
                @click="onSortChange(idx); showSortSelector = false"
              >
                {{ name }}
              </view>
            </view>
          </view>
        </view>

        <view v-if="showCountSelector" class="selector-overlay" @click="showCountSelector = false">
          <view class="selector-modal" @click.stop>
            <text class="selector-title">选择复习数量</text>
            <view class="selector-options">
              <view
                v-for="n in countOptions"
                :key="'count-' + n"
                class="selector-item"
                :class="{ active: settings.count === n }"
                @click="setDailyTarget(n); showCountSelector = false"
              >
                {{ n }} 个
              </view>
            </view>
          </view>
        </view>

        <view v-if="showDifficultySelector" class="selector-overlay" @click="showDifficultySelector = false">
          <view class="selector-modal" @click.stop>
            <text class="selector-title">选择复习难度</text>
            <view class="selector-options">
              <view
                class="selector-item"
                :class="{ active: settings.difficulty === 'normal' }"
                @click="onDifficultyChange('normal'); showDifficultySelector = false"
              >
                标准
              </view>
              <view
                class="selector-item"
                :class="{ active: settings.difficulty === 'hard' }"
                @click="onDifficultyChange('hard'); showDifficultySelector = false"
              >
                困难
              </view>
            </view>
          </view>
        </view>

        <view class="modal-actions">
          <button class="modal-btn" @click="showSettings = false">关闭</button>
        </view>
      </view>
    </view>

    <!-- 恢复复习弹窗 -->
    <view v-if="showResumeModal" class="modal-overlay" @click.self="$emit('discard-review')">
      <view class="resume-modal" @click.stop>
        <text class="modal-title">发现未完成的复习</text>
        <text class="resume-text">是否继续上次的复习？</text>
        <view class="modal-actions">
          <button class="modal-btn secondary" @click="$emit('discard-review')">放弃</button>
          <button class="modal-btn primary" @click="$emit('resume-review')">继续</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { getCurrentWordbook } from '../../../src/utils/wordbookSource.js';

// Props
const props = defineProps({
  todayReviewed: Number,
  learnedUniqueWords: Number,
  bookTotalWords: Number,
  currentProgressPercent: Number,
  remainingNewWords: Number,
  remainDays: Number,
  sessionNewCount: Number,
  sessionOldCount: Number,
  settings: Object,
  recommendedPresetTitle: String,
  recommendedPresetDesc: String,
  otherPresets: Array,
  showResumeModal: Boolean,
});

// Emits
const emit = defineEmits([
  'back',
  'start-recommended',
  'start-preset',
  'discard-review',
  'resume-review',
  'update-settings',
]);

// Local state
const showSettings = ref(false);
const showModeSelector = ref(false);
const showSortSelector = ref(false);
const showCountSelector = ref(false);
const showDifficultySelector = ref(false);

// Options
const modeOptions = ['看英文选中文', '看中文选英文', 'AI例句填空', 'AI语境复习', '拼写填空'];
const sortOptions = ['智能推荐', '难点先行', '新词优先'];
const countOptions = [20, 30, 40, 50, 80, 100, 200, 500, 800, 1000];

// Computed
const currentWordbookName = computed(() => {
  const bookId = getCurrentWordbook();
  return bookId === 'self' ? '我的单词本' : bookId || '我的单词本';
});

const modeIndex = computed(() => {
  const map = { choice: 0, choice_en: 1, fill: 2, ai: 3, spell: 4 };
  return map[props.settings?.mode] ?? 0;
});

const modeDisplayText = computed(() => {
  const map = { choice: '看英文选中文', choice_en: '看中文选英文', fill: 'AI例句填空', ai: 'AI语境复习', spell: '拼写填空' };
  return map[props.settings?.mode] || '看英文选中文';
});

const sortIndex = computed(() => {
  const map = { smart: 0, error: 1, new: 2 };
  return map[props.settings?.sortBy] || 0;
});

const sortByText = computed(() => {
  const map = { smart: '智能推荐', error: '难点先行', new: '新词优先' };
  return map[props.settings?.sortBy] || '智能推荐';
});

// Methods
const openModeSelector = () => {
  showModeSelector.value = true;
};

const openSortSelector = () => {
  showSortSelector.value = true;
};

const openCountSelector = () => {
  showCountSelector.value = true;
};

const openDifficultySelector = () => {
  showDifficultySelector.value = true;
};

const onModeChange = (idx) => {
  const map = ['choice', 'choice_en', 'fill', 'ai', 'spell'];
  const newSettings = { ...props.settings, mode: map[idx] };
  emit('update-settings', newSettings);
};

const onSortChange = (idx) => {
  const map = ['smart', 'error', 'new'];
  const newSettings = { ...props.settings, sortBy: map[idx] };
  emit('update-settings', newSettings);
};

const setDailyTarget = (n) => {
  const newSettings = { ...props.settings, count: Number(n) };
  emit('update-settings', newSettings);
};

const onDifficultyChange = (difficulty) => {
  const newSettings = { ...props.settings, difficulty };
  emit('update-settings', newSettings);
};
</script>

<style scoped>
/* 导航栏样式 */
.custom-nav-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  min-height: 50px;
  height: calc(50px + constant(safe-area-inset-top));
  height: calc(50px + env(safe-area-inset-top));
  padding-top: calc(8px + constant(safe-area-inset-top));
  padding-top: calc(8px + env(safe-area-inset-top));
  display: flex;
  align-items: center;
  justify-content: center;
  padding-left: 4px;
  padding-right: 4px;
  z-index: 999;
  background: transparent;
  position: relative;
}

.nav-back-btn {
  font-size: 32px;
  color: #FF85A1;
  font-weight: 300;
  line-height: 1;
  padding: 4px 8px;
  min-width: 40px;
}

.nav-title {
  flex: 1;
  text-align: center;
  font-size: 18px;
  font-weight: 600;
  color: #2C3E50;
}

.nav-settings-btn {
  font-size: 24px;
  color: #FF85A1;
  padding: 4px 8px;
  min-width: 40px;
  text-align: right;
}

/* 主容器 */
.selector-container {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.start-review-fixed {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding: 8px;
  padding-top: max(8px, calc(env(safe-area-inset-top) + 58px));
  gap: 6px;
  overflow-y: auto;
}

.section-label {
  font-size: 12px;
  font-weight: 600;
  color: #8D8790;
  margin-bottom: 4px;
  margin-top: 0px;
  padding: 0 4px;
}

.card {
  background: white;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  flex: 1;
}

.stat-card-large {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stat-value-large {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.stat-number {
  font-size: 36px;
  font-weight: 700;
  color: #FF85A1;
}

.stat-sep {
  font-size: 18px;
  color: #A1A1AA;
}

.stat-bar {
  width: 100%;
  height: 10px;
  background: #F0F0F0;
  border-radius: 5px;
  overflow: hidden;
}

.stat-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #FF85A1, #FF6B9D);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.stat-detail-row {
  font-size: 14px;
  color: #8D8790;
  line-height: 1.4;
}

.stat-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-left-text {
  font-size: 15px;
  color: #2C3E50;
  font-weight: 500;
}

.stat-right-text {
  font-size: 16px;
  color: #FF85A1;
  font-weight: 600;
}

.recommend-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
}

.recommend-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.recommend-title {
  font-size: 16px;
  font-weight: 600;
  color: #2C3E50;
}

.recommend-desc {
  font-size: 13px;
  color: #8D8790;
  line-height: 1.4;
}

.start-btn {
  padding: 10px 18px;
  background: #FF85A1;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
}

.other-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  flex: 1;
}

.other-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px 12px;
  text-align: center;
}

.btn-title {
  font-size: 14px;
  font-weight: 600;
  color: #2C3E50;
}

.btn-count {
  font-size: 12px;
  color: #8D8790;
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  z-index: 1000;
}

.settings-modal {
  width: 100%;
  background: white;
  border-radius: 24px 24px 0 0;
  padding: 20px;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: #2C3E50;
}

.modal-close {
  font-size: 24px;
  color: #A1A1AA;
  padding: 4px 8px;
}

.settings-cards-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 20px;
}

.settings-card {
  background: #F8F8F8;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: relative;
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: #2C3E50;
}

.card-description {
  font-size: 13px;
  color: #8D8790;
}

.card-arrow-icon {
  position: absolute;
  top: 50%;
  right: 12px;
  transform: translateY(-50%);
  font-size: 18px;
  color: #FF85A1;
}

.selector-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  z-index: 1001;
}

.selector-modal {
  width: 100%;
  background: white;
  border-radius: 24px 24px 0 0;
  padding: 20px;
  max-height: 60vh;
  overflow-y: auto;
}

.selector-title {
  font-size: 16px;
  font-weight: 600;
  color: #2C3E50;
  margin-bottom: 16px;
  display: block;
}

.selector-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.selector-item {
  padding: 16px;
  background: #F8F8F8;
  border-radius: 12px;
  font-size: 15px;
  color: #2C3E50;
  text-align: center;
  transition: all 0.2s;
}

.selector-item.active {
  background: #FF85A1;
  color: white;
  font-weight: 600;
}

.resume-modal {
  width: 100%;
  background: white;
  border-radius: 24px 24px 0 0;
  padding: 20px;
}

.resume-text {
  font-size: 15px;
  color: #4A4E69;
  margin: 12px 0;
  display: block;
}

.modal-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.modal-btn {
  flex: 1;
  padding: 12px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  border: none;
  background: #F0F0F0;
  color: #2C3E50;
}

.modal-btn.primary {
  background: #FF85A1;
  color: white;
}

.modal-btn.secondary {
  background: #F0F0F0;
  color: #2C3E50;
}
</style>
