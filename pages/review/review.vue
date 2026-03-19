<template>
  <view class="container">
    <!-- 复习中不显示导航栏 -->
    <view v-if="!reviewStarted" class="custom-nav-bar">
      <view class="nav-back-btn" @click="goBack">‹</view>
      <text class="nav-title">{{ currentWordbookName }}</text>
      <view class="nav-settings-btn" @click="showSettings = true">⚙</view>
    </view>

    <!-- 初始状态：未开始复习（优化版） -->
    <view v-if="!reviewStarted" class="start-review-fixed">
      
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
      <view class="card stat-card-large stat-card-book">
        <view class="stat-header-row">
          <text class="stat-left-text">已学 {{ learnedUniqueWords }} / {{ bookTotalWords }} 词</text>
        </view>
        <view class="stat-bar">
          <view class="stat-bar-fill" :style="{ width: currentProgressPercent + '%' }"></view>
        </view>
        <view class="stat-detail-row">剩余 {{ remainingNewWords }} 词 · 预计 {{ remainDays }} 天完成</view>
      </view>

      <!-- 推荐复习 -->
      <view class="section-label">推荐复习</view>
      <view class="card recommend-card" @click="startRecommendedReview">
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
          @click="startPresetReview(preset.key)"
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
                @click="onModeChange({ detail: { value: idx } }); showModeSelector = false"
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
                @click="onSortChange({ detail: { value: idx } }); showSortSelector = false"
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
    <view v-if="showResumeModal" class="modal-overlay" @click.self="discardReview">
      <view class="resume-modal" @click.stop>
        <text class="modal-title">发现未完成的复习</text>
        <text class="resume-text">是否继续上次的复习？</text>
        <view class="modal-actions">
          <button class="modal-btn secondary" @click="discardReview">放弃</button>
          <button class="modal-btn primary" @click="resumeReview">继续</button>
        </view>
      </view>
    </view>

    <!-- 斩掉确认弹窗 -->
    <view v-if="showMasteredConfirm" class="modal-overlay" @click="showMasteredConfirm = false">
      <view class="resume-modal" @click.stop>
        <text class="modal-title">斩掉这个单词？</text>
        <text class="resume-text">{{ currentWord.english }} - {{ currentWord.chinese }}</text>
        <text class="resume-text" style="font-size: 13px; color: #A1A1AA;">斩掉后该单词将在复习中隐藏</text>
        <view class="modal-actions">
          <button class="modal-btn secondary" @click="showMasteredConfirm = false">取消</button>
          <button class="modal-btn primary" @click="markCurrentWordAsMastered">确认斩掉</button>
        </view>
      </view>
    </view>

    <!-- 斩掉确认弹窗 -->
    <view v-if="showMasteredConfirm" class="modal-overlay" @click="showMasteredConfirm = false">
      <view class="resume-modal" @click.stop>
        <text class="modal-title">斩掉这个单词？</text>
        <text class="resume-text">{{ currentWord.english }} - {{ currentWord.chinese }}</text>
        <text class="resume-text" style="font-size: 13px; color: #A1A1AA;">斩掉后该单词将在复习中隐藏</text>
        <view class="modal-actions">
          <button class="modal-btn secondary" @click="showMasteredConfirm = false">取消</button>
          <button class="modal-btn primary" @click="markCurrentWordAsMastered">确认斩掉</button>
        </view>
      </view>
    </view>

    <!-- 复习统计 -->
    <view v-if="reviewStarted && !reviewFinished" class="stats-bar">
      <view class="stats-back-btn" @click="backToStartScreen">‹</view>
      <view class="stats-info">
        <text>{{ currentIndex + 1 }}/{{ reviewWords.length }}</text>
        <text>正确 {{ correctCount }}</text>
        <text>错误 {{ wrongCount }}</text>
      </view>
      <view class="stats-action-btn" @click="showMasteredConfirm = true">斩</view>
    </view>
    <view v-if="reviewStarted && !reviewFinished && currentReviewInsight" class="review-insight-strip">
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
    <view v-if="reviewStarted && currentWord && !reviewFinished" class="content">
      
      <!-- 模式A: 看英文选中文 -->
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
            @click="!showResult && handleChoice(option)"
          >
            <view class="option-content">
              <text class="option-pos" v-if="option.pos">{{ option.pos }}</text>
              <text class="option-text">{{ option.chinese }}</text>
            </view>
          </view>
        </view>

        <view v-if="showResult" class="action-buttons">
          <view class="action-btn" @click="goToWordDetail">详情</view>
          <view class="action-btn" @click="nextQuestion">{{ isLastQuestion ? '查看结果' : '下一题 →' }}</view>
        </view>
      </view>

      <!-- 模式A': 看中文选英文（干扰项为词库中形式相近的单词，不调 AI） -->
      <view v-if="settings.mode === 'choice_en'" class="choice-mode">
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
            @click="!showResult && handleChoiceEn(option)"
          >
            <text class="option-text">{{ option }}</text>
          </view>
        </view>

        <view v-if="showResult" class="action-buttons">
          <view class="action-btn" @click="goToWordDetail">详情</view>
          <view class="action-btn" @click="nextQuestion">{{ isLastQuestion ? '查看结果' : '下一题 →' }}</view>
        </view>
      </view>

      <!-- 模式B: AI例句填空 -->
      <view v-if="settings.mode === 'fill'" class="fill-mode">
        <view v-if="currentWord.__isOldReview" class="review-word-flag">复习巩固</view>
        <view class="fill-sentence">
          <rich-text :nodes="formatHighlight(currentSentence)"></rich-text>
        </view>

        <view class="options-grid">
          <view 
            v-for="(option, idx) in fillOptions" 
            :key="idx"
            class="option-card"
            :class="{
              'correct': showResult && option === fillAnswer,
              'wrong': showResult && option === selectedOption && option !== fillAnswer
            }"
            @click="!showResult && handleFillChoice(option)"
          >
            <text class="option-text">{{ option }}</text>
          </view>
        </view>

        <view v-if="showResult && currentFillSentenceChinese" class="fill-result">
          <view class="sentence-chinese">句子释义：<rich-text :nodes="formatHighlight(currentFillSentenceChinese)"></rich-text></view>
        </view>

        <view v-if="showResult" class="action-buttons">
          <view class="action-btn" @click="goToWordDetail">详情</view>
          <view class="action-btn" @click="nextQuestion">{{ isLastQuestion ? '查看结果' : '下一题 →' }}</view>
        </view>
      </view>

      <!-- 模式: 拼写填空（看中文输入英文） -->
      <view v-if="settings.mode === 'spell'" class="spell-mode">
        <view v-if="currentWord.__isOldReview" class="review-word-flag">复习巩固</view>
        <view class="spell-prompt">根据中文释义写出英文单词</view>
        <view class="spell-chinese">{{ currentWord.chinese }}</view>
        <view class="input-area">
          <input
            type="text"
            v-model="spellInput"
            class="spell-input"
            placeholder="输入英文单词"
            :disabled="showResult"
            @confirm="handleSpellSubmit"
          />
        </view>
        <button v-if="!showResult" @click="handleSpellSubmit" class="btn-next" :disabled="!(spellInput || '').trim()">
          提交
        </button>
        <view v-if="showResult" class="action-buttons">
          <view class="action-btn" @click="goToWordDetail">详情</view>
          <view class="action-btn" @click="nextQuestion">{{ isLastQuestion ? '查看结果' : '下一题 →' }}</view>
        </view>
      </view>

      <!-- 模式C: AI语境复习 -->
      <view v-if="settings.mode === 'ai'" class="ai-mode">
        <view v-if="currentWord.__isOldReview" class="review-word-flag">复习巩固</view>
        <view class="ai-word">{{ currentWord.english }}</view>
        
        <!-- 情境卡片：AI生成的英文例句 -->
        <view class="context-card">
          <view class="context-sentence">
            <rich-text :nodes="formatAIPhighlight(aiSentence)"></rich-text>
          </view>
          <view v-if="isGenerating" class="generating-indicator">
            <text>AI 生成例句中...</text>
          </view>
        </view>
        
        <!-- 用户输入区 -->
        <view class="input-area">
          <input 
            type="text" 
            v-model="userTranslation" 
            class="translation-input"
            :placeholder="isGenerating ? '等待例句生成...' : '输入该单词在此句中的意思...'"
            :disabled="isGenerating || showResult"
            @confirm="submitAnswer"
          />
        </view>
        
        <!-- 结果反馈卡片 -->
        <view v-if="showResult" class="result-card" :class="aiResult?.is_correct ? 'result-correct' : 'result-wrong'">
          <view class="result-header">
            <text class="result-tag">{{ aiResult?.is_correct ? '✅ 回答正确' : '❌ 需要纠正' }}</text>
          </view>
          <view v-if="aiResult?.sentence_chinese" class="sentence-chinese">原句翻译：{{ aiResult.sentence_chinese }}</view>
          <view class="result-explanation">
            <text>{{ aiResult?.explanation }}</text>
          </view>
        </view>
        
        <!-- 提交/继续按钮 -->
        <button 
          @click="showResult ? nextQuestion() : submitAnswer()" 
          class="btn-submit"
          :disabled="isSubmitting || isGenerating"
        >
          {{ isSubmitting ? 'AI 判卷中...' : (showResult ? (isLastQuestion ? '查看结果' : '下一题') : '提交答案') }}
        </button>
      </view>

    </view>

    <!-- 复习完成 -->
    <view v-else-if="reviewStarted && reviewFinished" class="finished">
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
        <button v-if="wrongWords.length > 0" @click="reviewPreset = 'wrong'; restartReview()" class="btn-secondary">错词再练</button>
        <button @click="restartReview" class="btn-primary">再来一轮</button>
        <button @click="goBack" class="btn-secondary">返回</button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { onBackPress, onShow, onHide, onUnload, onLoad } from '@dcloudio/uni-app';
import db from '../../src/utils/db_v2';
import aiService from '../../src/utils/aiService';
import * as masterDb from '../../src/utils/masterDb.js';
import { getCurrentWordbook, getWordbookListForUI, isSelfWordbook, isLocalWordbookKey, loadLocalWordbook, getWordbookWords } from '../../src/utils/wordbookSource.js';
import {
  recordReviewOutcome,
  getLearningDashboard,
  getMistakeWords,
  getDueProfilesForWords,
  getLatestSession,
  logStudySession,
} from '../../src/utils/learningCenter.js';
import { logger, errorHandler } from '../../src/utils/errorHandler.js';
import { cleanupExpiredCaches } from '../../src/utils/learningCenter_v2.js';
import { getMasteredWordbookWords, addMasteredWordbookWord } from '../../src/utils/masteredWordbookWords.js';
import {
  getWordKey,
  uniqueWordKeys,
  getTodayKey,
  normalizePlanEntry,
  filterWordsByKeys,
  shuffleList,
  getReviewProgressKey,
  REVIEW_PLAN_KEY,
  loadPlanStore,
  savePlanStore,
  getPlanEntry,
  savePlanEntry,
  interleaveOldWords,
  getOldReviewQuota,
} from '../../src/utils/reviewUtils.js';

const showSettings = ref(false);
const showModeSelector = ref(false);
const showSortSelector = ref(false);
const showCountSelector = ref(false);
const showDifficultySelector = ref(false);
const reviewStarted = ref(false);
const reviewFinished = ref(false);

