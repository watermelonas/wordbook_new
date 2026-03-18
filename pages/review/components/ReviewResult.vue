<template>
  <view class="result-container">
    <view class="finished">
      <view class="finished-icon" :class="wrongCount === 0 ? 'icon-perfect' : 'icon-good'">
        <text class="finished-icon-text">{{ wrongCount === 0 ? '全对' : '加油' }}</text>
      </view>
      <h3>复习完成！</h3>
      <view class="finished-stats">
        <text>正确: {{ correctCount }}</text>
        <text>错误: {{ wrongCount }}</text>
        <text>正确率: {{ Math.round(correctCount / (correctCount + wrongCount || 1) * 100) || 0 }}%</text>
      </view>
      <view v-if="finishedReviewInsight" class="finished-insight-card">
        <text class="finished-insight-title">算法调度结果</text>
        <text>平均掌握度 {{ finishedReviewInsight.avgMastery }}%</text>
        <text>已更新 {{ finishedReviewInsight.scheduledCount }} 个词条</text>
        <text>最近一次建议复习：{{ finishedReviewInsight.nextReviewText }}</text>
      </view>

      <!-- 错误单词列表 -->
      <view v-if="wrongWords.length > 0" class="wrong-words-section">
        <view class="wrong-title">本次错误单词 ({{ wrongWords.length }})</view>
        <scroll-view scroll-y class="wrong-list">
          <view v-for="(item, idx) in wrongWords" :key="idx" class="wrong-item">
            <view class="wrong-word">
              <text class="eng">{{ item.english }}</text>
              <text class="chi">{{ item.correctAnswer ? item.correctAnswer : item.chinese }}</text>
            </view>
            <view v-if="item.yourAnswer && item.yourAnswer !== item.correctAnswer && item.yourAnswer !== item.chinese" class="your-answer">
              你的答案: {{ item.yourAnswer }}
            </view>
            <view v-if="item.synonyms && item.synonyms.length > 0" class="wrong-synonyms">
              <text v-for="(syn, sidx) in item.synonyms.slice(0, 3)" :key="sidx" class="syn-tag">
                {{ syn.synonym }} ({{ syn.chinese }})
              </text>
            </view>
          </view>
        </scroll-view>
      </view>

      <view class="finished-buttons">
        <button v-if="wrongWords.length > 0" @click="$emit('review-wrong-words')" class="btn-secondary">错词再练</button>
        <button @click="$emit('restart-review')" class="btn-primary">再来一轮</button>
        <button @click="$emit('go-back')" class="btn-secondary">返回</button>
      </view>
    </view>
  </view>
</template>

<script setup>
defineProps({
  correctCount: Number,
  wrongCount: Number,
  wrongWords: Array,
  finishedReviewInsight: Object,
});

defineEmits([
  'review-wrong-words',
  'restart-review',
  'go-back',
]);
</script>

<style scoped>
.result-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 20px 16px;
  box-sizing: border-box;
}

.finished {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.finished-icon {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  font-weight: 700;
  margin-top: 40px;
}

.finished-icon.icon-perfect {
  background: linear-gradient(135deg, #4CAF50, #45a049);
  color: white;
}

.finished-icon.icon-good {
  background: linear-gradient(135deg, #FF9800, #F57C00);
  color: white;
}

.finished-icon-text {
  color: white;
  font-size: 48px;
  font-weight: 700;
}

h3 {
  font-size: 24px;
  font-weight: 700;
  color: #2C3E50;
  margin: 0;
}

.finished-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-align: center;
}

.finished-stats text {
  font-size: 15px;
  color: #4A4E69;
}

.finished-insight-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.finished-insight-title {
  font-size: 14px;
  font-weight: 600;
  color: #2C3E50;
}

.finished-insight-card text {
  font-size: 13px;
  color: #4A4E69;
}

.wrong-words-section {
  width: 100%;
  max-width: 400px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.wrong-title {
  font-size: 14px;
  font-weight: 600;
  color: #2C3E50;
}

.wrong-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.wrong-item {
  background: white;
  border-radius: 12px;
  padding: 12px;
  border-left: 4px solid #FF6B6B;
}

.wrong-word {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.eng {
  font-size: 14px;
  font-weight: 600;
  color: #2C3E50;
}

.chi {
  font-size: 14px;
  color: #4A4E69;
}

.your-answer {
  font-size: 12px;
  color: #FF6B6B;
  margin-bottom: 8px;
}

.wrong-synonyms {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.syn-tag {
  font-size: 12px;
  color: #8D8790;
}

.finished-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  max-width: 400px;
}

.btn-primary {
  padding: 14px;
  background: #FF85A1;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
}

.btn-secondary {
  padding: 14px;
  background: #F0F0F0;
  color: #2C3E50;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
}

.btn-primary:active,
.btn-secondary:active {
  opacity: 0.9;
  transform: scale(0.98);
}
</style>
