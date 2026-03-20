<template>
  <view class="container">
    <!-- 自定义返回按钮 -->
    <view class="custom-nav-bar">
      <view class="nav-back-btn" @click="goBack">‹</view>
    </view>

    <!-- 单词档案卡（含来自单词本只读） -->
    <view class="word-profile-card detail-card-shell" v-if="wordId || fromWordbookMode">
      <!-- 英文单词标题 -->
      <view class="word-input-wrap word-title-row">
        <input v-if="!fromWordbookMode" type="text" v-model="word.english" placeholder="请输入英文单词" class="word-input" />
        <text v-else class="word-input word-readonly">{{ word.english }}</text>
      </view>
      
      <!-- 专业词典级释义：从 data_json.defs 渲染，横向 Flex 左词性右释义 -->
      <view class="word-chinese-inline" v-if="word.defs && word.defs.length">
        <view class="defs-list">
          <view
            v-for="(item, idx) in word.defs"
            :key="idx"
            class="def-item"
            :class="{
              'def-freq': getDefType(item) === 'freq',
              'def-rare': getDefType(item) === 'rare',
              'def-normal': getDefType(item) === 'normal'
            }"
          >
            <view class="def-pos">{{ item.pos || '' }}</view>
            <view class="def-trans">{{ item.trans || '' }}</view>
          </view>
        </view>
      </view>
      <view v-else class="word-chinese-inline">
        <textarea v-if="!fromWordbookMode"
          v-model="word.chinese"
          placeholder="请输入中文释义（包含词性）"
          rows="3"
          class="word-chinese-textarea"
        ></textarea>
        <text v-else class="word-chinese-textarea word-readonly">{{ word.chinese || '—' }}</text>
      </view>
      <view v-if="word.exam_tip" class="exam-tip-box">
        <view class="exam-tip-text">{{ word.exam_tip }}</view>
      </view>
      <view v-if="displayWordTags.length || sentimentLabel" class="word-tag-row">
        <text v-for="(tag, idx) in displayWordTags" :key="`tag-${idx}`" class="tag-chip-soft">{{ tag }}</text>
        <text v-if="sentimentLabel" class="tag-chip-soft sentiment-chip">{{ sentimentLabel }}</text>
      </view>
      
      <!-- 重复度和重要程度（与自用单词一致：重复度可加减，重要程度单词本只读） -->
      <view class="metadata-row">
        <div class="repeat-section">
          <label class="small-label">学习次数</label>
          <div class="repeat-controls">
            <span class="repeat-value">{{ word.repeat_count || 0 }}</span>
          </div>
        </div>
        <div class="importance-section">
          <label class="small-label">重要程度</label>
          <view class="star-rating" :class="{ readonly: fromWordbookMode }">
            <span
              v-for="star in 5"
              :key="star"
              class="importance-dot"
              :class="{ active: (word.importance || 0) >= star }"
              @click="!fromWordbookMode && (word.importance = star)"
            >★</span>
          </view>
        </div>
      </view>
      
      <!-- 斩按钮 -->
      <view v-if="!fromWordbookMode" class="master-action-row">
        <button 
          v-if="!word.is_mastered" 
          class="btn-master" 
          @click="markAsMastered"
        >
          ⚔️ 斩掉（已熟练）
        </button>
        <button 
          v-else 
          class="btn-unmaster" 
          @click="unmarkAsMastered"
        >
          ↩️ 取消斩掉
        </button>
        <text v-if="word.is_mastered && word.mastered_at" class="mastered-time">
          已于 {{ formatMasteredTime(word.mastered_at) }} 斩掉
        </text>
      </view>
    </view>

    <!-- 添加模式的基本信息 -->
    <view v-else class="basic-info detail-card-shell">
      <view class="form-item">
        <label>英文</label>
        <input type="text" v-model="word.english" placeholder="请输入英文单词" />
      </view>
      <view class="metadata-row">
        <div class="importance-section">
          <label class="small-label">重要程度</label>
          <view class="star-rating">
            <span
              v-for="star in 5"
              :key="star"
              class="importance-dot"
              :class="{ active: word.importance >= star }"
              @click="word.importance = star"
            >★</span>
          </view>
        </div>
      </view>
    </view>

    <!-- 来源：页码、年份 同一行（单词本只读不显示） -->
    <view v-if="!fromWordbookMode" class="page-year-section one-line">
      <text class="source-caption-inline">来源</text>
      <view class="page-info">
        <text class="page-year-label">页码</text>
        <view class="page-year-input-wrap"><input type="text" v-model="word.source_page" placeholder="P." class="page-year-input" /></view>
      </view>
      <view class="year-info">
        <text class="page-year-label">年份</text>
        <view class="page-year-input-wrap"><input type="text" v-model="word.year" placeholder="如 2024" class="page-year-input" /></view>
      </view>
    </view>

    <!-- 真题统计（始终展示：加载中 / 数据 / 暂无） -->
    <view class="form-item exam-stats-block">
      <view class="soft-card-title">真题统计</view>
      <view class="exam-stats-content">
        <view v-if="detailHeavyLoading && fromWordbookMode" class="detail-placeholder-block">加载中…</view>
        <view v-else-if="examStatsLoading" class="exam-stats-row exam-stats-muted">加载中…</view>
        <template v-else-if="examStats">
          <view class="exam-stats-row exam-stats-row-primary">
            <text class="exam-stats-num">{{ examStats.total_count }}</text>
            <text class="exam-stats-unit">次</text>
          </view>
          <view v-if="examStatsYears" class="exam-stats-row exam-stats-years-row">
            <text class="exam-stats-years">{{ examStatsYears }}</text>
          </view>
          <view class="exam-stats-row"><text class="exam-stats-detail">{{ examStatsBySection }}</text></view>
        </template>
        <view v-else class="exam-stats-row exam-stats-muted">
          该词暂无真题数据
          <text class="exam-stats-retry" @click="retryLoadExamStats">重试加载</text>
        </view>
      </view>
    </view>

    <!-- 真题出处：与例句、同义词同结构的展示 -->
    <view class="form-item detail-section-plain exam-sentences-plain">
      <view class="soft-card-title">真题出处</view>
      <view class="example-container">
        <view v-if="detailHeavyLoading && fromWordbookMode" class="detail-placeholder-block">加载中…</view>
        <view v-else-if="examSentencesLoading" class="no-examples">加载中…</view>
        <template v-else-if="displayExamSentences.length > 0">
          <view class="examples-list">
            <view v-for="(item, idx) in displayExamSentences" :key="idx" class="example-item">
              <view class="exam-sentence-meta">{{ item.year }}年 · {{ item.exam_type }} · {{ item.section }}</view>
              <p class="example-english"><rich-text :nodes="formatHighlight(item.sentence)"></rich-text></p>
            </view>
          </view>
          <view v-if="examSentences.length > 3 && !showAllExamSentences" class="center-action-row">
            <button class="btn-solid btn-inline-action btn-inline-standalone" @click="showAllExamSentences = true">
              查看全部 {{ examSentences.length }} 条
            </button>
          </view>
        </template>
        <p v-else class="no-examples">暂无真题句子</p>
      </view>
    </view>

    <view v-if="displayExamSentences.length > 0 && word.defs && word.defs.length > 0" class="form-item">
      <view class="soft-card-title">真题练一练</view>
      <view class="example-container">
        <view class="exam-train-card">
          <p class="example-english"><rich-text :nodes="formatHighlight(examQuizSentence)"></rich-text></p>
          <p class="example-chinese exam-train-tip">判断这句更接近哪个义项</p>
          <view class="exam-train-options">
            <view
              v-for="(item, idx) in word.defs.slice(0, 4)"
              :key="`quiz-${idx}`"
              class="exam-train-option"
              :class="{ active: examQuizSelected === idx }"
              @click="selectExamQuiz(idx)"
            >
              <text class="exam-train-option-label">{{ getDefTypeLabel(item) || '常用义' }}</text>
              <text class="exam-train-option-text">{{ item.pos || '' }} {{ item.trans || '' }}</text>
            </view>
          </view>
          <view v-if="examQuizSelected !== null" class="exam-train-result">
            推荐义项：{{ examQuizAnswerText }}
          </view>
        </view>
      </view>
    </view>

    <!-- 例句（单词本只读也展示内容，仅隐藏重新生成按钮） -->
    <view class="form-item">
      <view class="section-header">
        <view class="soft-card-title">例句</view>
      </view>
      <view class="example-container">
        <view v-if="detailHeavyLoading && fromWordbookMode" class="detail-placeholder-block">加载中…</view>
        <view v-else-if="word.examples && word.examples.length > 0" class="examples-list">
          <view v-for="(item, index) in word.examples" :key="index" class="example-item">
            <p class="example-english"><rich-text :nodes="formatHighlight(item.english)"></rich-text></p>
            <p class="example-chinese"><rich-text :nodes="formatHighlight(item.chinese)"></rich-text></p>
          </view>
        </view>
        <p v-else-if="!fromWordbookMode && example" class="example">{{ example }}</p>
        <p v-else class="no-examples">暂无例句</p>
      </view>
      <view class="center-action-row">
        <button @click="generateExample" class="btn-solid btn-inline-action">重新生成</button>
      </view>
    </view>

    <!-- 近义词 / 同义词（单词本只读也展示内容，仅隐藏生成按钮） -->
    <view class="form-item">
      <view class="section-header">
        <view class="soft-card-title">近义词</view>
      </view>
      <view class="example-container">
        <view v-if="detailHeavyLoading && fromWordbookMode" class="detail-placeholder-block">加载中…</view>
        <view v-else-if="word.synonyms && word.synonyms.length > 0" class="examples-list">
          <view v-for="(item, index) in word.synonyms" :key="index" class="example-item synonym-item">
            <view class="synonym-header">
              <span class="synonym-word">{{ item.synonym }}</span>
              <span class="synonym-chinese">{{ item.chinese }}</span>
            </view>
            <p v-if="item.example" class="example-english"><rich-text :nodes="formatHighlight(item.example)"></rich-text></p>
            <p v-if="item.exampleChinese" class="example-chinese"><rich-text :nodes="formatHighlight(item.exampleChinese)"></rich-text></p>
          </view>
        </view>
        <p v-else class="no-examples">暂无近义词</p>
      </view>
      <view class="center-action-row">
        <button @click="generateSynonyms" class="btn-solid btn-inline-action" :disabled="synonymLoading">
          {{ synonymLoading ? '生成中...' : '重新生成' }}
        </button>
      </view>
      <view v-if="synonymContrastText" class="synonym-contrast-box">
        <view class="exam-tip-title">近义词辨析</view>
        <view class="exam-tip-text"><rich-text :nodes="formatHighlight(synonymContrastText)"></rich-text></view>
      </view>
      <view class="center-action-row">
        <button @click="generateSynonymContrast" class="btn-solid btn-inline-action" :disabled="synonymContrastLoading">
          {{ synonymContrastLoading ? '生成中...' : '生成辨析' }}
        </button>
      </view>
    </view>

    <!-- 反义词（单词本只读也展示内容，仅隐藏生成按钮） -->
    <view class="form-item">
      <view class="section-header">
        <view class="soft-card-title">反义词</view>
      </view>
      <view class="example-container">
        <view v-if="detailHeavyLoading && fromWordbookMode" class="detail-placeholder-block">加载中…</view>
        <view v-else-if="word.antonyms && word.antonyms.length > 0" class="examples-list">
          <view v-for="(item, index) in word.antonyms" :key="index" class="example-item antonym-item">
            <view class="synonym-header">
              <span class="synonym-word">{{ item.antonym }}</span>
              <span class="synonym-chinese">{{ item.chinese }}</span>
            </view>
            <p v-if="item.example" class="example-english"><rich-text :nodes="formatHighlight(item.example)"></rich-text></p>
            <p v-if="item.exampleChinese" class="example-chinese"><rich-text :nodes="formatHighlight(item.exampleChinese)"></rich-text></p>
          </view>
        </view>
        <p v-else class="no-examples">暂无反义词</p>
      </view>
      <view class="center-action-row">
        <button @click="generateAntonyms" class="btn-solid btn-inline-action" :disabled="antonymLoading">
          {{ antonymLoading ? '生成中...' : '重新生成' }}
        </button>
      </view>
    </view>

    <view class="form-item">
      <view class="soft-card-title">词族与搭配</view>
      <view class="example-container">
        <view v-if="wordFamily.derivatives.length > 0" class="examples-list">
          <view v-for="(item, index) in wordFamily.derivatives" :key="`der-${index}`" class="example-item synonym-item">
            <view class="synonym-header">
              <span class="synonym-word">{{ item.word }}</span>
              <span class="synonym-chinese">{{ item.chinese }}</span>
            </view>
            <p v-if="item.hint" class="example-chinese">{{ item.hint }}</p>
          </view>
        </view>
        <p v-else class="no-examples">暂无词族数据</p>
        <view v-if="wordFamily.collocations.length > 0" class="collocation-wrap">
          <text v-for="(item, idx) in wordFamily.collocations" :key="`col-${idx}`" class="collocation-chip">
            {{ item.phrase }} · {{ item.chinese }}
          </text>
        </view>
        <p v-if="wordFamily.memory_tip" class="example-chinese">{{ wordFamily.memory_tip }}</p>
      </view>
      <view class="center-action-row">
        <button @click="generateWordFamilyInfo" class="btn-solid btn-inline-action" :disabled="wordFamilyLoading">
          {{ wordFamilyLoading ? '生成中...' : '生成词族/搭配' }}
        </button>
      </view>
    </view>

    <!-- 同标签单词 -->
    <view v-if="wordId && sameTagWords.length > 0" class="form-item same-tag-section">
      <label>相关词</label>
      <view class="same-tag-list">
        <view v-for="w in sameTagWords" :key="w.id" class="same-tag-item" @click="goToWord(w.id)">
          <text class="same-tag-eng">{{ w.english }}</text>
          <text class="same-tag-chi">{{ w.chinese }}</text>
        </view>
      </view>
    </view>

    <!-- 底部操作栏（单词本只读仅取消） -->
    <view class="footer">
      <button v-if="wordId && !fromWordbookMode" @click="deleteWord" class="delete-button">删除</button>
      <button @click="cancel" class="cancel-button">取消</button>
      <button v-if="!fromWordbookMode" @click="save" class="save-button">保存</button>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, watch, computed } from "vue";