const settings = ref({
  mode: 'choice',
  sortBy: 'smart',
  count: 20
});

const reviewWords = ref([]);
const currentIndex = ref(0);
const currentWord = ref(null);
const currentOptions = ref([]);
const fillOptions = ref([]);
const currentFillSentenceChinese = ref('');
const spellInput = ref('');

const escapeRegExp = (s) => String(s || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// 格式化高亮文本
const formatHighlight = (text) => {
  if (!text) return '';
  
  // 处理 Markdown 加粗语法 **单词**
  let formattedText = text.replace(/\*\*(.*?)\*\*/g, function(match, word) {
    return `<span style="color: #FF85A1; font-weight: bold;">${word}</span>`;
  });
  
  // 高亮目标单词
  if (currentWord.value && currentWord.value.english) {
    const targetWord = currentWord.value.english;
    const targetRegex = new RegExp(`\\b(${escapeRegExp(targetWord)})\\b`, 'gi');
    formattedText = formattedText.replace(targetRegex, `<span style="color: #FF85A1; font-weight: bold;">$1</span>`);
  }
  
  return formattedText;
};
const currentSentence = ref('');
const fillAnswer = ref('');

// AI语境复习相关变量
const aiSentence = ref('');
const userTranslation = ref('');
const aiResult = ref(null);
const isGenerating = ref(false);
const isSubmitting = ref(false);

// 格式化AI例句高亮
const formatAIPhighlight = (text) => {
  if (!text) return '';
  
  let formattedText = text;
  
  // 高亮目标单词 - 使用粉色背景和文字
  if (currentWord.value && currentWord.value.english) {
    const targetWord = currentWord.value.english;
    const targetRegex = new RegExp(`\\b(${escapeRegExp(targetWord)})\\b`, 'gi');
    formattedText = formattedText.replace(targetRegex, `<span style="color: #FF85A1; font-weight: bold; background-color: #FFF0F3; padding: 2px 4px; border-radius: 4px;">$1</span>`);
  }
  
  return formattedText;
};

const selectedOption = ref('');
const showResult = ref(false);
const showWrongFeedback = ref(false);

const correctCount = ref(0);
const wrongCount = ref(0);
const wrongWords = ref([]);
const lastReviewResult = ref(null);
const showResumeModal = ref(false);
const hasProgress = ref(false);
const activeSettingCard = ref('mode');
const dashboardDone = ref(0);
const dashboardTotal = ref(0);
const bookTotalWords = ref(0);
const totalReviewedWords = ref(0);
const todayReviewed = ref(0);
const learnedUniqueWords = ref(0);
const dashboardSnapshot = ref({ dueCount: 0, overdueCount: 0, mistakeCount: 0, firstDayDue: 0 });
const showMasteredConfirm = ref(false);
const reviewPreset = ref('due');
const sessionNewCount = ref(0);
const sessionOldCount = ref(0);
const recommendedReviewStage = ref('new'); // 'new' | 'wrong' | 'old' - 推荐复习的当前阶段
const recommendedReviewState = ref({
  newWords: [],
  wrongWords: [],
  oldWords: [],
  currentStage: 'new',
  newCompleted: false,
  wrongCompleted: false,
  oldCompleted: false,
});

const getSettingsKey = () => `reviewSettings_${getCurrentBookId()}`;
const getLastReviewResultKey = () => `lastReviewResult_${getCurrentBookId()}`;

const getCurrentBookId = () => getCurrentWordbook() || 'self';

// 依赖于组件状态的函数
const saveReviewProgress = () => {
  if (!reviewStarted.value || reviewFinished.value || reviewWords.value.length === 0) return;
  uni.setStorageSync(getReviewProgressKey(), {
    reviewWords: reviewWords.value,
    currentIndex: currentIndex.value,
    correctCount: correctCount.value,
    wrongCount: wrongCount.value,
    wrongWords: [...wrongWords.value],
    settings: { ...settings.value },
    reviewPreset: reviewPreset.value,
    sessionNewCount: sessionNewCount.value,
    sessionOldCount: sessionOldCount.value,
    recommendedReviewState: { ...recommendedReviewState.value },
  });
  hasProgress.value = true;
};

const clearReviewProgress = () => {
  uni.removeStorageSync(getReviewProgressKey());
  hasProgress.value = false;
};

const loadReviewProgress = () => {
  try {
    const saved = uni.getStorageSync(getReviewProgressKey());
    return saved && saved.reviewWords && saved.reviewWords.length > 0 ? saved : null;
  } catch (e) {
    return null;
  }
};

const resumeReview = () => {
  const saved = loadReviewProgress();
  if (!saved) return;
  reviewWords.value = saved.reviewWords;
  currentIndex.value = saved.currentIndex;
  correctCount.value = saved.correctCount;
  wrongCount.value = saved.wrongCount;
  wrongWords.value = saved.wrongWords || [];
  settings.value = saved.settings || settings.value;
  reviewPreset.value = saved.reviewPreset || 'due';
  sessionNewCount.value = Number(saved.sessionNewCount || 0);
  sessionOldCount.value = Number(saved.sessionOldCount || 0);
  if (saved.recommendedReviewState) {
    recommendedReviewState.value = saved.recommendedReviewState;
  }
  reviewStarted.value = true;
  reviewFinished.value = false;
  showResumeModal.value = false;
  syncDashboardProgress();
  loadCurrentQuestion();
};

const discardReview = () => {
  clearReviewProgress();
  showResumeModal.value = false;
  syncDashboardProgress();
};

const checkProgress = () => {
  hasProgress.value = !!loadReviewProgress();
  syncDashboardProgress();
};

const getCurrentBookTotalWords = async () => {
  const book = getCurrentBookId();
  try {
    if (book === 'self') {
      const all = await db.getAllWords();
      return Array.isArray(all) ? all.length : 0;
    }
    if (isLocalWordbookKey(book)) {
      const list = await loadLocalWordbook(book);
      return Array.isArray(list) ? list.length : 0;
    }
    const list = getWordbookWords(book) || [];
    return Array.isArray(list) ? list.length : 0;
  } catch (_) {
    return 0;
  }
};

const getCurrentBookWordPool = async () => {
  const book = getCurrentBookId();
  if (book === 'self') {
    return await db.getAllWords();
  }
  if (isLocalWordbookKey(book)) {
    const list = await loadLocalWordbook(book);
    const dictLookup = await masterDb.getWordBriefBatch(list.map((w) => w.english));
    return list.map((w) => {
      const v = dictLookup[(w.english || '').trim().toLowerCase()];
      const chinese = (v && typeof v === 'object' && v.chinese != null) ? String(v.chinese).trim() : (typeof v === 'string' ? v : '').trim();
      return {
        id: null,
        english: w.english,
        chinese,
        importance: w.importance,
        examples: [],
        synonyms: [],
        antonyms: [],
      };
    });
  }
  return getWordbookWords(book) || [];
};

const refreshDashboardSnapshot = async () => {
  try {
    const pool = await getCurrentBookWordPool();
    dashboardSnapshot.value = getLearningDashboard(pool, getCurrentBookId());
  } catch (_) {
    dashboardSnapshot.value = { dueCount: 0, overdueCount: 0, mistakeCount: 0, firstDayDue: 0 };
  }
};

const refreshPlanStats = async () => {
  bookTotalWords.value = await getCurrentBookTotalWords();
  const bookId = getCurrentBookId();
  const plan = getPlanEntry(bookId);
  totalReviewedWords.value = Number(plan.completed || 0);
  learnedUniqueWords.value = plan.learnedKeys.length;
  todayReviewed.value = plan.todayKey === getTodayKey() ? plan.todayKeys.length : 0;

  // 分离 dashboard 快照加载，避免阻塞主线程
  // 这个操作会加载所有单词并处理，比较耗时
  refreshDashboardSnapshot().catch(() => {
    dashboardSnapshot.value = { dueCount: 0, overdueCount: 0, mistakeCount: 0, firstDayDue: 0 };
  });
};

const resetCurrentPlan = () => {
  savePlanEntry(getCurrentBookId(), {
    completed: 0,
    learnedKeys: [],
    roundReviewedKeys: [],
    todayKey: getTodayKey(),
    todayKeys: [],
    updatedAt: Date.now(),
  });
  totalReviewedWords.value = 0;
  learnedUniqueWords.value = 0;
  todayReviewed.value = 0;
};

const markWordsReviewed = (words) => {
  const list = Array.isArray(words) ? words : [words];
  if (!list.length) return;
  const bookId = getCurrentBookId();
  const total = Math.max(0, Number(bookTotalWords.value || 0));
  const todayKey = getTodayKey();
  const old = getPlanEntry(bookId);
  const learnedSet = new Set(old.learnedKeys);
  const roundSet = new Set(old.roundReviewedKeys);
  const todaySet = new Set(old.todayKey === todayKey ? old.todayKeys : []);
  let completed = Number(old.completed || 0);
  let newWordsCount = 0;
  let oldWordsCount = 0;

  for (const item of list) {
    const key = getWordKey(item);
    if (!key) continue;
    const isNew = !learnedSet.has(key);
    if (isNew) newWordsCount++;
    else oldWordsCount++;
    learnedSet.add(key);
    todaySet.add(key);
    if (total > 0 && roundSet.size >= total) {
      roundSet.clear();
    }
    if (!roundSet.has(key)) {
      roundSet.add(key);
      completed += 1;
    }
  }

  const next = savePlanEntry(bookId, {
    ...old,
    completed,
    learnedKeys: [...learnedSet],
    roundReviewedKeys: [...roundSet],
    todayKey,
    todayKeys: [...todaySet],
    updatedAt: Date.now(),
  });
  totalReviewedWords.value = next.completed;
  learnedUniqueWords.value = next.learnedKeys.length;
  todayReviewed.value = next.todayKeys.length;
  sessionNewCount.value += newWordsCount;
  sessionOldCount.value += oldWordsCount;
};



const syncDashboardProgress = () => {
  const saved = loadReviewProgress();
  if (saved && Array.isArray(saved.reviewWords) && saved.reviewWords.length > 0) {
    dashboardDone.value = Math.min(Number(saved.currentIndex || 0), saved.reviewWords.length);
    dashboardTotal.value = saved.reviewWords.length;
  } else {
    dashboardDone.value = 0;
    dashboardTotal.value = settings.value.count;
  }
};

const dashboardTarget = computed(() => {
  if (settings.value.difficulty === 'hard') {
    return Math.max(settings.value.count, Math.ceil(settings.value.count * 1.2));
  }
  return settings.value.count;
});

const dashboardPercent = computed(() => {
  const total = Number(dashboardTotal.value || 0);
  if (!total) return 0;
  const pct = Math.round((Number(dashboardDone.value || 0) / total) * 100);
  return Math.max(0, Math.min(100, pct));
});

const formatRelativeReviewTime = (isoString) => {
  if (!isoString) return '待计算';
  const now = new Date();
  const target = new Date(isoString);
  if (Number.isNaN(target.getTime())) return '待计算';
  const diffMs = target - now;
  const absMinutes = Math.round(Math.abs(diffMs) / (1000 * 60));
  if (absMinutes < 60) return diffMs >= 0 ? `${Math.max(1, absMinutes)} 分钟后` : `${Math.max(1, absMinutes)} 分钟前`;
  const absHours = Math.round(absMinutes / 60);
  if (absHours < 24) return diffMs >= 0 ? `${absHours} 小时后` : `${absHours} 小时前`;
  const absDays = Math.round(absHours / 24);
  return diffMs >= 0 ? `${absDays} 天后` : `${absDays} 天前`;
};

const currentReviewInsight = computed(() => {
  if (!isSelfWordbook() || !currentWord.value?.id) return null;
  const insight = db.getReviewInsight(currentWord.value);
  if (!insight) return null;
  return {
    ...insight,
    nextReviewText: formatRelativeReviewTime(insight.next_review_time),
  };
});

const applyReviewPreview = (isCorrect) => {
  if (!currentWord.value?.id) return;
  const preview = db.previewReviewState(currentWord.value, isCorrect);
  if (!preview) return;
  currentWord.value = { ...currentWord.value, ...preview };
  const idx = Number(currentIndex.value || 0);
  if (Array.isArray(reviewWords.value) && reviewWords.value[idx]) {
    reviewWords.value[idx] = { ...reviewWords.value[idx], ...preview };
  }
};

const finishedReviewInsight = computed(() => {
  if (!isSelfWordbook()) return null;
  const list = (reviewWords.value || [])
    .map((word) => db.getReviewInsight(word))
    .filter(Boolean);
  if (!list.length) return null;
  const avgMastery = Math.round(list.reduce((sum, item) => sum + (item.mastery || 0), 0) / list.length);
  const nextTimes = list.map((item) => item.next_review_time).filter(Boolean).sort();
  return {
    avgMastery,
    scheduledCount: list.length,
    nextReviewText: nextTimes.length ? formatRelativeReviewTime(nextTimes[0]) : '待计算',
  };
});

const completedInRound = computed(() => {
  const total = Number(bookTotalWords.value || 0);
  if (total <= 0) return 0;
  return Number(totalReviewedWords.value || 0) % total;
});

const currentRound = computed(() => {
  const total = Number(bookTotalWords.value || 0);
  if (total <= 0) return 1;
  return Math.floor(Number(totalReviewedWords.value || 0) / total) + 1;
});

const currentProgressPercent = computed(() => {
  const total = Number(bookTotalWords.value || 0);
  if (total <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((Math.min(learnedUniqueWords.value, total) / total) * 100)));
});

