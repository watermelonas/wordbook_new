<template>
  <view class="session-container">
    <!-- 复习统计栏 -->
    <view class="stats-bar">
      <view class="stats-back-btn" @click="$emit('back')">‹</view>
      <view class="stats-info">
        <text>{{ currentIndex + 1 }}/{{ reviewWords.length }}</text>
        <text>正确 {{ correctCount }}</text>
        <text>错误 {{ wrongCount }}</text>
      </view>
      <view class="stats-action-btn" @click="$emit('show-mastered-confirm')">斩</view>
    </view>

    <!-- 掌握度提示 -->
    <view v-if="currentReviewInsight" class="review-insight-strip">
      <view class="insight-chip">
        <text class="insight-label">掌握度</text>
        <text class="insight-value">{{ currentReviewInsight.mastery }}%</text>
      </view>
      <view class="insight-chip">
        <text class="insight-label">下次复习</text>
        <text class="insight-value">{{ currentReviewInsight.nextReviewText }}</text>
      </view>
    </view>

    <!-- 复习内容区域 -->
    <view v-if="currentWord" class="content">
      <!-- 看英文选中文模式 -->
      <view v-if="settings.mode === 'choice'" class="choice-mode">
        <view v-if="currentWord.__isOldReview" class="review-word-flag">复习巩固</view>
        <view class="word-display">
          <view class="word-english">{{ currentWord.english }}</view>
          <view v-if="currentWord.phonetic" class="word-phonetic">/{{ currentWord.phonetic }}/</view>
        </view>

        <view class="options-grid">
          <view
            v-for="(option, idx) in currentOptions"
            :key="idx"
            class="option-card"
            :class="{
              'correct': showResult && currentWord.defs && currentWord.defs.length > 0 && option.chinese === currentWord.defs[0].trans,
              'wrong': showResult && selectedOption && option.chinese === selectedOption.chinese && !(currentWord.defs && currentWord.defs.length > 0 && option.chinese === currentWord.defs[0].trans)
            }"
            @click="!showResult && $emit('handle-choice', option)"
          >
            <view class="option-content">
              <text class="option-pos" v-if="option.pos">{{ option.pos }}</text>
              <text class="option-text">{{ option.chinese }}</text>
            </view>
          </view>
        </view>

        <view v-if="showResult" class="action-buttons">
          <view class="action-btn" @click="$emit('go-to-detail')">详情</view>
          <view class="action-btn" @click="$emit('next-question')">{{ isLastQuestion ? '查看结果' : '下一题 →' }}</view>
        </view>
      </view>

      <!-- 看中文选英文模式 -->
      <view v-else-if="settings.mode === 'choice_en'" class="choice-mode">
        <view v-if="currentWord.__isOldReview" class="review-word-flag">复习巩固</view>
        <view class="word-chinese-prompt">{{ currentWord.chinese }}</view>

        <view class="options-grid">
          <view
            v-for="(option, idx) in currentOptions"
            :key="idx"
            class="option-card"
            :class="{
              'correct': showResult && (option || '').trim().toLowerCase() === (currentWord.english || '').trim().toLowerCase(),
              'wrong': showResult && option === selectedOption && (option || '').trim().toLowerCase() !== (currentWord.english || '').trim().toLowerCase()
            }"
            @click="!showResult && $emit('handle-choice-en', option)"
          >
            <text class="option-text">{{ option }}</text>
          </view>
        </view>

        <view v-if="showResult" class="action-buttons">
          <view class="action-btn" @click="$emit('go-to-detail')">详情</view>
          <view class="action-btn" @click="$emit('next-question')">{{ isLastQuestion ? '查看结果' : '下一题 →' }}</view>
        </view>
      </view>

      <!-- 其他模式的占位符 -->
      <view v-else class="placeholder-mode">
        <text>{{ settings.mode }} 模式</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  currentIndex: Number,
  reviewWords: Array,
  correctCount: Number,
  wrongCount: Number,
  currentWord: Object,
  currentOptions: Array,
  selectedOption: Object,
  showResult: Boolean,
  settings: Object,
  currentReviewInsight: Object,
});

const emit = defineEmits([
  'back',
  'show-mastered-confirm',
  'handle-choice',
  'handle-choice-en',
  'go-to-detail',
  'next-question',
]);