import { onLoad, onUnload } from "@dcloudio/uni-app";
import db from '../../src/utils/db_v2';
import aiService from '../../src/utils/aiService.js';
import { formatWordStatsForPrompt } from '../../src/utils/wordStats.js';
import * as pregenVocab from '../../src/utils/pregenVocab.js';
import * as masterDb from '../../src/utils/masterDb.js';
import { getWordExtra, saveWordExtra } from '../../src/utils/learningCenter_v2.js';
import { logger, errorHandler } from '../../src/utils/errorHandler.js';
import { cleanupExpiredCaches } from '../../src/utils/learningCenter_v2.js';

const word = ref({
  english: '',
  chinese: '',
  tags: '',
  source_page: '',
  year: '',
  importance: 3, // 默认三星
  error_rate: 0,
  review_frequency: 0,
  repeat_count: 1,
  examples: [],
  synonyms: [],
  antonyms: [],
  defs: [],
  exam_tip: '',
  sentiment: 'neu',
});

// 词性缩写：支持英文点、全角点、中文句号；(?<!\n) 避免在已有换行前重复插入
const POS_BREAK_REGEX = /(?<!\n)(vi[.\．。]|vt[.\．。]|adj[.\．。]|adv[.\．。]|prep[.\．。]|conj[.\．。]|pron[.\．。]|num[.\．。]|int[.\．。]|aux[.\．。]|art[.\．。]|[nva][.\．。])/gi;

function addNewlineBeforePos(chineseText) {
  if (!chineseText || typeof chineseText !== 'string') return chineseText;
  const s = chineseText.replace(POS_BREAK_REGEX, '\n$1');
  return s.replace(/^\n/, '');
}

watch(() => word.value.chinese, (newValue) => {
  if (newValue) {
    let processedValue = addNewlineBeforePos(newValue);
    if (processedValue !== newValue) {
      word.value.chinese = processedValue;
    }
  }
});

const example = ref('');
const synonymLoading = ref(false);
const synonymContrastLoading = ref(false);
const antonymLoading = ref(false);
const synonymContrastText = ref('');
const wordFamilyLoading = ref(false);
const wordFamily = ref({ derivatives: [], collocations: [], memory_tip: '' });
const sameTagWords = ref([]);
const wordId = ref('');
const fromWordbookMode = ref(false);
const examStats = ref(null);
const examStatsTags = ref([]);
const examStatsLoading = ref(false);
const examSentences = ref([]);
const examSentencesLoading = ref(false);
const showAllExamSentences = ref(false);
/** 单词本入口时，重型数据（例句/真题）是否仍在从 masterDb 加载 */
const detailHeavyLoading = ref(false);
let examFallbackTimer = null;

function clearExamFallbackTimer() {
  if (examFallbackTimer) {
    clearTimeout(examFallbackTimer);
    examFallbackTimer = null;
  }
}