const oldReviewDailyTarget = computed(() => {
  if (!learnedUniqueWords.value) return 0;
  return Math.min(learnedUniqueWords.value, Math.max(3, Math.round(Number(settings.value.count || 0) * 0.25)));
});

const dailyNewTarget = computed(() => {
  return Math.max(1, Number(settings.value.count || 0) - Number(oldReviewDailyTarget.value || 0));
});

const remainDays = computed(() => {
  const total = Number(bookTotalWords.value || 0);
  if (total <= 0) return 0;
  const remainingWords = Math.max(total - learnedUniqueWords.value, 0);
  if (remainingWords <= 0) return 0;
  return Math.max(1, Math.ceil(remainingWords / dailyNewTarget.value));
});

const remainingNewWords = computed(() => {
  const total = Number(bookTotalWords.value || 0);
  if (total <= 0) return 0;
  return Math.max(total - learnedUniqueWords.value, 0);
});

const estimatedFinishDate = computed(() => {
  if (!bookTotalWords.value) return '—';
  if (remainDays.value <= 0) return '今日';
  const days = Math.max(remainDays.value, 1);
  const d = new Date();
  d.setDate(d.getDate() + days - 1);
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${m}/${day}`;
});

const dailyPlanText = computed(() => {
  if (oldReviewDailyTarget.value > 0) {
    if (remainDays.value <= 0) {
      return `新词已学完，当前每日复习 ${oldReviewDailyTarget.value} 词巩固记忆`;
    }
    return `每日新学 ${dailyNewTarget.value} 词，穿插复习 ${oldReviewDailyTarget.value} 词，剩余 ${remainDays.value} 天，预计完成 ${estimatedFinishDate.value}`;
  }
  return `每日 ${settings.value.count} 词，剩余 ${remainDays.value} 天，预计完成 ${estimatedFinishDate.value}`;
});

const isTodayTargetDone = computed(() => {
  const target = Number(settings.value.count || 0);
  return target > 0 && todayReviewed.value >= target;
});

const primaryStartText = computed(() => {
  if (reviewPreset.value === 'due') return '开始到期复习';
  if (reviewPreset.value === 'new') return '开始新词学习';
  if (reviewPreset.value === 'wrong') return '开始错词再练';
  if (reviewPreset.value === 'old') return '开始旧词复习';
  return isTodayTargetDone.value ? '再来一组20' : '开始复习';
});

// 新增：今日进度百分比
const todayProgressPercent = computed(() => {
  const target = Number(settings.value.count || 0);
  if (target === 0) return 0;
  // 如果正在复习，使用当前复习的进度；否则使用已保存的今日进度
  const current = reviewStarted.value ? currentIndex.value + 1 : todayReviewed.value;
  return Math.min(100, Math.round((current / target) * 100));
});

// 新增：智能推荐的复习预设
const recommendedPreset = computed(() => {
  // 推荐复习流程：新词 > 错词 > 旧词
  const newWordsNeeded = Math.max(0, settings.value.count - todayReviewed.value);
  if (newWordsNeeded > 0) return 'new';
  if (dashboardSnapshot.value.mistakeCount > 0) return 'wrong';
  if (dashboardSnapshot.value.dueCount > 0) return 'old';
  return 'new';
});

const recommendedPresetIcon = computed(() => {
  return '';
});

const recommendedPresetTitle = computed(() => {
  const titles = { new: '今日新词', wrong: '错词本', old: '复习旧词' };
  return titles[recommendedPreset.value] || '今日新词';
});

const recommendedPresetDesc = computed(() => {
  const preset = recommendedPreset.value;
  const newWordsNeeded = Math.max(0, settings.value.count - todayReviewed.value);
  if (preset === 'new') return `还需学习 ${newWordsNeeded} 个新词`;
  if (preset === 'wrong') return `${dashboardSnapshot.value.mistakeCount} 个单词需要巩固`;
  if (preset === 'old') return `${dashboardSnapshot.value.dueCount} 个单词待复习`;
  return '从所有单词中随机抽取';
});

// 新增：其他复习方式列表 - 显示推荐复习之外的两个阶段
const otherPresets = computed(() => {
  const preset = recommendedPreset.value;
  const newWordsNeeded = Math.max(0, settings.value.count - todayReviewed.value);

  const allPresets = {
    new: { key: 'new', icon: '', title: '今日新词', count: newWordsNeeded },
    wrong: { key: 'wrong', icon: '', title: '错词本', count: dashboardSnapshot.value.mistakeCount },
    old: { key: 'old', icon: '', title: '复习旧词', count: dashboardSnapshot.value.dueCount },
  };

  // 返回除了推荐复习之外的两个阶段
  const all = [];
  for (const [key, item] of Object.entries(allPresets)) {
    if (key !== preset) {
      all.push(item);
    }
  }
  return all;
});

const currentWordbookName = computed(() => {
  const current = getCurrentWordbook();
  if (current === 'self') return '自用单词';
  const list = getWordbookListForUI();
  const hit = list.find((item) => item.id === current);
  return hit?.name || current || '当前词书';
});

const openSettings = (key) => {
  activeSettingCard.value = key;
  showSettings.value = true;
};

const sortByText = computed(() => {
  const map = { smart: '智能推荐', error: '难点先行', new: '新词优先' };
  return map[settings.value.sortBy] || '智能推荐';
});

const isLastQuestion = computed(() => {
  return currentIndex.value >= reviewWords.value.length - 1;
});

const modeOptions = ['看英文选中文', '看中文选英文', 'AI例句填空', 'AI语境复习', '拼写填空'];
const sortOptions = ['智能推荐', '难点先行', '新词优先'];
const countOptions = [20, 30, 40, 50, 80, 100, 200, 500, 800, 1000];
const dailyQuickOptions = [20, 50, 100, 200, 500, 800, 1000];

const modeIndex = computed(() => {
  const map = { choice: 0, choice_en: 1, fill: 2, ai: 3, spell: 4 };
  return map[settings.value.mode] ?? 0;
});

const modeDisplayText = computed(() => {
  const map = { choice: '看英文选中文', choice_en: '看中文选英文', fill: 'AI例句填空', ai: 'AI语境复习', spell: '拼写填空' };
  return map[settings.value.mode] || '看英文选中文';
});

const sortIndex = computed(() => {
  const map = { smart: 0, error: 1, new: 2 };
  return map[settings.value.sortBy] || 0;
});
const countIndex = computed(() => countOptions.indexOf(settings.value.count) >= 0 ? countOptions.indexOf(settings.value.count) : 3);

const onModeChange = (e) => {
  const map = ['choice', 'choice_en', 'fill', 'ai', 'spell'];
  settings.value.mode = map[e.detail.value] || 'choice';
  saveSettings();
};

const onSortChange = (e) => {
  const map = ['smart', 'error', 'new'];
  settings.value.sortBy = map[e.detail.value];
  saveSettings();
};

const onCountChange = (e) => {
  settings.value.count = countOptions[e.detail.value];
  saveSettings();
};

const setDailyTarget = (n) => {
  settings.value.count = Number(n);
  saveSettings();
};

const onDifficultyChange = (difficulty) => {
  settings.value.difficulty = difficulty;
  saveSettings();
};

// 打开各个选择器的函数
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

onLoad((options) => {
  reviewPreset.value = (options && options.preset) ? String(options.preset) : 'due';
});

onMounted(() => {
  loadSettings();
  loadLastReviewResult();
  checkProgress();
  syncDashboardProgress();

  // 延迟加载重操作，避免阻塞页面动画
  // 动画时长通常 300ms，这里延迟 350ms 确保动画完成
  setTimeout(() => {
    refreshPlanStats();
  }, 350);

  // 不自动恢复，让用户在选择页面主动开始复习
  // 如果有未完成的进度，会在用户点击"开始复习"时自动恢复
});

onShow(() => {
  loadLastReviewResult();
  checkProgress();

  // 延迟加载重操作
  setTimeout(() => {
    refreshPlanStats();
  }, 350);
});

onHide(() => {
  // 动画结束后再保存进度，避免序列化大对象阻塞返回动画
  if (reviewStarted.value && !reviewFinished.value) {
    setTimeout(() => saveReviewProgress(), 300);
  }
});

onUnload(() => {
  if (reviewStarted.value && !reviewFinished.value) {
    saveReviewProgress();
  }

  // 清理过期缓存
  try {
    cleanupExpiredCaches();
  } catch (error) {
    logger.warn('Review', '清理缓存失败', error);
  }
});

const loadSettings = () => {
  const saved = uni.getStorageSync(getSettingsKey()) || uni.getStorageSync('reviewSettings');
  if (saved) {
    settings.value = saved;
  }
};

const saveSettings = () => {
  uni.setStorageSync(getSettingsKey(), settings.value);
  syncDashboardProgress();
  refreshPlanStats();
};

const loadLastReviewResult = () => {
  const saved = uni.getStorageSync(getLastReviewResultKey()) || getLatestSession(getCurrentBookId());
  if (saved) {
    lastReviewResult.value = saved.accuracy != null ? saved : {
      correctCount: saved.correctCount || 0,
      wrongCount: saved.wrongCount || 0,
      accuracy: Math.round((Number(saved.correctCount || 0) / Math.max(1, Number(saved.reviewedCount || 0))) * 100),
      wrongWords: [],
    };
  }
};

const saveReviewResult = () => {
  const result = {
    correctCount: correctCount.value,
    wrongCount: wrongCount.value,
    accuracy: Math.round(correctCount.value / (correctCount.value + wrongCount.value || 1) * 100) || 0,
    wrongWords: wrongWords.value,
    reviewedCount: correctCount.value + wrongCount.value,
    preset: reviewPreset.value,
    newCount: sessionNewCount.value,
    oldCount: sessionOldCount.value,
  };
  uni.setStorageSync(getLastReviewResultKey(), result);
  lastReviewResult.value = result;
};

const buildPresetQueue = (list, count) => {
  const preset = reviewPreset.value || 'due';
  if (!Array.isArray(list) || !list.length) return [];

  // 今日新词：从未复习过的单词中筛选
  if (preset === 'new') {
    const profiles = list.map((item) => getWordProfile(item)).filter(Boolean);
    const newWords = profiles.filter((item) => !item.seen_count || Number(item.seen_count) === 0);
    return shuffleList(newWords.map((p) => ({ english: p.english, chinese: p.chinese }))).slice(0, count);
  }

  if (preset === 'wrong') {
    const wrongSet = new Set(getMistakeWords(getCurrentBookId(), true).map((item) => getWordKey(item)));
    return shuffleList(filterWordsByKeys(list, wrongSet)).slice(0, count);
  }

  // 复习旧词：按遗忘曲线，每个单词最多出现3次
  if (preset === 'old') {
    const dueProfiles = getDueProfilesForWords(list, getCurrentBookId());
    // 过滤出复习次数少于3次的单词
    const filtered = dueProfiles.filter((item) => {
      const reviewCount = Number(item.review_count || 0);
      return reviewCount < 3;
    });
    const dueSet = new Set(filtered.map((item) => getWordKey(item)));
    return shuffleList(filterWordsByKeys(list, dueSet)).slice(0, count);
  }

  if (preset === 'due') {
    const dueProfiles = getDueProfilesForWords(list, getCurrentBookId());
    const dueSet = new Set(dueProfiles.map((item) => getWordKey(item)));
    return shuffleList(filterWordsByKeys(list, dueSet)).slice(0, count);
  }

  return [];
};

// 构建词书复习队列（过滤已斯单词）
const buildBookReviewQueue = async (list, count) => {
  if (!Array.isArray(list) || !list.length) return [];
  
  const bookId = getCurrentBookId();
  let filteredList = list;
  
  // 如果是词书单词，过滤已斯的单词
  if (bookId && bookId !== 'self') {
    try {
      const masteredSet = getMasteredWordbookWords(bookId);
      filteredList = list.filter(item => {
        const english = (item.english || '').trim().toLowerCase();
        return !masteredSet.has(english);
      });
    } catch (e) {
      console.error('buildBookReviewQueue: 过滤已斯单词失败', e);
    }
  }
  
  // 随机打乱并取前count个
  return shuffleList(filteredList).slice(0, count);
};

const saveSettingsAndStart = () => {
  saveSettings();
  showSettings.value = false;
  startReview();
};

const startReviewInternal = async (forceCount = null) => {
  // 预热词典，让第一题的干扰项加载不阻塞
  ensureDictWords();

  // 保存当前的 todayKeys（今日学过的单词），以便在改变设置后仍然计入今日进度
  const bookId = getCurrentBookId();
  const oldPlanEntry = getPlanEntry(bookId);
  const preservedTodayKeys = oldPlanEntry.todayKey === getTodayKey() ? oldPlanEntry.todayKeys : [];

  // 清除复习进度（但不清除 planEntry 中的 todayKeys）
  clearReviewProgress();

  const count = forceCount != null ? Number(forceCount) : Number(settings.value.count || 20);

  // 如果是推荐复习流程，reviewWords 已经在 startRecommendedReview 或 continueRecommendedReview 中设置
  if (recommendedReviewState.value.currentStage && reviewWords.value.length > 0) {
    // 推荐复习流程，直接使用已设置的 reviewWords
  } else if (isSelfWordbook()) {
    if (reviewPreset.value === 'due') {
      reviewWords.value = await db.getReviewWords({
        sortBy: settings.value.sortBy,
        count,
        difficulty: 'normal'
      });
    } else {
      const allWords = await db.getAllWords();
      reviewWords.value = buildPresetQueue(allWords, count);
    }
  } else {
    const list = await getCurrentBookWordPool();
    const presetQueue = buildPresetQueue(list, count);
    reviewWords.value = presetQueue.length ? presetQueue : await buildBookReviewQueue(list, count);
  }

  if (reviewWords.value.length === 0) {
    uni.showToast({
      title: '没有单词可复习',
      icon: 'none'
    });
    return;
  }

  reviewStarted.value = true;
  reviewFinished.value = false;
  currentIndex.value = 0;
  correctCount.value = 0;
  wrongCount.value = 0;
  wrongWords.value = [];
  sessionNewCount.value = reviewWords.value.filter((item) => !item.__isOldReview).length;
  sessionOldCount.value = reviewWords.value.filter((item) => !!item.__isOldReview).length;

  loadCurrentQuestion();
};

const startReview = async () => {
  // 检查是否有未完成的复习进度
  const progress = loadReviewProgress();
  if (progress) {
    // 有未完成的进度，直接恢复
    resumeReview();
  } else {
    // 没有未完成的进度，开始新的复习
    await startReviewInternal(null);
  }
};

const startExtraRound20 = async () => startReviewInternal(20);

const onPrimaryStartClick = async () => {
  if (isTodayTargetDone.value) {
    await startExtraRound20();
    return;
  }
  await startReview();
};

// 新增：开始推荐的复习 - 顺序流程：新词 > 错词 > 旧词
const startRecommendedReview = async () => {
  const count = Number(settings.value.count || 20);
  const bookId = getCurrentBookId();

  // 初始化推荐复习状态
  recommendedReviewState.value = {
    newWords: [],
    wrongWords: [],
    oldWords: [],
    currentStage: 'new',
    newCompleted: false,
    wrongCompleted: false,
    oldCompleted: false,
  };

  try {
    // 获取所有单词列表
    let allWords = [];
    if (isSelfWordbook()) {
      allWords = await db.getAllWords();
    } else {
      allWords = await getCurrentBookWordPool();
    }

    // 1. 收集新词
    const profiles = allWords.map((item) => getWordProfile(item)).filter(Boolean);
    const newWords = profiles.filter((item) => !item.seen_count || Number(item.seen_count) === 0);
    recommendedReviewState.value.newWords = shuffleList(newWords.map((p) => ({ english: p.english, chinese: p.chinese }))).slice(0, count);

    // 2. 收集错词
    const wrongSet = new Set(getMistakeWords(bookId, true).map((item) => getWordKey(item)));
    recommendedReviewState.value.wrongWords = shuffleList(filterWordsByKeys(allWords, wrongSet));

    // 3. 收集旧词（复习次数 < 3）
    const dueProfiles = getDueProfilesForWords(allWords, bookId);
    const oldWordsFiltered = dueProfiles.filter((item) => {
      const reviewCount = Number(item.review_count || 0);
      return reviewCount < 3;
    });
    const oldSet = new Set(oldWordsFiltered.map((item) => getWordKey(item)));
    recommendedReviewState.value.oldWords = shuffleList(filterWordsByKeys(allWords, oldSet));

    // 开始第一阶段：新词
    reviewPreset.value = 'new';
    reviewWords.value = recommendedReviewState.value.newWords;

    if (reviewWords.value.length === 0) {
      // 如果没有新词，跳到错词
      await continueRecommendedReview('wrong');
    } else {
      await startReviewInternal(null);
    }
  } catch (e) {
    console.error('startRecommendedReview 失败:', e);
    uni.showToast({ title: '加载失败', icon: 'none' });
  }
};

// 继续推荐复习的下一阶段
const continueRecommendedReview = async (nextStage) => {
  recommendedReviewState.value.currentStage = nextStage;

  if (nextStage === 'wrong') {
    recommendedReviewState.value.newCompleted = true;
    reviewPreset.value = 'wrong';
    reviewWords.value = recommendedReviewState.value.wrongWords;

    if (reviewWords.value.length === 0) {
      // 如果没有错词，跳到旧词
      await continueRecommendedReview('old');
    } else {
      await startReviewInternal(null);
    }
  } else if (nextStage === 'old') {
    recommendedReviewState.value.wrongCompleted = true;
    reviewPreset.value = 'old';
    reviewWords.value = recommendedReviewState.value.oldWords;

    if (reviewWords.value.length === 0) {
      // 所有阶段完成
      recommendedReviewState.value.oldCompleted = true;
      // 重置推荐复习状态，以便下次使用
      recommendedReviewState.value = {
        newWords: [],
        wrongWords: [],
        oldWords: [],
        currentStage: '',
        newCompleted: false,
        wrongCompleted: false,
        oldCompleted: false,
      };
      uni.showToast({ title: '推荐复习已完成！', icon: 'success' });
    } else {
      await startReviewInternal(null);
    }
  }
};

// 新增：开始指定预设的复习
const startPresetReview = async (preset) => {
  reviewPreset.value = preset;
  // 重置推荐复习状态，因为用户选择了其他复习方式
  recommendedReviewState.value = {
    newWords: [],
    wrongWords: [],
    oldWords: [],
    currentStage: '',
    newCompleted: false,
    wrongCompleted: false,
    oldCompleted: false,
  };
  // 直接开始新的复习，startReviewInternal 会处理进度清除
  await startReviewInternal(null);
};

/** 后台预取下一题的 masterDb 详情，命中缓存后当前题加载会极快 */
const prefetchNextWordDetail = (nextIndex) => {
  const nextWord = reviewWords.value[nextIndex];
  if (nextWord && nextWord.english) {
    // fire-and-forget，不 await，仅预热缓存
    masterDb.getWordFullDetail(nextWord.english).catch(() => {});
  }
};

const loadCurrentQuestion = async () => {
  showResult.value = false;
  showWrongFeedback.value = false;
  selectedOption.value = '';
  userTranslation.value = '';
  aiResult.value = null;
  
  if (currentIndex.value >= reviewWords.value.length) {
    reviewFinished.value = true;
    return;
  }
  
  currentWord.value = reviewWords.value[currentIndex.value];

  // 立即预取下一题，让缓存在用户答题期间就绪
  prefetchNextWordDetail(currentIndex.value + 1);

  if (currentWord.value?.english) {
    try {
      const detail = await masterDb.getWordFullDetail(currentWord.value.english);
      if (detail) {
        const merged = {
          ...currentWord.value,
          chinese: detail.chinese || currentWord.value.chinese,
          examples: Array.isArray(detail.examples) && detail.examples.length ? detail.examples : (currentWord.value.examples || []),
          synonyms: Array.isArray(detail.synonyms) && detail.synonyms.length ? detail.synonyms : (currentWord.value.synonyms || []),
          antonyms: Array.isArray(detail.antonyms) && detail.antonyms.length ? detail.antonyms : (currentWord.value.antonyms || []),
          defs: Array.isArray(detail.defs) ? detail.defs : (currentWord.value.defs || []),
          exam_tip: detail.exam_tip || currentWord.value.exam_tip || '',
        };
        currentWord.value = merged;
        reviewWords.value[currentIndex.value] = merged;
      }
    } catch (_) {}
  }
  
  spellInput.value = '';
  if (settings.value.mode === 'choice') {
    await loadChoiceQuestion();
  } else if (settings.value.mode === 'choice_en') {
    await loadChoiceEnQuestion();
  } else if (settings.value.mode === 'fill') {
    await loadFillQuestion();
  } else if (settings.value.mode === 'ai') {
    await loadAIQuestion();
  } else if (settings.value.mode === 'spell') {
    // 拼写模式无需加载选项
  }
};

// 从 masterDb 取词表做干扰项 —— 模块级单例，整个 App 生命周期只加载一次
let _dictWordsCache = [];
let _dictWordsPromise = null;
const ensureDictWords = () => {
  if (_dictWordsCache.length > 0) return Promise.resolve();
  if (_dictWordsPromise) return _dictWordsPromise;
  _dictWordsPromise = masterDb.getWordListForReview().then((list) => {
    _dictWordsCache = list || [];
    _dictWordsPromise = null;
  }).catch(() => { _dictWordsPromise = null; });
  return _dictWordsPromise;
};

const getFormSimilarFromDict = (targetEnglish, count, needChinese) => {
  if (!targetEnglish || !_dictWordsCache.length) return needChinese ? [] : [];
  const target = (targetEnglish || '').trim().toLowerCase();
  const len = target.length;
  const pool = _dictWordsCache.filter(
    (item) => item.word && item.chinese && item.word.trim().toLowerCase() !== target
  ).filter((item) => Math.abs((item.word || '').trim().length - len) <= 2);
  const capped = pool.length > 3000 ? pool.slice(0, 3000) : pool;
  const scored = capped.map((item) => ({
    word: (item.word || '').trim(),
    chinese: (item.chinese || '').trim(),
    score: formSimilarityScore((item.word || '').trim(), targetEnglish),
  }));
  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, Math.max(count, 5));
  const pick = top.length <= count ? top : top.slice(0, 5).sort(() => Math.random() - 0.5).slice(0, count);
  return needChinese ? pick.map((p) => ({ word: p.word, chinese: p.chinese })) : pick.map((p) => p.word);
};

const loadChoiceQuestion = async () => {
  await ensureDictWords();
  const distractors = getFormSimilarFromDict(currentWord.value.english, 3, true);
  
  // 获取当前单词的完整释义（词性+中文）和音标
  let currentWordOption = { chinese: currentWord.value.chinese, pos: '' };
  try {
    const currentDetail = await masterDb.getWordFullDetail(currentWord.value.english);
    if (currentDetail) {
      // 获取音标
      if (currentDetail.data_json && currentDetail.data_json.phonetic) {
        currentWord.value.phonetic = currentDetail.data_json.phonetic;
      }
      // 获取释义
      if (currentDetail.defs && currentDetail.defs.length > 0) {
        const def = currentDetail.defs[0];
        currentWordOption = {
          pos: def.pos || '',
          chinese: def.trans || currentWord.value.chinese
        };
      }
    }
  } catch (e) {
    console.error('获取当前单词释义失败:', e);
  }
  
  // 获取所有干扰项的完整释义
  const distractorOptions = [];
  for (const d of distractors) {
    let option = { pos: '', chinese: d.chinese };
    try {
      const detail = await masterDb.getWordFullDetail(d.word);
      if (detail && detail.defs && detail.defs.length > 0) {
        const def = detail.defs[0];
        option = {
          pos: def.pos || '',
          chinese: def.trans || d.chinese
        };
      }
    } catch (e) {
      console.error('获取干扰项释义失败:', e);
    }
    distractorOptions.push(option);
  }
  
  // 构建选项对象
  const options = [currentWordOption, ...distractorOptions].filter(o => o.chinese);
  
  const unique = [];
  const seen = new Set();
  for (const opt of options) {
    const key = `${opt.pos}:${opt.chinese}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(opt);
    }
  }
  
  // 如果不够4个，继续添加
  while (unique.length < 4) {
    const extra = getFormSimilarFromDict(currentWord.value.english, 1, true);
    if (extra[0]) {
      let option = { pos: '', chinese: extra[0].chinese };
      try {
        const detail = await masterDb.getWordFullDetail(extra[0].word);
        if (detail && detail.defs && detail.defs.length > 0) {
          const def = detail.defs[0];
          option = {
            pos: def.pos || '',
            chinese: def.trans || extra[0].chinese
          };
        }
      } catch (e) {}
      
      const key = `${option.pos}:${option.chinese}`;
      if (!seen.has(key)) {
        unique.push(option);
        seen.add(key);
      }
    } else {
      break;
    }
  }
  
  currentOptions.value = unique.slice(0, 4).sort(() => Math.random() - 0.5);
};