const isLastQuestion = computed(() => {
  return props.currentIndex >= props.reviewWords.length - 1;
});
</script>

<style scoped>
.session-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
}

.stats-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  padding-top: max(12px, env(safe-area-inset-top));
  background-color: white;
  border-bottom: 1px solid #F0F0F0;
  box-sizing: border-box;
  z-index: 999;
}

.stats-back-btn {
  font-size: 28px;
  color: #FF85A1;
  font-weight: 300;
  line-height: 1;
  padding: 4px 8px;
  min-width: 40px;
}

.stats-info {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
}

.stats-info text {
  font-size: 12px;
  color: #666;
}

.stats-action-btn {
  font-size: 14px;
  font-weight: 600;
  color: white;
  padding: 8px 16px;
  background: #FF85A1;
  border-radius: 12px;
  min-width: 50px;
  text-align: center;
}

.review-insight-strip {
  display: flex;
  gap: 10px;
  padding: 10px 16px 0;
  position: fixed;
  top: 60px;
  left: 0;
  right: 0;
  z-index: 998;
}

.insight-chip {
  flex: 1;
  background: #FFFFFF;
  border: 1px solid #F3DCE5;
  border-radius: 14px;
  padding: 10px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  box-shadow: 0 2px 8px rgba(244, 143, 177, 0.08);
}

.insight-label {
  font-size: 12px;
  color: #8D8790;
}

.insight-value {
  font-size: 14px;
  font-weight: 700;
  color: #B85C6F;
}

.content {
  flex: 1;
  padding: 12px 16px 20px;
  padding-top: max(12px, calc(env(safe-area-inset-top) + 60px));
  box-sizing: border-box;
}

.choice-mode, .choice-mode {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  justify-content: space-between;
}

.review-word-flag {
  align-self: center;
  margin-bottom: 14px;
  padding: 6px 14px;
  border-radius: 999px;
  background: #FFF0F4;
  color: #C05F7E;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 1px;
}

.word-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 20px;
  margin-bottom: 20px;
  flex-shrink: 1;
  min-height: 0;
}

.word-english {
  font-size: 48px;
  font-weight: 700;
  color: #FF85A1;
  text-align: center;
  margin-bottom: 12px;
  line-height: 1.2;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.word-phonetic {
  font-size: 18px;
  color: #95A5A6;
  text-align: center;
  font-style: italic;
}

.word-chinese-prompt {
  font-size: 32px;
  font-weight: 700;
  color: #2C3E50;
  text-align: center;
  margin-top: 20px;
  margin-bottom: 20px;
  line-height: 1.2;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  word-break: break-word;
}

.options-grid {
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 12px;
  padding: 0 16px;
  box-sizing: border-box;
  flex-shrink: 0;
}

.option-card {
  width: 100%;
  min-height: 70px;
  padding: 16px 20px;
  background: white;
  border: 2px solid #E8E8E8;
  border-radius: 16px;
  font-size: 16px;
  color: #2C3E50;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  box-sizing: border-box;
  cursor: pointer;
}

.option-card:active {
  transform: scale(0.98);
}

.option-card.correct {
  background: #2196F3 !important;
  color: white !important;
  border: 2px solid #2196F3 !important;
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3) !important;
}

.option-card.wrong {
  background: #FF6B6B;
  color: white;
  border: 2px solid #FF6B6B;
}

.option-content {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.option-pos {
  font-size: 13px;
  color: #E74C3C;
  font-weight: 600;
  flex-shrink: 0;
}

.option-text {
  flex: 1;
  word-break: break-word;
}

.action-buttons {
  display: flex;
  gap: 12px;
  margin-top: 20px;
  width: 100%;
  max-width: 400px;
  padding: 0 16px 16px 16px;
  box-sizing: border-box;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
}

.action-btn {
  flex: 1;
  height: 56px;
  background: #FF85A1;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(255, 133, 161, 0.3);
  transition: all 0.2s;
  box-sizing: border-box;
  padding: 0;
  margin: 0;
  line-height: 56px;
}

.action-btn:active {
  transform: scale(0.98);
  opacity: 0.9;
}

.placeholder-mode {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  font-size: 16px;
  color: #A1A1AA;
}
</style>