function scheduleExamDataFallback(english, currentWordId, delay = 180) {
  clearExamFallbackTimer();
  examFallbackTimer = setTimeout(() => {
    examFallbackTimer = null;
    loadExamDataLazy(english, currentWordId);
  }, delay);
}

const SECTION_ORDER = ['完形', '阅读', '新题型', '翻译', '写作', '完整试卷', '未分类'];
const examStatsBySection = computed(() => {
  if (!examStats.value || !examStats.value.by_section) return '-';
  const by = examStats.value.by_section;
  return SECTION_ORDER.filter(s => (by[s] || 0) > 0).map(s => `${s}${by[s]}次`).join('；') || '-';
});
const examStatsYears = computed(() => {
  if (!examStats.value || !Array.isArray(examStats.value.years) || !examStats.value.years.length) return '';
  return examStats.value.years.join('、');
});

const displayExamSentences = computed(() => {
  const list = examSentences.value || [];
  if (showAllExamSentences.value) return list;
  return list.slice(0, 3);
});

const displayWordTags = computed(() => {
  const tags = (word.value.tags || '').split(/[,，\s]+/).map((item) => item.trim()).filter(Boolean);
  return [...new Set(tags)];
});

const sentimentLabel = computed(() => {
  const map = { pos: '褒义色彩', neg: '贬义色彩', neu: '' };
  return map[word.value.sentiment] || '';
});

const examQuizSelected = ref(null);
const examQuizSentence = computed(() => {
  const sentence = (displayExamSentences.value[0] && displayExamSentences.value[0].sentence) || '';
  if (!sentence || !word.value.english) return sentence;
  return sentence.replace(new RegExp(`\\b${escapeRegExp(word.value.english)}\\b`, 'gi'), '____');
});
const examQuizAnswerIndex = computed(() => {
  const defs = Array.isArray(word.value.defs) ? word.value.defs : [];
  const freqIndex = defs.findIndex((item) => getDefType(item) === 'freq');
  if (freqIndex >= 0) return freqIndex;
  const rareIndex = defs.findIndex((item) => getDefType(item) === 'rare');
  if (rareIndex >= 0) return rareIndex;
  return defs.length ? 0 : -1;
});
const examQuizAnswerText = computed(() => {
  const defs = Array.isArray(word.value.defs) ? word.value.defs : [];
  const answer = defs[examQuizAnswerIndex.value];
  if (!answer) return '暂无可推荐义项';
  return `${getDefTypeLabel(answer) || '推荐义项'} · ${answer.pos || ''} ${answer.trans || ''}`;
});

const loadExtraPanels = () => {
  const extra = getWordExtra(word.value.english);
  synonymContrastText.value = extra.synonymContrastText || '';
  wordFamily.value = {
    derivatives: Array.isArray(extra.wordFamily?.derivatives) ? extra.wordFamily.derivatives : [],
    collocations: Array.isArray(extra.wordFamily?.collocations) ? extra.wordFamily.collocations : [],
    memory_tip: extra.wordFamily?.memory_tip || '',
  };
};

const loadWordFromMasterDb = async (english) => {
  if (!english) return;
  
  word.value = {
    english: english,
    chinese: '加载中…',
    tags: '',
    source_page: '',
    year: '',
    importance: 0,
    error_rate: 0,
    review_frequency: 0,
    repeat_count: 0,
    examples: [],
    synonyms: [],
    antonyms: [],
    defs: [],
    exam_tip: '',
    sentiment: 'neu',
  };
  
  detailHeavyLoading.value = true;
  examStatsLoading.value = true;
  examSentencesLoading.value = true;
  
  try {
    const detail = await masterDb.getWordFullDetail(english);
    if (!detail || word.value.english !== english) return;
    
    const wordDefs = Array.isArray(detail.defs) ? detail.defs : [];
    const examples = Array.isArray(detail.examples) ? detail.examples : [];
    const synonyms = Array.isArray(detail.synonyms) ? detail.synonyms : [];
    const antonyms = Array.isArray(detail.antonyms) ? detail.antonyms : [];
    const examTip = detail.exam_tip || '';
    const wordSentiment = detail.sentiment || 'neu';
    
    word.value = {
      ...word.value,
      chinese: detail.chinese || '',
      examples,
      synonyms,
      antonyms,
      importance: (detail.examStats && detail.examStats.importance != null) ? detail.examStats.importance : 0,
      defs: wordDefs,
      exam_tip: examTip,
      sentiment: wordSentiment,
    };
    
    if (detail.examStats) {
      examStats.value = detail.examStats;
      examStatsTags.value = Array.isArray(detail.examStats.tags) ? detail.examStats.tags : [];
      if (examStatsTags.value.length > 0) word.value = { ...word.value, tags: examStatsTags.value.join(',') };
    }
    
    examSentences.value = Array.isArray(detail.examSentences) ? detail.examSentences : [];
    
  } catch (e) {
    console.error('[详情页-masterdb] 加载失败:', e);
    word.value.chinese = '';
  } finally {
    detailHeavyLoading.value = false;
    examStatsLoading.value = false;
    examSentencesLoading.value = false;
  }
};

const normalizeDefType = (rawType) => {
  const value = String(rawType || '').trim().toLowerCase();
  if (!value) return 'normal';
  if ([
    'freq',
    'important',
    'important_meaning',
    'importantmeaning',
    '重点',
    '重点义',
    '重要',
    '重要义',
    '重要意思',
    '常考',
    '高频'
  ].includes(value)) {
    return 'freq';
  }
  if ([
    'rare',
    'rare_meaning',
    'raremeaning',
    '僻义',
    '熟词僻义',
    '熟词生义',
    '生义'
  ].includes(value)) {
    return 'rare';
  }
  return 'normal';
};

const getDefType = (item) => normalizeDefType(item?.type);

const getDefTypeLabel = (item) => {
  const type = getDefType(item);
  if (type === 'freq') return '重要义';
  if (type === 'rare') return '熟词僻义';
  return '';
};

const getLastWordInfo = async () => {
  const lastWord = await db.getLastWord();
  if (lastWord) {
    word.value.source_page = lastWord.source_page || '';
    word.value.year = lastWord.year || '';
  }
};

/** 真题模块轻查询：统一从主库读取，不再依赖大 JSON。 */
function loadExamDataLazy(english, currentWordId) {
  const isSelf = currentWordId != null;
  const guard = () => (isSelf ? word.value?.id !== currentWordId : word.value?.english !== english);
  examStatsLoading.value = true;
  examSentencesLoading.value = true;
  showAllExamSentences.value = false;
  masterDb.getWordExamData(english)
    .then((data) => {
      if (guard()) return;
      const stats = data?.examStats || null;
      const list = data?.examSentences || [];
      if (guard()) return;
      if (stats) {
        examStats.value = stats;
        examStatsTags.value = Array.isArray(stats.tags) ? stats.tags : [];
        word.value = { ...word.value, importance: typeof stats.importance === 'number' ? stats.importance : 0 };
        if (examStatsTags.value.length > 0) word.value = { ...word.value, tags: examStatsTags.value.join(',') };
      } else {
        examStats.value = null;
        examStatsTags.value = [];
        if (isSelf) word.value = { ...word.value, importance: 0 };
      }
      examSentences.value = Array.isArray(list) ? list : [];
    })
    .catch(() => {
      examStats.value = null;
      examSentences.value = [];
    })
    .finally(() => {
      examStatsLoading.value = false;
      examSentencesLoading.value = false;
    });
}