// 编辑距离，用于形式相近干扰项
const levenshtein = (a, b) => {
  if (!a || !b) return Math.max((a || '').length, (b || '').length);
  const m = a.length, n = b.length;
  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1].toLowerCase() === b[j - 1].toLowerCase() ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
};

// 形式相近得分：越高越像（同长、首尾相同、编辑距离小）
const formSimilarityScore = (eng, target) => {
  if (!eng || !target) return 0;
  const a = eng.trim().toLowerCase();
  const b = target.trim().toLowerCase();
  if (a === b) return -1e9;
  let score = 0;
  const lenDiff = Math.abs(a.length - b.length);
  if (lenDiff === 0) score += 10;
  else if (lenDiff === 1) score += 5;
  if (a.slice(0, 2) === b.slice(0, 2)) score += 4;
  if (a.length >= 2 && b.length >= 2 && a.slice(-2) === b.slice(-2)) score += 4;
  score -= levenshtein(a, b);
  return score;
};

// 从词库中取 3 个与目标词形式最相近的英文作为干扰项（不调 AI）
const getFormSimilarDistractors = (targetEnglish, wordList, count = 3) => {
  const pool = (wordList || [])
    .filter(w => w.id !== currentWord.value?.id && w.english)
    .map(w => (typeof w.english === 'string' ? w.english.trim() : ''))
    .filter(eng => eng && eng.toLowerCase() !== (targetEnglish || '').trim().toLowerCase());
  if (pool.length === 0) return [];
  const scored = pool.map(eng => ({ eng, score: formSimilarityScore(eng, targetEnglish) }));
  scored.sort((x, y) => y.score - x.score);
  const top = scored.slice(0, Math.max(count, scored.length));
  const pick = top.length <= count ? top : top.slice(0, 5).sort(() => Math.random() - 0.5).slice(0, count);
  return pick.map(p => p.eng);
};

const loadChoiceEnQuestion = async () => {
  await ensureDictWords();
  const target = currentWord.value?.english;
  const distractors = getFormSimilarFromDict(target, 3, false);
  const options = [target, ...distractors].filter(Boolean);
  const unique = [...new Set(options)];
  while (unique.length < 4) {
    const extra = getFormSimilarFromDict(target, 1, false);
    if (extra[0] && !unique.includes(extra[0])) unique.push(extra[0]);
    else break;
  }
  currentOptions.value = unique.slice(0, 4).sort(() => Math.random() - 0.5);
};

const loadFillQuestion = async () => {
  const examples = currentWord.value.examples || [];
  currentFillSentenceChinese.value = '';
  if (examples.length === 0) {
    currentSentence.value = '暂无例句';
    fillAnswer.value = currentWord.value.english;
    fillOptions.value = [currentWord.value.english];
    return;
  }
  
  const randomExample = examples[Math.floor(Math.random() * examples.length)];
  const sentence = randomExample.english;
  const targetWord = currentWord.value.english;
  currentFillSentenceChinese.value = randomExample.chinese || '';
  
  const blankSentence = sentence.replace(new RegExp(`\\b${escapeRegExp(targetWord)}\\b`, 'gi'), '____');
  currentSentence.value = blankSentence;
  fillAnswer.value = targetWord;

  await ensureDictWords();
  const otherWords = getFormSimilarFromDict(targetWord, 3, false);
  fillOptions.value = [...otherWords, targetWord].filter(Boolean);
  const unique = [...new Set(fillOptions.value)];
  while (unique.length < 4) {
    const extra = getFormSimilarFromDict(targetWord, 1, false);
    if (extra[0] && !unique.includes(extra[0])) unique.push(extra[0]);
    else break;
  }
  fillOptions.value = unique.slice(0, 4).sort(() => Math.random() - 0.5);
};

// AI语境复习：生成例句
const loadAIQuestion = async () => {
  isGenerating.value = true;
  aiSentence.value = '';
  
  try {
    const word = currentWord.value.english;
    const prompt = `你是一个考研英语名师。请为单词 '${word}' 生成一句符合考研难度、简短且地道的英文例句。只需返回纯英文句子，不要任何解释和标点符号外的多余字符。`;
    
    const response = await aiService.callAPI(prompt);
    aiSentence.value = response.trim();
  } catch (error) {
    console.error('生成例句失败:', error);
    aiSentence.value = '生成例句失败，请重试';
  } finally {
    isGenerating.value = false;
  }
};

const queueRetryWord = () => {
  const key = getWordKey(currentWord.value);
  if (!key) return;
  const retryCount = Number(currentWord.value.__retryCount || 0);
  if (retryCount >= 1) return;
  reviewWords.value.push({
    ...currentWord.value,
    __retryCount: retryCount + 1,
    __isOldReview: true,
    __fromWrongRetry: true,
  });
};

const applyReviewOutcome = async (isCorrect, wrongPayload = null) => {
  recordReviewOutcome(currentWord.value, isCorrect, {
    bookId: getCurrentBookId(),
    mode: settings.value.mode,
    source: 'review',
  });
  if (currentWord.value.id) {
    await db.updateErrorRate(currentWord.value.id, isCorrect);
    applyReviewPreview(isCorrect);
  }
  if (isCorrect) {
    correctCount.value++;
    return;
  }
  wrongCount.value++;
  queueRetryWord();
  if (wrongPayload) {
    wrongWords.value.push(wrongPayload);
  }
};

// 提交答案
const submitAnswer = async () => {
  if (!userTranslation.value.trim() || isSubmitting.value) return;
  
  isSubmitting.value = true;
  
  try {
    const word = currentWord.value.english;
    const sentence = aiSentence.value;
    const userInput = userTranslation.value.trim();
    
    const prompt = `目标单词：'${word}'。英文例句：'${sentence}'。学生输入该词在此句中的中文意思：'${userInput}'。

请以宽松、包容的标准判分：只要学生表达的意思与目标词在本句中的含义相近、同义、或合理意译，就应判为正确（is_correct: true）。只有明显错误、完全偏离才判错。
请同时给出该英文例句的完整中文翻译。
严格返回 JSON，不要其他内容：{"is_correct": true或false, "explanation": "简短解析", "sentence_chinese": "整句中文翻译"}`;
    
    const response = await aiService.callAPI(prompt);
    
    // 解析JSON响应
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      aiResult.value = {
        is_correct: !!parsed.is_correct,
        explanation: parsed.explanation || '解析失败',
        sentence_chinese: parsed.sentence_chinese || ''
      };
    } else {
      aiResult.value = { is_correct: false, explanation: '解析失败，请重试', sentence_chinese: '' };
    }
    
    showResult.value = true;
    markWordsReviewed(currentWord.value);
    
    // 更新正确/错误计数
    if (aiResult.value.is_correct) {
      await applyReviewOutcome(true);
    } else {
      await applyReviewOutcome(false, {
        english: currentWord.value.english,
        chinese: currentWord.value.chinese,
        yourAnswer: userInput,
        explanation: aiResult.value.explanation,
        synonyms: currentWord.value.synonyms || []
      });
    }
  } catch (error) {
    console.error('提交答案失败:', error);
    uni.showToast({
      title: 'AI判卷失败，请重试',
      icon: 'none'
    });
  } finally {
    isSubmitting.value = false;
  }
};