/** 单词本入口：第一阶段同步展示英文与框架，第二阶段异步 getWordFullDetail 补全 */
const loadWordFromWordbook = (english) => {
  fromWordbookMode.value = true;
  detailHeavyLoading.value = true;
  showAllExamSentences.value = false;
  examStatsLoading.value = true;
  examSentencesLoading.value = true;
  word.value = {
    ...word.value,
    english,
    chinese: '加载中…',
    importance: 0,
    examples: [],
    synonyms: [],
    antonyms: [],
    defs: [],
    exam_tip: '',
    sentiment: 'neu',
  };
  loadExtraPanels();

  masterDb.getWordFullDetail(english).then((detail) => {
    console.log('[详情页] getWordFullDetail 回调执行, detail=', detail ? '有数据' : 'null');
    detailHeavyLoading.value = false;
    examStatsLoading.value = false;
    examSentencesLoading.value = false;
    if (word.value.english !== english) return;
    if (detail) {
      let examples = Array.isArray(detail.examples) ? detail.examples : [];
      let synonyms = Array.isArray(detail.synonyms) ? detail.synonyms : [];
      let antonyms = Array.isArray(detail.antonyms) ? detail.antonyms : [];
      // 直接用 parseCoreRow 已 normalize 的字段，type 已统一为 freq/rare/normal
      let wordDefs = Array.isArray(detail.defs) && detail.defs.length ? detail.defs : [];
      let examTip = typeof detail.exam_tip === 'string' ? detail.exam_tip : '';
      let wordSentiment = (detail.sentiment === 'pos' || detail.sentiment === 'neg' || detail.sentiment === 'neu') ? detail.sentiment : 'neu';
      // 仅当 detail.defs 为空时才尝试从 data_json 补全
      if (!wordDefs.length && detail.data_json != null) {
        try {
          const rawData = typeof detail.data_json === 'string' ? JSON.parse(detail.data_json || '{}') : (detail.data_json || {});
          if (Array.isArray(rawData.defs) && rawData.defs.length) wordDefs = rawData.defs;
          if (!examTip && typeof rawData.exam_tip === 'string') examTip = rawData.exam_tip;
          if (wordSentiment === 'neu' && (rawData.sentiment === 'pos' || rawData.sentiment === 'neg')) wordSentiment = rawData.sentiment;
        } catch (_) {}
      }
      word.value = {
        ...word.value,
        chinese: detail.chinese || word.value.chinese,
        examples,
        synonyms,
        antonyms,
        importance: (detail.examStats && detail.examStats.importance != null) ? detail.examStats.importance : 0,
        defs: wordDefs,
        exam_tip: examTip,
        sentiment: wordSentiment,
      };
      if (word.value.chinese === '加载中…') word.value = { ...word.value, chinese: detail.chinese || '' };
      examStats.value = detail.examStats;
      examSentences.value = Array.isArray(detail.examSentences) ? detail.examSentences : [];
      examStatsTags.value = (detail.examStats && Array.isArray(detail.examStats.tags)) ? detail.examStats.tags : [];
      if (examStatsTags.value.length > 0) word.value = { ...word.value, tags: examStatsTags.value.join(',') };
      console.log('[详情页] 已赋值 examples.length=', examples.length);
      // 主库可能只含真题数据、不含例句/近义/反义，用 pregen_data.db 补全
      const needPregen = examples.length === 0 && synonyms.length === 0 && antonyms.length === 0;
      if (needPregen) {
        pregenVocab.getPregenWord(english).then((pregen) => {
          if (word.value.english !== english) return;
          if (pregen && ((Array.isArray(pregen.examples) && pregen.examples.length > 0) || (Array.isArray(pregen.synonyms) && pregen.synonyms.length > 0) || (Array.isArray(pregen.antonyms) && pregen.antonyms.length > 0))) {
            const ex = Array.isArray(pregen.examples) && pregen.examples.length > 0 ? pregen.examples : word.value.examples;
            const sy = Array.isArray(pregen.synonyms) && pregen.synonyms.length > 0 ? pregen.synonyms : word.value.synonyms;
            const an = Array.isArray(pregen.antonyms) && pregen.antonyms.length > 0 ? pregen.antonyms : word.value.antonyms;
            word.value = { ...word.value, examples: ex, synonyms: sy, antonyms: an };
            if (!word.value.chinese && pregen.chinese) word.value = { ...word.value, chinese: pregen.chinese };
            console.log('[详情页] 已从 pregen 补全 例句/近义/反义');
          }
        });
      }
    } else {
      if (word.value.chinese === '加载中…') word.value = { ...word.value, chinese: '' };
      examStats.value = null;
      examSentences.value = [];
      // 主库无该词时仍用 pregen 补全释义与例句/近义/反义
      pregenVocab.getPregenWord(english).then((pregen) => {
        if (word.value.english !== english || !pregen) return;
        const ex = Array.isArray(pregen.examples) ? pregen.examples : [];
        const sy = Array.isArray(pregen.synonyms) ? pregen.synonyms : [];
        const an = Array.isArray(pregen.antonyms) ? pregen.antonyms : [];
        word.value = {
          ...word.value,
          chinese: (pregen.chinese || word.value.chinese || '').trim() || word.value.chinese,
          examples: ex,
          synonyms: sy,
          antonyms: an,
        };
        if (ex.length || sy.length || an.length) console.log('[详情页] 已从 pregen 补全(主库无该词)');
      });
    }
  }).catch((e) => {
    console.error('[详情页] getWordFullDetail catch', e);
    detailHeavyLoading.value = false;
    examStatsLoading.value = false;
    examSentencesLoading.value = false;
    if (word.value.chinese === '加载中…') word.value = { ...word.value, chinese: '' };
  });
};

const loadWord = async () => {
  const id = wordId.value;
  const t0 = Date.now();
  console.log('[详情-自用] 入口 id=', id, 't0=', t0);
  clearExamFallbackTimer();

  const tLight = Date.now();
  const result = await db.getWordByIdLight(id);
  console.log('[详情-自用] getWordByIdLight', Date.now() - tLight, 'ms');
  if (!result) return;
  if (result.chinese) result.chinese = addNewlineBeforePos(result.chinese);
  word.value = result;
  loadExtraPanels();
  db.incrementViewCount(id);
  // 自动增加学习次数
  increaseRepeatCount();

  const tSameTag = Date.now();
  loadSameTagWords();
  console.log('[详情-自用] loadSameTagWords 已触发(未await)', Date.now() - tSameTag, 'ms');

  const english = result.english;
  showAllExamSentences.value = false;
  examStatsLoading.value = true;
  examSentencesLoading.value = true;
  examStats.value = null;
  examStatsTags.value = [];
  examSentences.value = [];

  const tHeavy = Date.now();
  db.getWordByIdHeavy(id).then((heavy) => {
    console.log('[详情-自用] getWordByIdHeavy', Date.now() - tHeavy, 'ms');
    if (!heavy || word.value?.id !== id) return;
    word.value = {
      ...word.value,
      examples: heavy.examples || [],
      synonyms: heavy.synonyms || [],
      antonyms: heavy.antonyms || [],
    };
    console.log('[详情-自用] 重型字段补全完成', Date.now() - t0, 'ms');
  });

  // 本地优先：若本地缺失释义/重型字段，则用主库/预生成库兜底补全
  masterDb.getWordFullDetail(english).then((detail) => {
    if (word.value?.id !== id) return;
    if (!detail) {
      scheduleExamDataFallback(english, id);
      return;
    }
    const needChinese = !(word.value.chinese || '').trim();
    const needExamples = !Array.isArray(word.value.examples) || word.value.examples.length === 0;
    const needSynonyms = !Array.isArray(word.value.synonyms) || word.value.synonyms.length === 0;
    const needAntonyms = !Array.isArray(word.value.antonyms) || word.value.antonyms.length === 0;
    const detailExamStats = detail.examStats && typeof detail.examStats === 'object' ? detail.examStats : null;
    const detailExamSentences = Array.isArray(detail.examSentences) ? detail.examSentences : [];
    const detailDefs = Array.isArray(detail.defs) ? detail.defs : [];
    const detailExamTip = typeof detail.exam_tip === 'string' ? detail.exam_tip : '';
    const detailSentiment = (detail.sentiment === 'pos' || detail.sentiment === 'neg' || detail.sentiment === 'neu') ? detail.sentiment : word.value.sentiment;
    const hasExamStats = !!detailExamStats;
    const hasExamSentences = detailExamSentences.length > 0;
    if (!needChinese && !needExamples && !needSynonyms && !needAntonyms && hasExamStats && hasExamSentences) {
      word.value = {
        ...word.value,
        chinese: (detail.chinese || '').trim() || word.value.chinese,
        defs: detailDefs,
        exam_tip: detailExamTip,
        sentiment: detailSentiment,
      };
      examStats.value = detailExamStats;
      examSentences.value = detailExamSentences;
      examStatsTags.value = Array.isArray(detailExamStats.tags) ? detailExamStats.tags : [];
      examStatsLoading.value = false;
      examSentencesLoading.value = false;
      return;
    }
    word.value = {
      ...word.value,
      chinese: (detail.chinese || '').trim() || word.value.chinese,
      examples: needExamples ? (detail.examples || []) : word.value.examples,
      synonyms: needSynonyms ? (detail.synonyms || []) : word.value.synonyms,
      antonyms: needAntonyms ? (detail.antonyms || []) : word.value.antonyms,
      defs: detailDefs.length ? detailDefs : word.value.defs,
      exam_tip: detailExamTip || word.value.exam_tip,
      sentiment: detailSentiment,
    };
    if (hasExamStats) {
      examStats.value = detailExamStats;
      examStatsTags.value = Array.isArray(detailExamStats.tags) ? detailExamStats.tags : [];
      word.value.importance = typeof detailExamStats.importance === 'number' ? detailExamStats.importance : 0;
      if (examStatsTags.value.length > 0) word.value.tags = examStatsTags.value.join(',');
    } else {
      examStats.value = null;
      examStatsTags.value = [];
    }
    if (hasExamSentences) examSentences.value = detailExamSentences;
    else examSentences.value = [];
    examStatsLoading.value = !hasExamStats;
    examSentencesLoading.value = !hasExamSentences;
    if (!hasExamStats || !hasExamSentences) {
      scheduleExamDataFallback(english, id);
    }
  }).catch(() => {
    scheduleExamDataFallback(english, id);
  });

  pregenVocab.getPregenWord(english).then((pre) => {
    if (!pre || word.value?.id !== id) return;
    const needChinese = !(word.value.chinese || '').trim();
    const needExamples = !Array.isArray(word.value.examples) || word.value.examples.length === 0;
    const needSynonyms = !Array.isArray(word.value.synonyms) || word.value.synonyms.length === 0;
    const needAntonyms = !Array.isArray(word.value.antonyms) || word.value.antonyms.length === 0;
    if (!needChinese && !needExamples && !needSynonyms && !needAntonyms) return;
    word.value = {
      ...word.value,
      chinese: needChinese ? ((pre.chinese || '').trim() || word.value.chinese) : word.value.chinese,
      examples: needExamples ? (pre.examples || []) : word.value.examples,
      synonyms: needSynonyms ? (pre.synonyms || []) : word.value.synonyms,
      antonyms: needAntonyms ? (pre.antonyms || []) : word.value.antonyms,
    };
  }).catch(() => {});
}