const handleChoice = async (option) => {
  selectedOption.value = option;
  showResult.value = true;
  markWordsReviewed(currentWord.value);
  
  const optionChinese = typeof option === 'object' ? option.chinese : option;
  
  // 比较选项中文和当前单词的第一个释义
  let isCorrect = false;
  if (currentWord.value.defs && currentWord.value.defs.length > 0) {
    // 与第一个释义比较
    const firstDef = currentWord.value.defs[0];
    isCorrect = optionChinese === (firstDef.trans || currentWord.value.chinese);
  } else {
    // 如果没有defs，则与chinese比较
    isCorrect = optionChinese === currentWord.value.chinese;
  }
  
  if (isCorrect) {
    await applyReviewOutcome(true);
  } else {
    await applyReviewOutcome(false, {
      english: currentWord.value.english,
      chinese: currentWord.value.chinese,
      yourAnswer: optionChinese,
      synonyms: currentWord.value.synonyms || []
    });
  }
};

const handleChoiceEn = async (option) => {
  selectedOption.value = option;
  showResult.value = true;
  markWordsReviewed(currentWord.value);
  const correct = (option || '').trim().toLowerCase() === (currentWord.value.english || '').trim().toLowerCase();
  if (correct) {
    await applyReviewOutcome(true);
  } else {
    await applyReviewOutcome(false, {
      english: currentWord.value.english,
      chinese: currentWord.value.chinese,
      yourAnswer: option,
      synonyms: currentWord.value.synonyms || []
    });
  }
};

const handleFillChoice = async (option) => {
  selectedOption.value = option;
  showResult.value = true;
  markWordsReviewed(currentWord.value);
  
  if (option === fillAnswer.value) {
    await applyReviewOutcome(true);
  } else {
    await applyReviewOutcome(false, {
      english: currentWord.value.english,
      chinese: currentWord.value.chinese,
      yourAnswer: option,
      correctAnswer: fillAnswer.value,
      synonyms: currentWord.value.synonyms || []
    });
  }
};

const handleSpellSubmit = async () => {
  const input = (spellInput.value || '').trim().toLowerCase();
  if (!input) return;
  const correct = input === (currentWord.value.english || '').trim().toLowerCase();
  showResult.value = true;
  markWordsReviewed(currentWord.value);
  if (correct) {
    await applyReviewOutcome(true);
  } else {
    await applyReviewOutcome(false, {
      english: currentWord.value.english,
      chinese: currentWord.value.chinese,
      yourAnswer: spellInput.value.trim(),
      correctAnswer: currentWord.value.english,
      synonyms: currentWord.value.synonyms || []
    });
  }
};

const nextQuestion = () => {
  if (currentIndex.value >= reviewWords.value.length - 1) {
    finishReview();
    return;
  }
  currentIndex.value++;
  saveReviewProgress();
  loadCurrentQuestion();
};

const finishReview = async () => {
  reviewFinished.value = true;
  clearReviewProgress();
  saveReviewResult();
  logStudySession({
    bookId: getCurrentBookId(),
    mode: settings.value.mode,
    preset: reviewPreset.value,
    reviewedCount: correctCount.value + wrongCount.value,
    correctCount: correctCount.value,
    wrongCount: wrongCount.value,
    newCount: sessionNewCount.value,
    oldCount: sessionOldCount.value,
    mistakeCount: wrongWords.value.length,
  });
  refreshPlanStats();

  // 检查是否在推荐复习流程中，如果是则继续下一阶段
  if (recommendedReviewState.value.currentStage === 'new' && !recommendedReviewState.value.newCompleted) {
    // 新词阶段完成，继续错词
    await continueRecommendedReview('wrong');
  } else if (recommendedReviewState.value.currentStage === 'wrong' && !recommendedReviewState.value.wrongCompleted) {
    // 错词阶段完成，继续旧词
    await continueRecommendedReview('old');
  }
};

const restartReview = () => {
  onPrimaryStartClick();
};

const goBack = () => {
  uni.navigateBack();
};

// 跳转到单词详情页（红宝书补全版）
const goToWordDetail = () => {
  if (!currentWord.value) {
    uni.showToast({ title: '无法查看详情', icon: 'none' });
    return;
  }

  // 保存当前复习进度
  saveReviewProgress();
  
  // 跳转到红宝书补全版的详情页
  uni.navigateTo({
    url: `/pages/word-detail/word-detail?english=${encodeURIComponent(currentWord.value.english)}&source=masterdb`,
    fail: (err) => {
      console.error('跳转失败:', err);
      uni.showToast({ title: '跳转失败', icon: 'none' });
    }
  });
};

// 斩掉当前单词
const markCurrentWordAsMastered = async () => {
  if (!currentWord.value || !currentWord.value.english) {
    uni.showToast({ title: '无法斩掉该单词', icon: 'none' });
    showMasteredConfirm.value = false;
    return;
  }

  try {
    const bookId = getCurrentBookId();

    if (bookId && bookId !== 'self') {
      // 词书单词：优先处理，没有id，存储到本地存储
      console.log('markCurrentWordAsMastered: 词书单词，存储到本地');
      addMasteredWordbookWord(bookId, currentWord.value.english);
    } else if (currentWord.value.id) {
      // 自用词库单词：有id，直接操作数据库
      console.log('markCurrentWordAsMastered: 自用词库单词，使用id斯掉');
      await db.masterWord(currentWord.value.id);
    } else {
      // 其他情况：尝试用english查询
      console.log('markCurrentWordAsMastered: 其他情况，使用english斯掉');
      await db.masterWordByEnglish(currentWord.value.english);
    }

    console.log('markCurrentWordAsMastered: 斯掉成功');
    uni.showToast({ title: '已斯掉！', icon: 'success' });
    showMasteredConfirm.value = false;

    // 自动跳到下一题
    setTimeout(() => {
      nextQuestion();
    }, 500);
  } catch (error) {
    console.error('markCurrentWordAsMastered: 斯掉失败', error);
    uni.showToast({ title: '斯掉失败: ' + (error.message || '未知错误'), icon: 'none' });
    showMasteredConfirm.value = false;
  }
};

const backToStartScreen = () => {
  saveReviewProgress();
  checkProgress();
  reviewStarted.value = false;
  reviewFinished.value = false;
  selectedOption.value = '';
  showResult.value = false;
  showWrongFeedback.value = false;
  userTranslation.value = '';
  aiResult.value = null;
};

onBackPress(() => {
  if (reviewStarted.value && !reviewFinished.value) {
    backToStartScreen();
    return true;
  }
  return false;
});
</script>

<style scoped>
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
  position: absolute;
  left: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px 8px 8px;
  font-size: 38px;
  color: #FF85A1;
  font-weight: 300;
  line-height: 1;
  min-width: 56px;
  min-height: 56px;
}

.nav-title {
  font-size: 18px;
  font-weight: 600;
  color: #5B5565;
  text-align: center;
}

.nav-settings-btn {
  position: absolute;
  right: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  font-size: 20px;
  color: #FF85A1;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
}

.container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #FFF8FB;
  overflow: hidden;
  box-sizing: border-box;
}

.container:not(:has(.stats-bar)) {
  padding-top: 0;
}

.start-review-fixed {
  padding: calc(4px + constant(safe-area-inset-top)) 12px 12px;
  padding: calc(4px + env(safe-area-inset-top)) 12px 12px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 6px;
  flex: 1;
  overflow-y: hidden;
  box-sizing: border-box;
}

/* 分类标签 */
.section-label {
  font-size: 11px;
  font-weight: 600;
  color: #9B7BA8;
  margin-bottom: 1px;
  padding: 0 4px;
  flex-shrink: 0;
}

/* 卡片基础样式 */
.card {
  background: white;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(255, 133, 161, 0.06);
  border: 1px solid rgba(255, 200, 220, 0.2);
}

/* 大统计卡片 */
.stat-card-large {
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  flex: 0 0 28%;
  min-height: auto;
  flex-shrink: 0;
}

.stat-card-book {
  flex: 0 0 19.6%;
}

.stat-value-large {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
}

.stat-number {
  font-size: 56px;
  font-weight: 800;
  color: #FF6B9D;
  line-height: 1.2;
  display: flex;
  align-items: center;
}

.stat-sep {
  font-size: 24px;
  color: #D4D4D8;
  font-weight: 400;
  line-height: 1.2;
  display: flex;
  align-items: center;
}

.stat-bar {
  width: 100%;
  height: 5px;
  background: #F0E0E8;
  border-radius: 999px;
  overflow: hidden;
}

.stat-bar-fill {
  height: 100%;
  background: #FF6B9D;
  border-radius: 999px;
  transition: width 0.3s ease;
}

.stat-detail-row {
  font-size: 10px;
  color: #9B7BA8;
  text-align: center;
  line-height: 1.1;
}

.stat-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-left-text {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.stat-right-text {
  font-size: 16px;
  color: #FF6B9D;
  font-weight: 700;
}

/* 推荐复习卡片 */
.recommend-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  flex: 0 0 18%;
  min-height: auto;
  flex-shrink: 0;
}

.recommend-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex: 1;
  min-width: 0;
}

.recommend-title {
  font-size: 14px;
  font-weight: 700;
  color: #2D1B2E;
}

.recommend-desc {
  font-size: 11px;
  color: #9B7BA8;
  line-height: 1.2;
}

.start-btn {
  background: #FF6B9D !important;
  color: white !important;
  border: none !important;
  border-radius: 8px !important;
  padding: 0 18px !important;
  font-size: 14px !important;
  font-weight: 700 !important;
  white-space: nowrap;
  flex-shrink: 0;
  height: 40px !important;
  line-height: 40px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

/* 其他复习方式 */
.other-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  flex: 0 0 18%;
  flex-shrink: 0;
}

.other-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5px;
  padding: 2px 4px;
  transition: all 0.2s ease;
  min-height: auto;
  flex-shrink: 0;
}

.other-btn:active {
  transform: scale(0.98);
  box-shadow: 0 2px 8px rgba(255, 133, 161, 0.1);
}

.btn-title {
  font-size: 12px;
  font-weight: 700;
  color: #2D1B2E;
  text-align: center;
  line-height: 1.1;
}

.btn-count {
  font-size: 13px;
  font-weight: 800;
  color: #FF6B9D;
}

/* 继续复习 */
.continue-section {
  margin-top: -8px;
}

.continue-card {
  background: #FFF0F4;
  border-radius: 16px;
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 2px solid #FFD6E0;
}

.continue-text {
  font-size: 15px;
  font-weight: 600;
  color: #FF85A1;
}

.continue-arrow {
  font-size: 18px;
  color: #FF85A1;
}

/* 上次复习结果 */
.last-result-section {
  text-align: center;
  margin-top: -8px;
}

.last-result-text {
  font-size: 13px;
  color: #A1A1AA;
}

.book-card {
  background: #FFFFFF;
  border-radius: 16px;
  padding: 16px;
  border: 1px solid #F9EAF1;
  box-shadow: 0 8px 22px rgba(244, 143, 177, 0.10);
}

.book-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.book-name {
  font-size: 19px;
  font-weight: 700;
  color: #2E2E38;
}

.book-status {
  font-size: 14px;
  color: #B85C6F;
  font-weight: 700;
}

.book-meta-row {
  margin-top: 2px;
  margin-bottom: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.book-meta {
  font-size: 13px;
  color: #8E8798;
}

.book-reset {
  font-size: 13px;
  color: #F48FB1;
  font-weight: 600;
}

.book-progress-text {
  font-size: 13px;
  color: #7F8496;
  margin-bottom: 8px;
}

.book-plan-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}

.book-plan-badge {
  min-width: calc(50% - 4px);
  padding: 10px 12px;
  border-radius: 12px;
  background: #FFF8FB;
  border: 1px solid #F8E6EE;
  box-sizing: border-box;
}

.book-plan-label {
  display: block;
  font-size: 12px;
  color: #9A92A3;
  margin-bottom: 4px;
}

.book-plan-value {
  font-size: 17px;
  line-height: 1.1;
  color: #2E2E38;
  font-weight: 700;
}

.book-progress-track {
  width: 100%;
  height: 6px;
  border-radius: 999px;
  background: #F7EDF2;
  overflow: hidden;
}

.book-progress-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #F9C8D8 0%, #F48FB1 100%);
}

.book-foot {
  margin-top: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #9A92A3;
}

.core-action {
  background: #FFFFFF;
  border-radius: 16px;
  padding: 18px 16px 16px;
  border: 1px solid #F9EAF1;
  box-shadow: 0 8px 20px rgba(244, 143, 177, 0.08);
}

.core-title {
  font-size: 16px;
  color: #52566A;
  font-weight: 600;
}

.core-count {
  margin-top: 8px;
  margin-bottom: 16px;
  display: flex;
  align-items: flex-end;
}

.core-done {
  font-size: 62px;
  line-height: 1;
  color: #2E2E38;
  font-weight: 800;
  font-style: italic;
}

.core-sep,
.core-total {
  font-size: 30px;
  line-height: 1.15;
  color: #7F8496;
  font-weight: 600;
  font-style: italic;
}

.daily-plan-card {
  background: #FFFFFF;
  border-radius: 16px;
  padding: 14px 14px 12px;
  border: 1px solid #F9EAF1;
  box-shadow: 0 6px 16px rgba(244, 143, 177, 0.08);
}

.daily-plan-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.daily-title {
  font-size: 16px;
  color: #2E2E38;
  font-weight: 700;
}

.daily-sub {
  font-size: 13px;
  color: #8E8798;
}

.daily-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.daily-breakdown {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}

.daily-break-item {
  flex: 1;
  min-width: 0;
  padding: 10px 0;
  border-radius: 12px;
  background: #FFF8FB;
  border: 1px solid #F8E6EE;
  text-align: center;
}

.daily-break-label {
  display: block;
  font-size: 12px;
  color: #9A92A3;
  margin-bottom: 4px;
}

.daily-break-value {
  font-size: 18px;
  color: #B85C6F;
  font-weight: 700;
}

.daily-chip {
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 13px;
  color: #8E8798;
  background: #FFF4F8;
  border: 1px solid #F3DCE5;
}

.daily-chip.active {
  color: #FFFFFF;
  background: #F48FB1;
  border-color: #F48FB1;
}

.task-center-card {
  background: #FFFFFF;
  border-radius: 16px;
  padding: 14px;
  border: 1px solid #F9EAF1;
  box-shadow: 0 6px 16px rgba(244, 143, 177, 0.08);
}

.task-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.task-tile {
  padding: 12px 10px;
  border-radius: 14px;
  background: #FFF8FB;
  border: 1px solid #F4DFE8;
  text-align: center;
}

.task-tile.active {
  background: #FFF0F4;
  border-color: #F48FB1;
}

.task-value {
  display: block;
  font-size: 22px;
  line-height: 1.1;
  font-weight: 800;
  color: #B85C6F;
  margin-bottom: 6px;
}

.task-label {
  font-size: 12px;
  color: #8E8798;
}

.settings-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.setting-tile {
  width: calc(50% - 5px);
  min-height: 102px;
  border-radius: 14px;
  background: #FAFAFB;
  border: 1px solid #F1F1F3;
  padding: 14px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: all 0.2s ease;
}

.setting-tile-active {
  border-color: #F48FB1;
  background: #FFF9FC;
  box-shadow: 0 6px 14px rgba(244, 143, 177, 0.14);
}

.tile-title {
  font-size: 13px;
  color: #8D92A2;
}

.tile-value {
  font-size: 17px;
  color: #2E2E38;
  font-weight: 700;
  margin-top: 8px;
  word-break: break-all;
}

.dashboard-btn {
  width: 100%;
  height: 50px;
  border-radius: 999px !important;
  background: linear-gradient(180deg, #F8A8C4 0%, #F48FB1 100%) !important;
  box-shadow: 0 10px 20px rgba(244, 143, 177, 0.34);
  color: #FFFFFF !important;
  font-size: 19px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 8px;
}

.settings-row {
  margin-top: 8px;
  padding-top: 12px;
  border-top: 1px solid #eee;
}

.settings-link {
  font-size: 14px;
  color: #FF85A1;
  font-weight: 500;
  padding: 4px 0;
}

/* 设置弹窗 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.settings-modal {
  background: white;
  border-radius: 20px;
  padding: 20px;
  width: 90%;
  max-width: 340px;
  max-height: 75vh;
  overflow-y: auto;
}

.resume-modal {
  background: white;
  border-radius: 24px;
  padding: 24px;
  width: 90%;
  max-width: 360px;
  text-align: center;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 14px;
  border-bottom: 1px solid #F5F5F5;
}

.modal-title {
  font-size: 18px;
  font-weight: 700;
  color: #333333;
  flex: 1;
  text-align: center;
}

.modal-close {
  font-size: 22px;
  color: #CCCCCC;
  cursor: pointer;
  padding: 4px 8px;
  transition: color 0.2s ease;
  position: absolute;
  right: 20px;
  top: 20px;
}

.modal-close:active {
  color: #999999;
}

/* 选择器弹窗样式 */
.selector-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1001;
}

.selector-modal {
  background: white;
  border-radius: 20px;
  padding: 20px;
  width: 90%;
  max-width: 340px;
  max-height: 65vh;
  overflow-y: auto;
}

.selector-title {
  font-size: 17px;
  font-weight: 700;
  color: #333333;
  margin-bottom: 16px;
  display: block;
  text-align: center;
}

.selector-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.selector-item {
  padding: 14px 18px;
  background: #F9F9F9;
  border-radius: 10px;
  font-size: 14px;
  color: #666666;
  border: 2px solid transparent;
  transition: all 0.2s ease;
  text-align: center;
  cursor: pointer;
}

.selector-item:active {
  transform: scale(0.97);
}

.selector-item.active {
  background: linear-gradient(135deg, #FF85A1, #FFB3C6);
  color: white;
  border-color: #FF85A1;
  font-weight: 600;
}

.setting-group {
  margin-bottom: 24px;
}

.setting-label {
  font-size: 14px;
  font-weight: 600;
  color: #5B5565;
  margin-bottom: 12px;
  display: block;
}

.setting-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.setting-chip {
  padding: 10px 16px;
  background: #F5F5F7;
  border-radius: 999px;
  font-size: 14px;
  color: #71717A;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.setting-chip.active {
  background: linear-gradient(135deg, #FF85A1, #FFB3C6);
  color: white;
  border-color: #FF85A1;
}

.modal-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #F5F5F5;
}

.modal-btn {
  flex: 1;
  padding: 12px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  border: none;
}

.modal-btn.primary {
  background: linear-gradient(135deg, #FF85A1, #FFB3C6);
  color: white;
}

.modal-btn.secondary {
  background: #F5F5F7;
  color: #71717A;
}

.modal-btn:not(.primary):not(.secondary) {
  background: #F5F5F7;
  color: #71717A;
}

/* ===== 现代化设置卡片网格布局 ===== */
.settings-cards-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  padding: 16px 0;
  width: 100%;
}

.settings-card {
  background: #FFFFFF;
  border-radius: 14px;
  padding: 16px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  position: relative;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid #F8F8F8;
  min-height: 100px;
}

.settings-card:active {
  transform: scale(0.97);
  box-shadow: 0 3px 10px rgba(244, 143, 177, 0.12);
  background: #FFF9FB;
}

.settings-card:hover {
  box-shadow: 0 3px 12px rgba(244, 143, 177, 0.1);
  border-color: #F5F0F3;
}

.card-title {
  font-size: 15px;
  font-weight: 700;
  color: #333333;
  margin-bottom: 8px;
  display: block;
}

.card-description {
  font-size: 12px;
  color: #999999;
  display: block;
  line-height: 1.3;
  flex: 1;
}

.card-arrow-icon {
  position: absolute;
  bottom: 12px;
  right: 12px;
  font-size: 16px;
  color: #E0E0E0;
  font-weight: 300;
}

.setting-item {
  margin-bottom: 20px;
}

.setting-label {
  display: block;
  font-weight: bold;
  margin-bottom: 10px;
  color: #333;
}

.radio-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.radio-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.radio-item input {
  width: 18px;
  height: 18px;
}

.picker-value {
  padding: 12px 15px;
  background-color: #f5f7fa;
  border: 1px solid #ddd;
  border-radius: 8px;
  color: #333;
}

/* 复习设置：大色块平铺，选中皇家蓝 */
.settings-modal-blocks .setting-block-group {
  margin-bottom: 20px;
}

.settings-modal-blocks .setting-block-group .setting-label {
  font-size: 14px;
  color: #4A4E69;
  margin-bottom: 10px;
  display: block;
}

.block-row {
  display: flex;
  flex-wrap: nowrap;
  gap: 10px;
  width: 100%;
  box-sizing: border-box;
}

.block-row.wrap {
  flex-wrap: wrap;
}

.inline-block {
  background: #F5F5F7;
  padding: 14px 18px;
  min-width: 60px;
  max-width: 100%;
  text-align: center;
  box-sizing: border-box;
  flex-shrink: 1;
  border-radius: 10px;
}

.inline-block .inline-block-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
  display: block;
}

.inline-block.selected {
  background: #F48FB1;
}

.inline-block-text {
  font-size: 14px;
  color: #3a3a3c;
}

.inline-block.selected .inline-block-text {
  color: #FFFFFF;
  font-weight: bold;
}