const retryLoadExamStats = async () => {
  if (!word.value || !word.value.english) return;
  examStatsLoading.value = true;
  examSentencesLoading.value = true;
  try {
    const data = await masterDb.getWordExamData(word.value.english);
    const stats = data?.examStats || null;
    if (stats) {
      examStats.value = stats;
      examStatsTags.value = Array.isArray(stats.tags) ? stats.tags : [];
      word.value.importance = typeof stats.importance === 'number' ? stats.importance : 0;
      if (examStatsTags.value.length > 0) {
        word.value.tags = examStatsTags.value.join(',');
      }
    } else {
      examStats.value = null;
      examStatsTags.value = [];
      word.value.importance = 0; // 无真题数据 → 零星
    }
    examSentences.value = Array.isArray(data?.examSentences) ? data.examSentences : [];
  } catch (e) {
    examStats.value = null;
    examStatsTags.value = [];
    examSentences.value = [];
  } finally {
    examStatsLoading.value = false;
    examSentencesLoading.value = false;
  }
};

const loadSameTagWords = async () => {
  const tags = (word.value.tags || '').split(/[,，\s]+/).map(t => t.trim()).filter(Boolean);
  if (tags.length === 0) {
    sameTagWords.value = [];
    return;
  }
  sameTagWords.value = await db.getWordsByTag(tags[0], wordId.value);
};

const goToWord = (id) => {
  uni.navigateTo({ url: `/pages/word-detail/word-detail?id=${id}` });
};

const selectExamQuiz = (idx) => {
  examQuizSelected.value = idx;
};

const goBack = () => {
  uni.navigateBack();
};

const applyTag = (tag) => {
  const cur = (word.value.tags || '').trim();
  const list = cur ? cur.split(/[,，\s]+/).map(t => t.trim()).filter(Boolean) : [];
  if (list.includes(tag)) return;
  word.value.tags = list.concat(tag).join(',');
};

// 使用 onLoad 获取页面参数
onLoad((options) => {
  console.log('onLoad 获取到的参数:', options);
  if (options && options.id) {
    wordId.value = options.id;
    loadWord();
  } else if (options && options.english && options.source === 'masterdb') {
    // 从复习页面跳转来，显示红宝书补全版的详情
    wordId.value = '';
    fromWordbookMode.value = true;
    loadWordFromMasterDb(decodeURIComponent(options.english));
  } else if (options && options.english && options.fromWordbook === '1') {
    wordId.value = '';
    loadWordFromWordbook(decodeURIComponent(options.english));
  } else {
    getLastWordInfo();
  }
});

onMounted(() => {
  // loadWord 已在 onLoad 中调用，此处只注册事件，避免重复加载
  uni.$on('wordEnriched', onWordEnriched);
});

const onWordEnriched = (id) => {
  if (id && wordId.value === id) loadWord();
};

onUnload(() => {
  uni.$off('wordEnriched', onWordEnriched);
  clearExamFallbackTimer();

  // 清理过期缓存
  try {
    cleanupExpiredCaches();
  } catch (error) {
    logger.warn('WordDetail', '清理缓存失败', error);
  }
});

const save = async () => {
  if (!word.value.english || !word.value.chinese) {
    uni.showToast({
      title: "请填写英文和中文",
      duration: 2000
    });
    return;
  }
  
  if (wordId.value) {
    await db.updateWord(wordId.value, word.value);
  } else {
    await db.addWord(word.value);
  }
  
  uni.showToast({
    title: wordId.value ? '更新成功' : '添加成功',
    duration: 2000
  });
  uni.navigateBack();
};

const cancel = () => {
  uni.navigateBack();
};

const deleteWord = async () => {
  uni.showModal({
    title: '确认删除',
    content: '确定要删除这个单词吗？',
    success: async (res) => {
      if (res.confirm) {
        await db.deleteWord(wordId.value);
        uni.showToast({
          title: '删除成功',
          duration: 2000
        });
        uni.navigateBack();
      }
    }
  });
};

const editWord = () => {
  // 编辑功能，这里可以添加编辑逻辑
  uni.showToast({
    title: '编辑模式',
    duration: 1000
  });
};

const generateExample = async () => {
  if (!word.value.english) {
    uni.showToast({
      title: "请输入英文单词",
      duration: 2000
    });
    return;
  }

  try {
    const pregen = await pregenVocab.getPregenWord(word.value.english);
    if (pregen && Array.isArray(pregen.examples) && pregen.examples.length > 0) {
      word.value.examples = pregen.examples;
      if (wordId.value) {
        await db.updateWord(wordId.value, { examples: pregen.examples });
      }
      uni.showToast({ title: '已从本地词库加载例句', duration: 2000 });
      return;
    }

    // 用轻量分页查询替代全量 getWords()，只取英文字段
    const words = await db.getWordsForList(10, 0, 'create_time', 'desc', {});
    const existingWords = words
      .filter(w => w.english !== word.value.english)
      .map(w => w.english)
      .slice(0, 10);

    example.value = '生成中...';
    let examText = '';
    try {
      const examData = await masterDb.getWordExamData(word.value.english);
      if (examData?.examStats) examText = formatWordStatsForPrompt(examData.examStats);
    } catch (_) {}
    const examples = await aiService.generateMultipleExamples(word.value.english, existingWords, 3, examText);
    word.value.examples = examples;
    example.value = '';
    
    // 如果是编辑模式，更新数据库
    if (wordId.value) {
      await db.updateWord(wordId.value, { examples: examples });
      uni.showToast({
        title: '例句已更新',
        duration: 2000
      });
    } else {
      uni.showToast({
        title: '例句已生成',
        duration: 2000
      });
    }
  } catch (error) {
    console.error('生成例句失败:', error);
    example.value = '生成例句失败，请重试';
  }
};

const generateSynonyms = async () => {
  if (!word.value.english) {
    uni.showToast({
      title: "请输入英文单词",
      duration: 2000
    });
    return;
  }

  try {
    synonymLoading.value = true;
    const pregen = await pregenVocab.getPregenWord(word.value.english);
    if (pregen && Array.isArray(pregen.synonyms) && pregen.synonyms.length > 0) {
      word.value.synonyms = pregen.synonyms;
      if (wordId.value) {
        await db.updateWord(wordId.value, { synonyms: pregen.synonyms });
      }
      uni.showToast({ title: '已从本地词库加载近义词', duration: 2000 });
      return;
    }

    // 用轻量分页查询替代全量 getWords()
    const words = await db.getWordsForList(10, 0, 'create_time', 'desc', {});
    const existingWords = words
      .filter(w => w.english !== word.value.english)
      .map(w => w.english)
      .slice(0, 10);

    const synonyms = await aiService.generateSynonyms(word.value.english, existingWords, 3);
    word.value.synonyms = synonyms;
    
    if (wordId.value) {
      await db.updateWord(wordId.value, { synonyms: synonyms });
      uni.showToast({
        title: '近义词已更新',
        duration: 2000
      });
    } else {
      uni.showToast({
        title: '近义词已生成',
        duration: 2000
      });
    }
  } catch (error) {
    console.error('生成近义词失败:', error);
    uni.showToast({
      title: '生成近义词失败，请重试',
      duration: 2000
    });
  } finally {
    synonymLoading.value = false;
  }
};

const generateSynonymContrast = async () => {
  if (!word.value.english) return;
  try {
    synonymContrastLoading.value = true;
    const text = await aiService.generateSynonymContrast(word.value.english, word.value.synonyms || []);
    synonymContrastText.value = text || '';
    saveWordExtra(word.value.english, { synonymContrastText: synonymContrastText.value });
    if (synonymContrastText.value) {
      uni.showToast({ title: '辨析已生成', icon: 'none' });
    }
  } catch (_) {
    uni.showToast({ title: '生成辨析失败', icon: 'none' });
  } finally {
    synonymContrastLoading.value = false;
  }
};

const generateAntonyms = async () => {
  if (!word.value.english) {
    uni.showToast({ title: '请输入英文单词', duration: 2000 });
    return;
  }
  try {
    antonymLoading.value = true;
    const pregen = await pregenVocab.getPregenWord(word.value.english);
    if (pregen && Array.isArray(pregen.antonyms) && pregen.antonyms.length > 0) {
      word.value.antonyms = pregen.antonyms;
      if (wordId.value) {
        await db.updateWord(wordId.value, { antonyms: pregen.antonyms });
      }
      uni.showToast({ title: '已从本地词库加载反义词', duration: 2000 });
      return;
    }
    const antonyms = await aiService.generateAntonyms(word.value.english, 3);
    word.value.antonyms = antonyms;
    if (wordId.value) {
      await db.updateWord(wordId.value, { antonyms: antonyms });
      uni.showToast({ title: '反义词已更新', duration: 2000 });
    } else {
      uni.showToast({ title: '反义词已生成', duration: 2000 });
    }
  } catch (error) {
    console.error('生成反义词失败:', error);
    uni.showToast({ title: '生成反义词失败', duration: 2000 });
  } finally {
    antonymLoading.value = false;
  }
};

const generateWordFamilyInfo = async () => {
  if (!word.value.english) return;
  try {
    wordFamilyLoading.value = true;
    const result = await aiService.generateWordFamily(word.value.english);
    wordFamily.value = {
      derivatives: Array.isArray(result.derivatives) ? result.derivatives : [],
      collocations: Array.isArray(result.collocations) ? result.collocations : [],
      memory_tip: result.memory_tip || '',
    };
    saveWordExtra(word.value.english, { wordFamily: wordFamily.value });
    uni.showToast({ title: '词族已生成', icon: 'none' });
  } catch (_) {
    uni.showToast({ title: '生成词族失败', icon: 'none' });
  } finally {
    wordFamilyLoading.value = false;
  }
};

const increaseRepeatCount = async () => {
  // 自动增加学习次数，每次查看单词详情时调用
  word.value.repeat_count = (word.value.repeat_count || 0) + 1;
  word.value.update_time = new Date().toISOString();
  if (wordId.value) {
    await db.updateWord(wordId.value, {
      repeat_count: word.value.repeat_count,
      update_time: word.value.update_time
    });
  }
};

const decreaseRepeatCount = async () => {
  // 已废弃，保留空函数以防兼容性问题
};

const updateRepeatCount = async () => {
  // 已废弃，保留空函数以防兼容性问题
};

// 斩掉单词（标记为已熟练）
const markAsMastered = async () => {
  if (!wordId.value) {
    uni.showToast({ title: '请先保存单词', icon: 'none' });
    return;
  }
  
  word.value.is_mastered = 1;
  word.value.mastered_at = new Date().toISOString();
  
  await db.updateWord(wordId.value, {
    is_mastered: 1,
    mastered_at: word.value.mastered_at
  });
  
  uni.showToast({ title: '已斩掉！该单词将在复习中隐藏', icon: 'success' });
};

// 取消斩掉
const unmarkAsMastered = async () => {
  if (!wordId.value) return;
  
  word.value.is_mastered = 0;
  word.value.mastered_at = null;
  
  await db.updateWord(wordId.value, {
    is_mastered: 0,
    mastered_at: null
  });
  
  uni.showToast({ title: '已取消斩掉', icon: 'none' });
};