.modal-buttons {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.btn-primary {
  flex: 1;
  padding: 12px;
  background-color: #F48FB1;
  color: white;
  border: none;
  border-radius: 10px;
}

.btn-secondary {
  flex: 1;
  padding: 12px;
  background-color: #F4F4F6;
  color: #4A4E69;
  border: 1px solid #E6E7EC;
  border-radius: 10px;
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

.choice-mode, .fill-mode, .ai-mode, .spell-mode {
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
  padding: 0 16px 16px 16px;
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

.option-card.correct .option-pos {
  color: rgba(255, 255, 255, 0.9) !important;
}

.option-card.correct .option-text {
  color: white !important;
}

.option-card.wrong {
  background: #FF6B6B;
  color: white;
  border: 2px solid #FF6B6B;
}

.option-card.wrong .option-pos {
  color: rgba(255, 255, 255, 0.9);
}

.option-card.wrong .option-text {
  color: white;
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
  min-width: 40px;
}

.option-text {
  flex: 1;
  word-break: break-word;
  line-height: 1.6;
  font-size: 16px;
  color: #2C3E50;
}

.wrong-feedback {
  margin-top: 20px;
  padding: 16px;
  background-color: #FFF4F8;
  border-radius: 12px;
  width: 100%;
  max-width: 400px;
  box-sizing: border-box;
  box-shadow: 0 2px 8px rgba(244, 143, 177, 0.08);
  border: 1px solid #F3DCE5;
}

.feedback-title {
  font-weight: bold;
  color: #B85C6F;
  margin-bottom: 10px;
  font-size: 14px;
}

.synonyms-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.synonym-item {
  display: flex;
  gap: 10px;
  font-size: 14px;
}

.syn-word {
  font-weight: bold;
  color: #B85C6F;
}

.syn-chinese {
  color: #666;
}

.review-exam-tip {
  margin-top: 8px;
  padding: 10px 14px;
  background: #FFFCFD;
  border: 1px solid #F7E8EE;
  border-radius: 14px;
  font-size: 13px;
  line-height: 1.6;
  color: #666B78;
}

.review-def-hints {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.review-def-chip {
  padding: 6px 10px;
  border-radius: 999px;
  background: #FFF0F4;
  color: #B85C6F;
  font-size: 12px;
}

/* 精修释义彩色展示块 */
.review-defs-block {
  width: 100%;
  max-width: 400px;
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-sizing: border-box;
}

.review-def-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  box-sizing: border-box;
}

.rdef-freq {
  /* 重点义：仅文字染色，无背景框 */
}

.rdef-rare {
  /* 熟词僻义：仅文字染色，无背景框 */
}

.rdef-normal {
  /* 普通义 */
}

.rdef-pos {
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 700;
  color: #9A8FA0;
  min-width: 32px;
}

.rdef-tag {
  display: none; /* 不再显示标签方框 */
}

.rdef-tag-freq {
  display: none;
}

.rdef-tag-rare {
  display: none;
}

.rdef-trans {
  flex: 1;
  font-size: 14px;
  line-height: 1.55;
  color: #4A4E69;
}

.rdef-freq .rdef-pos { color: #C46B47; }
.rdef-freq .rdef-trans { color: #C46B47; font-weight: 700; }
.rdef-rare .rdef-pos { color: #7F6AA8; }
.rdef-rare .rdef-trans { color: #7F6AA8; font-weight: 600; }

.fill-sentence {
  font-size: 16px;
  line-height: 1.6;
  padding: 16px;
  background-color: white;
  border-radius: 12px;
  margin-bottom: 20px;
  width: 100%;
  max-width: 400px;
  text-align: center;
  box-sizing: border-box;
  box-shadow: 0 2px 4px rgba(255, 133, 161, 0.1);
  border: 1px solid #FFD6E0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.fill-result {
  margin-top: 16px;
  padding: 15px;
  border-radius: 8px;
  width: 100%;
  max-width: 400px;
  text-align: center;
  overflow: hidden;
}

.fill-result .sentence-chinese,
.result-card .sentence-chinese {
  font-size: 14px;
  color: #4A4E69;
  margin-bottom: 12px;
  line-height: 1.5;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.result-correct {
  color: #B85C6F;
  font-weight: bold;
}

.result-wrong {
  color: #D97C9A;
}

.start-review {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding: 16px;
  gap: 20px;
}

.start-card {
  background-color: white;
  padding: 30px;
  border-radius: 12px;
  text-align: center;
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 10px 30px rgba(255, 133, 161, 0.08);
}

.current-settings {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
  width: 100%;
  max-width: 300px;
  align-items: flex-start;
}

.setting-row {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
}

.setting-label {
  font-size: 14px;
  color: #A0AEC0;
  min-width: 60px;
}

.setting-value {
  font-size: 14px;
  color: #4A4E69;
  font-weight: bold;
  flex: 1;
}

.btn-start {
  width: 100%;
  height: 50px;
  background-color: #FF85A1;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 18px;
  box-shadow: 0 4px 8px rgba(255, 133, 161, 0.3);
  transition: transform 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.btn-start:active {
  transform: scale(0.95);
}

.start-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  width: 80%;
  margin-top: 10px;
}

.btn-resume {
  width: 100%;
  height: 50px;
  background-color: #FF85A1;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 18px;
  box-shadow: 0 4px 8px rgba(255, 133, 161, 0.3);
  transition: transform 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.btn-resume:active {
  transform: scale(0.95);
}

/* 复习结果卡片样式 */
.review-result-card {
  background-color: white;
  padding: 20px;
  border-radius: 12px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 10px 30px rgba(255, 133, 161, 0.08);
}

.result-header {
  margin-bottom: 15px;
}

.result-title {
  font-size: 16px;
  font-weight: bold;
  color: #4A4E69;
}

.result-stats {
  display: flex;
  justify-content: space-around;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #f0f0f0;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 20px;
  font-weight: bold;
  color: #FF85A1;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 12px;
  color: #A0AEC0;
}

/* 错误单词预览 */
.wrong-words-preview {
  margin-top: 15px;
}

.preview-title {
  font-size: 14px;
  font-weight: bold;
  color: #4A4E69;
  margin-bottom: 10px;
}

.wrong-words-scroll {
  white-space: nowrap;
  margin-left: -10px;
  margin-right: -10px;
}

.wrong-word-item {
  display: inline-block;
  background-color: #FFF5F7;
  padding: 10px 15px;
  border-radius: 8px;
  margin-right: 10px;
  min-width: 120px;
}

.wrong-english {
  display: block;
  font-size: 14px;
  font-weight: bold;
  color: #4A4E69;
  margin-bottom: 5px;
}

.wrong-chinese {
  display: block;
  font-size: 12px;
  color: #A0AEC0;
}

.finished {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 40px;
}

.finished-icon {
  width: 88px;
  height: 88px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  flex-shrink: 0;
}

.icon-perfect {
  background: linear-gradient(135deg, #F9C8D8, #F48FB1);
  box-shadow: 0 8px 24px rgba(244, 143, 177, 0.35);
}

.icon-good {
  background: linear-gradient(135deg, #FFCBA4, #F4A066);
  box-shadow: 0 8px 24px rgba(244, 160, 102, 0.3);
}

.finished-icon-text {
  font-size: 22px;
  font-weight: 800;
  color: #FFFFFF;
  letter-spacing: 2px;
  text-shadow: 0 1px 4px rgba(0,0,0,0.12);
}

.finished h3 {
  color: #B85C6F;
  font-size: 28px;
  margin-bottom: 20px;
}

.finished-stats {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
}

.finished-stats text {
  font-size: 16px;
  color: #333;
}

.finished-insight-card {
  width: 100%;
  max-width: 360px;
  background: #FFFFFF;
  border: 1px solid #F3DCE5;
  border-radius: 16px;
  padding: 14px 16px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 20px;
  box-shadow: 0 4px 14px rgba(244, 143, 177, 0.08);
}

.finished-insight-title {
  font-size: 14px;
  font-weight: 700;
  color: #B85C6F;
  margin-bottom: 2px;
}

/* AI语境复习模式样式 */
.spell-prompt {
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
}

.spell-chinese {
  font-size: 22px;
  color: #4A4E69;
  margin-bottom: 20px;
  text-align: center;
  padding: 16px;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.spell-input {
  width: 100%;
  max-width: 280px;
  padding: 14px 18px;
  font-size: 18px;
  border: 2px solid #FFE5EC;
  border-radius: 16px;
  background: #FFF;
}

.spell-result {
  margin-top: 16px;
  padding: 12px;
  border-radius: 12px;
  font-size: 15px;
}

.spell-result.result-correct {
  color: #B85C6F;
  background: #FFF0F4;
}

.spell-result.result-wrong {
  color: #D97C9A;
  background: #FFEFF4;
}

.ai-mode {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  padding: 20px;
  box-sizing: border-box;
}

.ai-word {
  font-size: clamp(28px, 8vw, 42px);
  font-weight: bold;
  color: #B85C6F;
  margin-bottom: 20px;
  text-align: center;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.context-card {
  width: 100%;
  max-width: 400px;
  background-color: white;
  border-radius: 24px;
  padding: 24px;
  box-sizing: border-box;
  box-shadow: 0 4px 20px rgba(255, 133, 161, 0.12);
  margin-bottom: 20px;
  overflow: hidden;
}

.context-sentence {
  font-size: 18px;
  line-height: 1.6;
  color: #4A4E69;
  text-align: center;
  min-height: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.generating-indicator {
  text-align: center;
  color: #A0AEC0;
  font-size: 14px;
  margin-top: 10px;
}

.input-area {
  width: 100%;
  max-width: 400px;
  margin-bottom: 16px;
  flex-shrink: 0;
}

.translation-input {
  width: 100%;
  height: 56px;
  border-radius: 28px;
  background-color: #F7FAFC;
  border: 2px solid transparent;
  padding: 0 20px;
  font-size: 16px;
  color: #4A4E69;
  box-sizing: border-box;
  transition: border-color 0.3s ease;
}

.translation-input:focus {
  border-color: #FF85A1;
  outline: none;
}

.translation-input:disabled {
  background-color: #F0F0F0;
  color: #A0AEC0;
}

.result-card {
  width: 100%;
  max-width: 400px;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  box-sizing: border-box;
  animation: fadeIn 0.3s ease;
  overflow: hidden;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.result-card.result-correct {
  background-color: #F0FFF4;
  border: 1px solid #C6F6D5;
}

.result-card.result-wrong {
  background-color: #FFF5F5;
  border: 1px solid #FED7D7;
}

.result-header {
  margin-bottom: 12px;
}

.result-tag {
  font-size: 16px;
  font-weight: bold;
}

.result-card.result-correct .result-tag {
  color: #48BB78;
}

.result-card.result-wrong .result-tag {
  color: #FC8181;
}

.result-explanation {
  font-size: 14px;
  color: #4A4E69;
  line-height: 1.6;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.btn-submit {
  width: 100%;
  max-width: 400px;
  height: 56px;
  background-color: #FF85A1;
  color: white;
  border: none;
  border-radius: 28px;
  font-size: 18px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(255, 133, 161, 0.3);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-bottom: 16px;
  padding: 0 16px;
  box-sizing: border-box;
}

.btn-submit:active {
  transform: scale(0.98);
}

.btn-submit:disabled {
  background-color: #FCC5D3;
  box-shadow: none;
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
  text-align: center;
}

.action-btn:active {
  transform: scale(0.98);
  opacity: 0.9;
}
</style>