// 格式化斩掉时间
const formatMasteredTime = (time) => {
  if (!time) return '';
  const date = new Date(time);
  const now = new Date();
  const diff = now - date;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) return '今天';
  if (days === 1) return '昨天';
  if (days < 7) return `${days}天前`;
  
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}月${day}日`;
};

// 格式化高亮文本
const escapeRegExp = (s) => String(s || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const formatHighlight = (text) => {
  if (!text) return '';
  
  // 处理 Markdown 加粗语法 **单词**
  let formattedText = text.replace(/\*\*(.*?)\*\*/g, function(match, word) {
    return `<span style="color: #FF85A1; font-weight: bold;">${word}</span>`;
  });
  
  // 高亮目标单词
  if (word.value.english) {
    const targetWord = word.value.english;
    const targetRegex = new RegExp(`\\b(${escapeRegExp(targetWord)})\\b`, 'gi');
    formattedText = formattedText.replace(targetRegex, `<span style="color: #FF85A1; font-weight: bold;">$1</span>`);
  }
  
  return formattedText;
};
</script>

<style scoped>
/* 全局盒模型 */
* {
  box-sizing: border-box !important;
}

.container {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  padding: calc(50px + env(safe-area-inset-top) + 8px) 0 150px !important;
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.detail-card-shell {
  background: #FFFFFF;
  border: 1px solid #F5DDE5;
  border-radius: 24px;
  box-shadow: 0 6px 18px rgba(232, 168, 188, 0.10);
  box-sizing: border-box;
}

/* 单词档案卡 */
.word-profile-card {
  padding: 24px 22px 24px;
  margin: 0 10px 16px;
  width: calc(100% - 20px);
  background: #FFDCE8;
  border: 1px solid #EDC0D0;
  box-shadow: 0 10px 24px rgba(222, 141, 170, 0.16);
  overflow: visible;
  min-height: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
  z-index: 0;
}

/* 大单词输入框外层，防止裁切 */
.word-input-wrap {
  overflow: visible;
  min-height: 72px;
  padding: 4px 0 4px;
  display: block;
  position: relative;
}

.custom-nav-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: calc(50px + env(safe-area-inset-top));
  padding-top: env(safe-area-inset-top);
  display: flex;
  align-items: center;
  padding-left: 4px;
  z-index: 999;
  background: transparent;
}

.nav-back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px 8px 8px;
  font-size: 38px;
  color: #B85C6F;
  font-weight: 300;
  line-height: 1;
  min-width: 56px;
  min-height: 56px;
}

.word-header {
  margin-bottom: 20px;
  overflow: visible;
}

.word-readonly { display: block; }
.word-input {
  width: 100%;
  padding: 8px 0 10px;
  border: none !important;
  border-radius: 0 !important;
  background-color: transparent !important;
  font-size: 52px;
  font-weight: 800;
  color: #FF85A1 !important;
  text-align: center;
  overflow: visible;
  min-height: 72px;
  height: auto;
  margin: 0;
  box-shadow: none;
  line-height: 1.3;
  display: block;
  box-sizing: border-box;
}

.word-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
}

.word-chinese-inline {
  width: 100%;
  margin-top: 8px;
}

.defs-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.def-item {
  display: flex;
  align-items: baseline;
  gap: 6px;
  padding: 5px 2px;
  border-radius: 0;
  background-color: transparent;
  border: none;
}

/* 重点义：玫红系，与主题色协调 */
.def-freq .def-trans {
  color: #B85C6F;
  font-weight: 700;
}
.def-freq .def-pos {
  color: #B85C6F;
}

/* 熟词僻义：保持紫色系 */
.def-rare .def-trans {
  color: #8B6BAE;
  font-weight: 600;
}
.def-rare .def-pos {
  color: #8B6BAE;
}

.def-normal {
  color: #4A4E69;
}

.def-pos {
  flex-shrink: 0;
  font-size: 14px;
  font-weight: 700;
  color: #9A8FA0;
  min-width: 28px;
}

.def-trans {
  flex: 1;
  font-size: 14px;
  line-height: 1.6;
  word-break: break-word;
}

.def-type-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  vertical-align: middle;
}

.def-type-freq {
  background: rgba(255, 133, 161, 0.12);
  color: #C46B47;
}

.def-type-rare {
  background: rgba(170, 138, 214, 0.14);
  color: #7F6AA8;
}

.exam-tip-box {
  margin-top: 4px;
  padding: 2px 0 6px;
  font-size: 13px;
  line-height: 1.65;
  color: #8A7A90;
}

.exam-tip-title {
  font-size: 12px;
  font-weight: 700;
  color: #B85C6F;
  letter-spacing: 1px;
  margin-bottom: 8px;
}

.exam-tip-text {
  font-size: 15px;
  color: #555B68;
  line-height: 1.7;
}

.word-tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.tag-chip-soft {
  padding: 6px 12px;
  border-radius: 999px;
  background: #FFF4F8;
  color: #B85C6F;
  font-size: 12px;
}

.sentiment-chip {
  background: #F5F7FA;
  color: #6B7280;
}

.word-chinese-textarea {
  width: 100%;
  padding: 10px 0;
  border: none !important;
  background: transparent !important;
  font-size: 16px;
  line-height: 1.7;
  color: #4A4E69;
  resize: vertical;
  white-space: pre-wrap;
  word-break: break-word;
  display: block;
  box-sizing: border-box;
}

.metadata-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
  width: 100%;
  box-sizing: border-box;
  margin-top: 5px;
}

.repeat-section,
.importance-section {
  flex: 1;
  min-width: 120px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 来源、页码、年份 同一行 */
.source-caption-inline {
  font-size: 13px;
  color: #888;
  white-space: nowrap;
  margin-right: 8px;
}

.page-year-section {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin: 0 0 16px;
  padding: 0;
  background-color: transparent;
  width: 100%;
  box-sizing: border-box;
  position: relative;
  z-index: 0;
}

.page-year-section.one-line {
  flex-wrap: nowrap;
  justify-content: flex-start;
  align-items: center;
  gap: 12px;
  margin: 0 0 16px;
}

.page-year-section.one-line .page-info,
.page-year-section.one-line .year-info {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0;
}

.page-year-section.one-line .page-year-label {
  white-space: nowrap;
}

/* 页码/年份输入框外层，防止裁切 */
.page-year-input-wrap {
  overflow: visible;
  min-height: 40px;
  padding: 2px 0;
  display: flex;
  align-items: center;
}

.page-info,
.year-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 12px;
  background-color: transparent;
  border: none;
}

.page-year-label {
  font-size: 12px;
  color: #4A4E69;
  font-weight: 500;
  white-space: nowrap;
}

.page-year-input {
  width: 80px;
  padding: 8px 10px 10px;
  border: none !important;
  background-color: #FFF5F7 !important;
  font-size: 14px;
  color: #4A4E69 !important;
  text-align: center;
  min-height: 40px;
  height: auto;
  line-height: 1.5;
  border-radius: 8px !important;
  cursor: text;
  transition: all 0.3s ease;
  position: relative;
  box-sizing: border-box;
}

.page-year-input:focus {
  background-color: white !important;
  box-shadow: 0 0 0 2px rgba(255, 133, 161, 0.2);
  outline: none;
}

.small-label {
  display: block;
  font-size: 12px;
  color: #9CA3AF;
  margin-bottom: 8px;
  font-weight: 500;
}

.repeat-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.repeat-dot {
  width: 28px;
  height: 28px;
  background: #FFF0F3 !important;
  color: #B85C6F !important;
  border: 1px solid #FF85A1 !important;
  border-radius: 8px !important;
  font-size: 14px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.repeat-dot:active {
  background: #FFE5EC !important;
  transform: scale(0.95);
}

.repeat-value {
  font-size: 14px;
  font-weight: 600;
  color: #4A4E69;
  min-width: 24px;
  text-align: center;
}

.master-action-row {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #FFE5EC;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.btn-master {
  flex: 1;
  min-width: 140px;
  padding: 12px 20px !important;
  background: linear-gradient(135deg, #FF6B9D 0%, #FF85A1 100%) !important;
  color: white !important;
  font-size: 15px !important;
  font-weight: 600 !important;
  border-radius: 12px !important;
  border: none !important;
  box-shadow: 0 4px 12px rgba(255, 107, 157, 0.3);
  transition: all 0.3s ease;
}

.btn-master:active {
  transform: scale(0.98);
  box-shadow: 0 2px 8px rgba(255, 107, 157, 0.4);
}

.btn-unmaster {
  flex: 1;
  min-width: 140px;
  padding: 12px 20px !important;
  background: #FFF0F3 !important;
  color: #B85C6F !important;
  font-size: 15px !important;
  font-weight: 600 !important;
  border-radius: 12px !important;
  border: 2px solid #FFE5EC !important;
  transition: all 0.3s ease;
}

.btn-unmaster:active {
  background: #FFE5EC !important;
}

.mastered-time {
  font-size: 13px;
  color: #999;
  line-height: 1.5;
}

.star-rating {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: flex-start;
  flex-wrap: wrap;
}

.importance-dot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: #E8C8D2;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  transition: all 0.22s ease;
}

.importance-dot.active {
  color: #F29AB2;
  text-shadow: 0 3px 8px rgba(232, 143, 175, 0.16);
}

.star-rating.readonly .importance-dot {
  cursor: default;
}

.basic-info {
  margin: 0 0 16px;
  width: 100%;
  box-sizing: border-box;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 页码和年份信息 */
.tiny-label {
  font-size: 12px;
  color: #9CA3AF;
  font-weight: 500;
}

.tiny-input {
  width: 60px;
  padding: 6px 10px;
  border: none !important;
  border-radius: 6px !important;
  background-color: #FFF0F3 !important;
  font-size: 12px;
  color: #4A4E69 !important;
  text-align: center;
  height: 28px;
  line-height: 16px;
}

.chinese-definition {
  margin: 6px auto;
  width: 92%;
  background-color: #FFF5F7;
  border-radius: 15px;
  padding: 20px;
  height: auto;
  min-height: unset;
  overflow: visible;
  box-sizing: border-box;
}

.chinese-definition textarea {
  width: 100%;
  padding: 0 !important;
  border: none !important;
  background: transparent !important;
  font-size: 19px;
  line-height: 1.8;
  color: #FF85A1;
  height: auto;
  min-height: unset;
  resize: vertical;
  border-radius: 0 !important;
  overflow: visible;
  white-space: pre-wrap;
}



/* 表单项目 */
label {
  display: block;
  margin-bottom: 12px;
  font-size: 15px;
  color: #6D6470;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  margin-bottom: 6px;
  flex-wrap: wrap;
}

.section-header label {
  margin-bottom: 0;
}

.form-item {
  margin: 0 10px 14px;
  width: calc(100% - 20px);
  box-sizing: border-box;
}

.detail-section-plain {
  padding: 0;
}

.form-item input {
  width: 100%;
  padding: 14px 18px;
  border: none !important;
  border-radius: 15px !important;
  background-color: #FFF5F7 !important;
  font-size: 16px;
}

.form-item textarea {
  width: 100%;
  padding: 14px 18px;
  border: none !important;
  border-radius: 15px !important;
  background-color: #FFF5F7 !important;
  font-size: 16px;
  min-height: 100px;
  resize: vertical;
}

.word-with-repeat {
  display: flex;
  align-items: center;
  gap: 10px;
}

.word-with-repeat input {
  flex: 1;
}

.repeat-button {
  width: 40px;
  height: 40px;
  background-color: #FF85A1 !important;
  color: white !important;
  border: none !important;
  border-radius: 12px !important;
  font-size: 20px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.repeat-button:active {
  transform: scale(0.95);
}

.repeat-control {
  display: flex;
  align-items: center;
  gap: 10px;
}

.repeat-input {
  width: 80px;
  padding: 10px;
  border: none !important;
  border-radius: 12px !important;
  background-color: #FFF5F7 !important;
  text-align: center;
  font-size: 16px;
  font-weight: 600;
  color: #4A4E69;
}

/* 添加模式的重要程度刻度 */
.basic-info .star-rating {
  display: flex;
  gap: 10px;
}

/* 例句和近义词 */
.example-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.exam-sentences-plain {
  margin-top: 0;
}

.exam-sentences-plain .example-container {
  gap: 10px;
}

.soft-card-title {
  font-size: 13px;
  color: #938692;
  margin: 0 0 8px 4px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.example {
  padding: 20px;
  background-color: #FFF5F7;
  border-radius: 18px;
  line-height: 1.5;
}

.examples-list {
  display: flex;
  flex-direction: column;
  gap: 0;
  margin-bottom: 8px;
  background: #FFFCFD;
  border: 1px solid #F7E8EE;
  border-radius: 22px;
  box-shadow: 0 4px 12px rgba(232, 168, 188, 0.06);
  overflow: hidden;
}

.example-item {
  padding: 17px 17px 15px;
  background: transparent;
  border: 0;
  border-bottom: 1px solid #F4E7EC;
  box-shadow: none;
  border-radius: 0;
}

.example-item:last-child {
  border-bottom: 0;
}

.example-english {
  font-size: 16px;
  font-weight: 700;
  color: #3F4254;
  margin-bottom: 10px;
  line-height: 1.55;
}

.example-chinese {
  font-size: 14px;
  color: #7A7F91;
  line-height: 1.6;
}

/* 近义词 */
.synonym-item {
  border-left: none !important;
}

.synonym-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.synonym-word {
  font-size: 16px;
  font-weight: 600;
  color: #B85C6F;
}

.synonym-chinese {
  font-size: 14px;
  color: #7A7F91;
}

.synonym-contrast-box {
  margin-top: 12px;
}

.exam-train-card {
  padding: 18px;
  background: #FFFCFD;
  border: 1px solid #F7E8EE;
  border-radius: 22px;
}

.exam-train-tip {
  margin: 8px 0 14px;
}

.exam-train-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.exam-train-option {
  padding: 12px;
  border-radius: 14px;
  background: #FFF6F9;
  border: 1px solid #F4DFE8;
}

.exam-train-option.active {
  background: #FFF0F4;
  border-color: #F4A3B8;
}

.exam-train-option-label {
  display: block;
  font-size: 12px;
  color: #B85C6F;
  margin-bottom: 4px;
}

.exam-train-option-text {
  font-size: 14px;
  color: #4A4E69;
}

.exam-train-result {
  margin-top: 12px;
  font-size: 13px;
  color: #7A7F91;
}

.collocation-wrap {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.collocation-chip {
  padding: 8px 12px;
  border-radius: 14px;
  background: #FFF0F3;
  color: #B85C6F;
  font-size: 12px;
}

/* 高亮单词 */
.important-word-highlight {
  font-weight: bold;
  color: #FF85A1;
  background: rgba(255, 133, 161, 0.2);
  border-radius: 4px;
  padding: 0 4px;
}

.no-examples {
  color: #8D8790;
  font-size: 14px;
  margin-bottom: 10px;
}

.example-container > .no-examples,
.example-container > .example,
.example-container > .detail-placeholder-block {
  padding: 20px 18px 18px;
  background: #FFFCFD;
  border: 1px solid #F7E8EE;
  border-radius: 22px;
  box-shadow: 0 4px 12px rgba(232, 168, 188, 0.06);
  margin-bottom: 0;
}

/* 第二阶段数据未回来前的极简大色块占位 */
.detail-placeholder-block {
  padding: 32rpx 24rpx;
  background: var(--light-pink, #FFE4E9);
  border-radius: 16rpx;
  color: var(--deep-gray, #4A4E69);
  font-size: 28rpx;
  text-align: center;
}

/* 按钮样式 */
.btn-inline-action {
  flex-shrink: 0;
  align-self: auto;
  padding: 8px 18px;
  font-size: 12px;
}

.btn-inline-standalone {
  margin: 2px 0 0;
  align-self: center;
}

.center-action-row {
  display: flex;
  justify-content: center;
  margin-top: 6px;
}

.btn-solid {
  min-width: 116px;
  padding: 10px 18px;
  background: #F4A3B8 !important;
  color: #FFFFFF !important;
  border: none !important;
  border-radius: 999px !important;
  font-size: 12px;
  font-weight: 600;
  box-shadow: 0 6px 14px rgba(244, 163, 184, 0.18);
}

.btn-solid:active {
  background: #EA95AC !important;
  transform: translateY(1px);
}

.btn-solid[disabled] {
  opacity: 0.7;
  box-shadow: none;
}

.tags-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.tags-input {
  flex: 1;
  padding: 10px 14px;
  border-radius: 12px;
  background: #FFF5F7;
  font-size: 14px;
}

.btn-tag {
  flex-shrink: 0;
}

.recommended-tags {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-chip.rec {
  padding: 6px 12px;
  border-radius: 14px;
  background: #FFF0F3;
  color: #FF85A1;
  font-size: 13px;
}

.tag-chip.rec:active {
  opacity: 0.8;
}

.exam-tags-caption {
  font-size: 13px;
  color: #888;
  margin-right: 8px;
}

.exam-stats-block {
  margin-top: 0;
}

.exam-stats-content {
  font-size: 13px;
  color: #4A4E69;
  line-height: 1.4;
  padding: 18px 18px 20px;
  background: #FFFCFD;
  border: 1px solid #F7E8EE;
  border-radius: 22px;
  box-shadow: 0 4px 12px rgba(232, 168, 188, 0.06);
  text-align: left;
}

.exam-stats-row {
  margin-bottom: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: baseline;
  justify-content: flex-start;
}

.exam-stats-row:last-child {
  margin-bottom: 0;
}

.exam-stats-row-primary {
  margin-bottom: 10px;
  justify-content: flex-start;
  align-items: center;
  text-align: left;
}

.exam-stats-num {
  font-size: 13px;
  font-weight: 600;
  color: #5F6372;
  line-height: 1.4;
  display: inline-block;
}

.exam-stats-unit {
  font-size: 13px;
  color: #5F6372;
  font-weight: 600;
  line-height: 1.4;
  display: inline-block;
}

.exam-stats-detail {
  color: #5F6372;
  line-height: 1.4;
  text-align: left;
}

.exam-stats-years-row {
  margin-bottom: 10px;
}

.exam-stats-years {
  font-size: 13px;
  color: #5F6372;
  line-height: 1.4;
  text-align: left;
  display: block;
  width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.exam-stats-muted {
  color: #8D8790;
  font-size: 13px;
  justify-content: flex-start;
}

.exam-stats-retry {
  margin-left: 8px;
  color: var(--accent-rose, #B85C6F);
  font-size: 13px;
  font-weight: 600;
}

.exam-sentence-meta {
  font-size: 13px;
  color: #9A91A0;
  margin-bottom: 10px;
}

.same-tag-section .same-tag-list {
  display: flex;
  flex-direction: column;
  gap: 0;
  background: #FFFFFF;
  border: 1px solid #F5DDE5;
  border-radius: 24px;
  box-shadow: 0 6px 18px rgba(232, 168, 188, 0.10);
  overflow: hidden;
}

.form-item:last-of-type,
.page-year-section:last-of-type,
.word-profile-card:last-of-type,
.basic-info:last-of-type {
  margin-bottom: 14px;
}

.same-tag-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 18px;
  gap: 12px;
  border-bottom: 1px solid #F4E7EC;
}

.same-tag-item:last-child {
  border-bottom: 0;
}

.same-tag-eng {
  font-weight: 600;
  color: #4A4E69;
}

.same-tag-chi {
  font-size: 13px;
  color: #888;
}

/* 底部操作栏 */
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 15px 20px;
  background-color: white;
  border-radius: 20px 20px 0 0;
  box-shadow: 0 -4px 16px rgba(255, 133, 161, 0.1);
  z-index: 99;
  height: auto;
  min-height: 70px;
}

.bottom-bar button {
  flex: 1;
  padding: 12px 16px;
  border: none !important;
  border-radius: 20px !important;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  position: relative;
  z-index: 100;
}

.bottom-bar button::after {
  display: none !important;
}

.save-button {
  background-color: #FF85A1 !important;
  color: white !important;
  font-weight: 600;
}

.cancel-button {
  background: transparent !important;
  color: #FF85A1 !important;
  border: 1px solid #FF85A1 !important;
}

.delete-button {
  background: transparent !important;
  color: #FF85A1 !important;
  font-size: 13px;
  border: 1px solid #FF85A1 !important;
}

.bottom-bar button:active {
  transform: scale(0.96);
}

/* 底部导航 */
.footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  width: 100%;
  height: 60px;
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 0;
  background-color: #FFF0F3;
  border-radius: 24px 24px 0 0;
  box-shadow: 0 -4px 16px rgba(255, 133, 161, 0.1);
  z-index: 100;
}

.footer button {
  flex: 1;
  padding: 8px 12px;
  font-size: 15px;
  font-weight: 500;
  background: transparent !important;
  color: #FF85A1 !important;
  border: none !important;
  border-radius: 0 !important;
  transition: all 0.3s ease;
  text-align: center;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.footer button::after {
  display: none !important;
}

.footer button:active {
  opacity: 0.7;
}

.save-button {
  background-color: #FF85A1 !important;
  color: white !important;
  font-weight: 600;
}

.cancel-button {
  background: transparent !important;
  color: #FF85A1 !important;
  border: 1px solid #FF85A1 !important;
}

.delete-button {
  background: transparent !important;
  color: #FF85A1 !important;
  font-size: 13px;
  border: 1px solid #FF85A1 !important;
}
</style>
