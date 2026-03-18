<template>
  <view class="container">
    <!-- 状态栏占位 -->
    <view class="status-bar"></view>
    
    <!-- 筛选排序 + 学习中心 并排小按钮 -->
    <view class="toolbar-row">
      <view class="toolbar-btn" @click="showFilter = !showFilter">
        筛选排序 {{ showFilter ? '▲' : '▼' }}
      </view>
      <view class="toolbar-btn" @click="showLearningCenter = !showLearningCenter">
        学习中心 {{ showLearningCenter ? '▲' : '▼' }}
      </view>
    </view>

    <!-- 搜索栏 -->
    <view class="search-bar">
      <view class="search-input-wrapper">
        <input
          type="text"
          placeholder="搜索单词"
          v-model="searchText"
          class="search-input"
          @input="onSearchInput"
          @confirm="onSearchConfirm"
        />
      </view>
    </view>

    <!-- 筛选与排序 - 展开状态 -->
    <view v-if="showFilter" class="card filter-card">
      <view class="filter-header">
        <view class="card-title">筛选与排序</view>
        <view class="filter-close" @click="showFilter = false">✕</view>
      </view>
      <view class="filter-row">
        <VocalColorBlockSelector
          :range="sortLabels"
          :value="sortOptions.indexOf(sortBy.value)"
          @change="onSortChange"
        >
          <view class="picker-btn">{{ currentSortLabel }} ▼</view>
        </VocalColorBlockSelector>
        <VocalColorBlockSelector
          :range="sortOrderLabels"
          :value="sortOrderOptions.indexOf(sortOrder)"
          @change="onSortOrderChange"
        >
          <view class="picker-btn">{{ sortOrder === 'asc' ? '顺序' : '倒序' }} ▼</view>
        </VocalColorBlockSelector>
        <VocalColorBlockSelector
          :range="filterLabels"
          :value="filterOptions.indexOf(filterType.value)"
          @change="onFilterChange"
        >
          <view class="picker-btn">{{ currentFilterLabel }} ▼</view>
        </VocalColorBlockSelector>
        <VocalColorBlockSelector
          :range="showChineseLabels"
          :value="showChinese ? 0 : 1"
          @change="onShowChineseChange"
        >
          <view class="picker-btn">{{ showChinese ? '显示释义' : '隐藏释义' }} ▼</view>
        </VocalColorBlockSelector>
      </view>
      <view class="filter-row" v-if="filterType.value === 'tag'">
        <VocalColorBlockSelector
          :range="tagOptions"
          :value="tagOptions.indexOf(filterValue)"
          @change="onTagChange"
        >
          <view class="picker-btn">{{ filterValue || '选择标签' }} ▼</view>
        </VocalColorBlockSelector>
        <button class="clear-btn" @click="clearFilter">清除</button>
      </view>
      <view class="filter-row" v-else-if="filterType.value !== 'none'">
        <input class="filter-input" type="number" v-model.number="filterValue" placeholder="输入筛选值" />
        <button class="clear-btn" @click="clearFilter">清除</button>
      </view>
    </view>

    <view v-if="showLearningCenter" class="card lc-panel">
      <view class="learning-summary-grid">
        <view class="learning-summary-item" @click="goToReviewPreset('due')">
          <text class="learning-summary-value">{{ learningSnapshot.dueCount }}</text>
          <text class="learning-summary-label">今日到期</text>
        </view>
        <view class="learning-summary-item" @click="goToReviewPreset('wrong')">
          <text class="learning-summary-value">{{ learningSnapshot.mistakeCount }}</text>
          <text class="learning-summary-label">错词待练</text>
        </view>
        <view class="learning-summary-item" @click="goToReviewPreset('firstday')">
          <text class="learning-summary-value">{{ learningSnapshot.firstDayDue }}</text>
          <text class="learning-summary-label">首日巩固</text>
        </view>
        <view class="learning-summary-item" @click="goToStats">
          <text class="learning-summary-value">{{ latestAccuracyText }}</text>
          <text class="learning-summary-label">最近正确率</text>
        </view>
      </view>
      <view class="learning-actions">
        <button class="learning-action-btn" @click="goToReviewPreset('due')">到期复习</button>
        <button class="learning-action-btn secondary" @click="goToMistakes">错词本</button>
        <button class="learning-action-btn secondary" @click="goToStats">学习统计</button>
      </view>
    </view>

    <scroll-view
      class="word-list"
      scroll-y
      :refresher-enabled="true"
      :refresher-triggered="refreshing"
      refresher-background="#FFF0F3"
      @refresherrefresh="onListRefresh"
      @scrolltolower="onScrollToLower"
      style="background-color: #FFF0F3;"
    >
      <view v-if="filteredWords.length === 0" class="empty-state">
        <view class="empty-text">{{ (searchText || (filterType !== 'none' && (filterValue !== '' && filterValue !== undefined))) ? '未找到匹配的单词' : '还没有单词，开始添加吧' }}</view>
        <button v-if="!searchText && (filterType === 'none' || (filterValue === '' || filterValue === undefined))" class="empty-btn" @click="goToQuickAdd">添加单词</button>
      </view>
      <view class="word-item" v-for="word in visibleWords" :key="word.id || ('wb-' + word.english)">
        <view class="word-content" @click="goToDetail(word)">
          <view class="word-english">{{ word.english }} <span class="repeat-count">学习{{ word.repeat_count || 0 }}次</span></view>
          <view v-if="showChinese" class="word-chinese">{{ word.chinese || '—' }}</view>
          <view v-if="(word.source_page || word.year) || getExamCount(word)" class="word-source">
            <template v-if="word.source_page || word.year">页码 {{ word.source_page || '-' }} · 年份 {{ word.year || '-' }}</template>
            <text v-if="getExamCount(word)" class="word-exam-count">真题 {{ getExamCount(word) }}次</text>
          </view>
          <view v-if="word.tags" class="word-tags">
            <text v-for="(t, i) in (word.tags || '').split(/[,，\s]+/).filter(Boolean)" :key="i" class="tag-chip">{{ t }}</text>
          </view>
          <view class="word-importance">
            <span v-for="star in 5" :key="star" class="star" :class="{ active: (word.importance || 0) >= star }">★</span>
          </view>
        </view>
      </view>
      <view v-if="hasMoreWords" class="load-more" @click="onScrollToLower">加载更多</view>
    </scroll-view>

    <!-- 底部导航 -->
    <view class="footer">
      <button @click="goToQuickAdd">添加</button>
      <button @click="goToReview">复习</button>
      <button @click="goToMy">我的</button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import VocalColorBlockSelector from '../../components/vocal-color-block-selector/vocal-color-block-selector.vue';
import { onLoad, onUnload, onShow, onReady } from '@dcloudio/uni-app';
import db from '../../src/utils/db';
import * as pregenVocab from '../../src/utils/pregenVocab.js';
import * as masterDb from '../../src/utils/masterDb.js';
import { getCurrentWordbook, isSelfWordbook, isLocalWordbookKey, loadLocalWordbook, getWordbookWords } from '../../src/utils/wordbookSource.js';
import { getLearningDashboard, getLatestSession } from '../../src/utils/learningCenter.js';
import { logger, errorHandler } from '../../src/utils/errorHandler.js';
import { cleanupExpiredCaches } from '../../src/utils/learningCenter_v2.js';

const ENRICH_CHUNK = 200;
const FIRST_SCREEN_COUNT = 120;
const HOT_TOP_COUNT = 20; // 热加载：优先补全顶部 20 个词
const PAGE_SIZE = 50;
let loadWordsInProgress = false;
/** 非响应式全量缓存，仅外部/本地单词本使用，避免 6000+ 词进 ref 导致卡顿 */
let allExternalWords = [];
let plusReadyHandler = null;

const mapSortByToDb = (sortBy) => {
  const map = { create_time: 'create_time', alphabetical: 'english', importance: 'importance', repeat_count: 'repeat_count', view_count: 'view_count', exam_count: 'create_time' };
  return map[sortBy] || 'create_time';
};

const getFilters = () => ({
  search: searchText.value || undefined,
  tag: filterType.value === 'tag' ? filterValue.value : undefined,
  year: filterType.value === 'year' ? filterValue.value : undefined,
  page: filterType.value === 'page' ? filterValue.value : undefined,
});

function normalizeListWord(w) {
  return {
    ...w,
    id: w.id || null,
    english: (w.english || '').trim(),
    chinese: (w.chinese || '').trim(),
    repeat_count: w.repeat_count ?? 1,
    tags: (w.tags || '').trim() ? String(w.tags) : '',
    source_page: w.source_page || '',
    year: w.year || '',
    importance: Number(w.importance) || 0,
    view_count: Number(w.view_count) || 0,
    exam_count: w.exam_count != null ? (Number(w.exam_count) || 0) : undefined,
    create_time: w.create_time || '',
  };
}

function getExamCountForSort(word) {
  if (!word) return 0;
  if (word.exam_count != null) return Number(word.exam_count) || 0;
  return 0;
}

function sortExternalWords(list) {
  const arr = [...list];
  const order = sortOrder.value === 'asc' ? 1 : -1;
  const type = sortBy.value;
  arr.sort((a, b) => {
    if (type === 'alphabetical') return ((a.english || '').localeCompare(b.english || '')) * order;
    if (type === 'importance') return (((Number(a.importance) || 0) - (Number(b.importance) || 0))) * order;
    if (type === 'repeat_count') return (((Number(a.repeat_count) || 0) - (Number(b.repeat_count) || 0))) * order;
    if (type === 'view_count') return (((Number(a.view_count) || 0) - (Number(b.view_count) || 0))) * order;
    if (type === 'exam_count') return ((getExamCountForSort(a) - getExamCountForSort(b))) * order;
    return ((new Date(a.create_time || 0) - new Date(b.create_time || 0))) * order;
  });
  return arr;
}

function filterExternalWords(list) {
  let out = [...list];
  const q = (searchText.value || '').trim().toLowerCase();
  if (q) {
    out = out.filter((w) =>
      (w.english || '').toLowerCase().includes(q) ||
      (w.chinese || '').toLowerCase().includes(q)
    );
  }
  if (filterType.value === 'tag' && (filterValue.value || '').trim()) {
    const tag = String(filterValue.value).trim();
    out = out.filter((w) => (w.tags || '').split(/[,，\s]+/).map((t) => t.trim()).includes(tag));
  }
  if (filterType.value === 'year' && filterValue.value !== '' && filterValue.value !== undefined) {
    out = out.filter((w) => String(w.year || '') === String(filterValue.value));
  }
  if (filterType.value === 'page' && filterValue.value !== '' && filterValue.value !== undefined) {
    out = out.filter((w) => String(w.source_page || '') === String(filterValue.value));
  }
  return out;
}

function prepareExternalWords(raw) {
  const normalized = (raw || []).map(normalizeListWord);
  return sortExternalWords(filterExternalWords(normalized));
}

/** 补全单条：优先用主库批量结果 chinese/examCount/tags/importance，缺项再用 pregen 兜底 */
function enrichOneWord(w, cache, dictLookup) {
  const key = (w.english || '').trim().toLowerCase();
  if (!key) return;
  const info = dictLookup && dictLookup[key];
  const isObj = info && typeof info === 'object' && !Array.isArray(info);
  if (!(w.chinese || '').trim()) {
    if (isObj && (info.chinese || '').trim()) w.chinese = info.chinese.trim();
    else if (cache && cache[key] && cache[key].chinese) w.chinese = cache[key].chinese;
    else if (info && typeof info === 'string') w.chinese = info;
  }
  if (info && isObj && typeof info.examCount === 'number') w.exam_count = info.examCount;
  if (isObj && (info.tags || '').trim()) w.tags = String(info.tags).trim();
  if (isObj && typeof info.importance === 'number') w.importance = info.importance;
}

const searchText = ref('');
const displayLimit = ref(200);
const showFilter = ref(false);
const showLearningCenter = ref(false);
const words = ref([]);
const refreshing = ref(false);
const sortBy = ref('create_time');
const filterType = ref('none'); // 筛选类型：none, year, page
const filterValue = ref(''); // 筛选值
const SHOW_CHINESE_KEY = 'index_show_chinese_v1';
const showChinese = ref(true);
const learningSnapshot = ref({ dueCount: 0, mistakeCount: 0, firstDayDue: 0, overdueCount: 0 });
const latestSession = ref(null);

// 排序选项
const sortOptions = ['create_time', 'alphabetical', 'importance', 'repeat_count', 'view_count', 'exam_count'];
const sortLabels = ['按录入时间', '按首字母', '按重要程度', '按学习次数', '按查看次数', '按真题频次'];
const sortOrderOptions = ['asc', 'desc'];
const sortOrderLabels = ['顺序', '倒序'];
const sortOrder = ref('desc'); // 顺序=升序，倒序=降序
const showChineseLabels = ['显示释义', '隐藏释义'];
const hasMoreSelfWords = ref(true);
/** 外部单词本全量条数，用于 hasMoreWords（不把全量放进 ref） */
const allExternalWordsLength = ref(0);

// 筛选选项（含按标签）
const filterOptions = ['none', 'tag', 'year', 'page'];
const filterLabels = ['无筛选', '按标签', '按真题年份', '按纸质页码'];
// 预设标签 + 从词库中收集的标签
const PRESET_TAGS = ['高频', '阅读词汇', '完形词汇', '翻译词汇', '新题型词汇', '写作词汇', '作文词', '口语词', '学术词'];
const tagOptions = computed(() => {
  const fromWords = new Set();
  (words.value || []).forEach(w => {
    const t = (w.tags || '').split(/[,，\s]+/).filter(Boolean);
    t.forEach(x => fromWords.add(x));
  });
  return [...PRESET_TAGS, ...Array.from(fromWords).filter(t => !PRESET_TAGS.includes(t))];
});

// 计算当前选中的排序和筛选标签
const currentSortLabel = computed(() => {
  const index = sortOptions.indexOf(sortBy.value);
  return index >= 0 ? sortLabels[index] : '按录入时间';
});

const currentFilterLabel = computed(() => {
  const index = filterOptions.indexOf(filterType.value);
  return index >= 0 ? filterLabels[index] : '无筛选';
});

const currentBookLabel = computed(() => getCurrentWordbook() || '当前词书');
const latestAccuracyText = computed(() => {
  const value = latestSession.value && latestSession.value.reviewedCount
    ? `${Math.round((Number(latestSession.value.correctCount || 0) / Math.max(1, Number(latestSession.value.reviewedCount || 0))) * 100)}%`
    : '--';
  return value;
});

const loadLearningSnapshot = async () => {
  try {
    const book = getCurrentWordbook();
    let pool = [];
    if (book === 'self') {
      pool = await db.getAllWords();
    } else if (isLocalWordbookKey(book)) {
      pool = await loadLocalWordbook(book);
    } else {
      pool = getWordbookWords(book) || [];
    }
    learningSnapshot.value = getLearningDashboard(pool, book);
    latestSession.value = getLatestSession(book);
  } catch (_) {
    learningSnapshot.value = { dueCount: 0, mistakeCount: 0, firstDayDue: 0, overdueCount: 0 };
    latestSession.value = null;
  }
};

const onListRefresh = async () => {
  refreshing.value = true;
  await loadWords();
  if (isSelfWordbook()) await syncIncompleteWordsWithStats();
  await loadLearningSnapshot();
  refreshing.value = false;
};

/** 用新对象替换列表项，确保 Vue 检测到 chinese/tags/exam_count 变化并刷新首页释义、真题次数与标签 */
function applyEnrichedToRef(list, wordsRef) {
  if (!list || list.length === 0 || !wordsRef || !Array.isArray(wordsRef.value)) return;
  const dict = {};
  for (const item of list) {
    const key = ((item && item.english) || '').trim().toLowerCase();
    if (key) dict[key] = item;
  }
  wordsRef.value = wordsRef.value.map((w) => {
    const key = ((w && w.english) || '').trim().toLowerCase();
    const hit = key ? dict[key] : null;
    if (!hit) return w;
    return {
      ...w,
      chinese: (hit.chinese !== undefined && hit.chinese !== null) ? hit.chinese : w.chinese,
      tags: (hit.tags !== undefined && hit.tags !== null) ? hit.tags : w.tags,
      exam_count: hit.exam_count !== undefined && hit.exam_count !== null ? hit.exam_count : w.exam_count,
      importance: hit.importance !== undefined && hit.importance !== null ? hit.importance : w.importance,
    };
  });
}

function buildChineseFromDefs(defs) {
  if (!Array.isArray(defs) || defs.length === 0) return '';
  const parts = [];
  for (const d of defs) {
    if (!d || typeof d !== 'object') continue;
    const pos = String(d.pos || '').trim();
    const trans = String(d.trans || '').trim();
    if (!trans) continue;
    parts.push(pos ? `${pos} ${trans}` : trans);
    if (parts.length >= 4) break;
  }
  return parts.join('；');
}

/** 兜底：当批量补全失败时，逐词查主库（仅少量缺失项）补齐释义/标签/真题次数 */
async function fallbackEnrichByFullDetail(list, bookAtLoad, wordsRef) {
  if (!Array.isArray(list) || list.length === 0 || !wordsRef || !Array.isArray(wordsRef.value)) return;
  const missing = list.filter((w) => {
    const noChinese = !((w.chinese || '').trim());
    const noTags = !((w.tags || '').trim());
    return (w.english || '').trim() && (noChinese || noTags);
  }).slice(0, 60);
  if (missing.length === 0) return;
  const updates = {};
  await Promise.all(missing.map(async (w) => {
    try {
      const detail = await masterDb.getWordFullDetail(w.english);
      const key = (w.english || '').trim().toLowerCase();
      if (!key) return;
      let chinese = '';
      let tags = '';
      let examCount = undefined;
      if (detail) {
        chinese = (detail.chinese || '').trim();
        if (!chinese) chinese = buildChineseFromDefs(detail.defs);
        tags = (detail.examStats && Array.isArray(detail.examStats.tags)) ? detail.examStats.tags.join(',') : '';
        examCount = (detail.examStats && typeof detail.examStats.total_count === 'number') ? detail.examStats.total_count : undefined;
      }
      // 主库中文仍为空时，尝试 pregen 兜底
      if (!chinese) {
        try {
          const pre = await pregenVocab.getPregenWord(w.english);
          if (pre && (pre.chinese || '').trim()) chinese = pre.chinese.trim();
        } catch (_) {}
      }
      updates[key] = {
        chinese,
        tags: tags || '',
        exam_count: examCount,
      };
    } catch (_) {}
  }));
  if (getCurrentWordbook() !== bookAtLoad) return;
  if (Object.keys(updates).length === 0) return;
  wordsRef.value = wordsRef.value.map((w) => {
    const key = (w.english || '').trim().toLowerCase();
    const u = key ? updates[key] : null;
    if (!u) return w;
    return {
      ...w,
      chinese: (u.chinese || '').trim() || w.chinese,
      tags: (u.tags || '').trim() || w.tags,
      exam_count: (u.exam_count != null) ? u.exam_count : w.exam_count,
    };
  });
}

function countMissingChineseForList(list, wordsRef) {
  if (!Array.isArray(list) || !Array.isArray(wordsRef?.value)) return 0;
  const set = new Set(list.map((w) => ((w?.english || '').trim().toLowerCase())).filter(Boolean));
  let n = 0;
  for (const w of wordsRef.value) {
    const key = ((w?.english || '').trim().toLowerCase());
    if (!key || !set.has(key)) continue;
    if (!((w.chinese || '').trim())) n++;
  }
  return n;
}

async function retryEnrichUntilReady(list, bookAtLoad, wordsRef) {
  // 解决启动时 masterDb 尚未就绪导致非自用词书释义长期“—”的问题
  const MAX_RETRY = 8;
  const INTERVAL_MS = 800; // 加大间隔，错开动画帧
  await new Promise((r) => setTimeout(r, 600)); // 首次延迟，等动画结束
  for (let i = 0; i < MAX_RETRY; i++) {
    if (getCurrentWordbook() !== bookAtLoad) return;
    const missing = countMissingChineseForList(list, wordsRef);
    if (missing <= 0) return;
    await new Promise((r) => setTimeout(r, INTERVAL_MS));
    // 先批量再兜底，逐轮补齐
    try {
      const englishList = list.map((w) => (w.english || '').trim().toLowerCase()).filter(Boolean);
      const dictLookup = await masterDb.getWordBriefBatch(englishList).catch(() => ({}));
      for (const item of list) enrichOneWord(item, {}, dictLookup || {});
      applyEnrichedToRef(list, wordsRef);
    } catch (_) {}
    await fallbackEnrichByFullDetail(list, bookAtLoad, wordsRef);
  }
}

/** 后台补全：首页卡片只依赖主库批量查（vocal_master 含释义+真题次数+标签），采用热加载两阶段 */
const enrichWordbookListInBackground = async (list, bookAtLoad, wordsRef) => {
  if (!list || list.length === 0 || !wordsRef) return;
  try {
    const englishList = list.map((w) => (w.english || '').trim().toLowerCase()).filter(Boolean);
    if (getCurrentWordbook() !== bookAtLoad) return;

    // Phase 1: 热加载顶部若干词，优先体感
    const hotList = list.slice(0, Math.min(HOT_TOP_COUNT, list.length));
    const hotKeys = hotList.map((w) => (w.english || '').trim().toLowerCase()).filter(Boolean);
    let hotLookup = {};
    try {
      hotLookup = await masterDb.getWordBriefBatch(hotKeys);
      if ((!hotLookup || Object.keys(hotLookup).length === 0) && getCurrentWordbook() === bookAtLoad) {
        await new Promise((r) => setTimeout(r, 120));
        hotLookup = await masterDb.getWordBriefBatch(hotKeys);
      }
    } catch (_) {}
    if (getCurrentWordbook() !== bookAtLoad) return;
    for (let i = 0; i < hotList.length; i++) enrichOneWord(hotList[i], null, hotLookup || {});
    applyEnrichedToRef(list, wordsRef);

    // Phase 2: 后台补全当前页剩余词
    const restList = list.slice(hotList.length);
    const restKeys = restList.map((w) => (w.english || '').trim().toLowerCase()).filter(Boolean);
    let restLookup = {};
    if (restKeys.length) {
      try {
        restLookup = await masterDb.getWordBriefBatch(restKeys);
      } catch (_) {}
    }
    if (getCurrentWordbook() !== bookAtLoad) return;
    for (let i = 0; i < restList.length; i++) {
      enrichOneWord(restList[i], null, restLookup || {});
      if ((i + 1) % ENRICH_CHUNK === 0) {
        applyEnrichedToRef(list, wordsRef);
        await new Promise((r) => setTimeout(r, 0));
      }
    }
    applyEnrichedToRef(list, wordsRef);
    // 二次兜底：若仍有缺失，逐词查主库补全
    await fallbackEnrichByFullDetail(list, bookAtLoad, wordsRef);
    // 三次兜底：启动阶段主库可能晚到，延迟重试若干次，确保非自用词书也能补出释义
    retryEnrichUntilReady(list, bookAtLoad, wordsRef);
  } catch (_) {}
};

const reEnrichCurrentWordbook = async () => {
  const book = getCurrentWordbook();
  if (!words.value || words.value.length === 0) return;
  // 用当前已显示列表强制重跑一遍补全，解决首页早于 plusready 导致主库链路未命中的问题
  await enrichWordbookListInBackground(words.value, book, words);
};

/** 刷新时：用主库真题统计补全重要程度与标签。 */
const syncIncompleteWordsWithStats = async () => {
  try {
    const list = words.value || [];
    const englishList = list.map((w) => (w.english || '').trim()).filter(Boolean);
    const statsMap = await masterDb.getWordExamStatsBatch(englishList).catch(() => ({}));
    for (const w of list) {
      const info = statsMap[(w.english || '').trim().toLowerCase()];
      if (!info) continue;
      const updates = {};
      if (typeof info.importance === 'number' && info.importance !== (Number(w.importance) || 0)) updates.importance = info.importance;
      if ((info.tags || '').trim() && !(w.tags || '').trim()) updates.tags = info.tags;
      if (Object.keys(updates).length) await db.updateWord(w.id, updates);
    }
  } catch (_) {}
};

const loadWords = async () => {
  if (loadWordsInProgress) return;
  loadWordsInProgress = true;
  try {
    const book = getCurrentWordbook();

    if (book === 'self') {
      const list = await db.getWordsForList(PAGE_SIZE, 0, mapSortByToDb(sortBy.value), sortOrder.value, getFilters());
      words.value = list.map(normalizeListWord);
      hasMoreSelfWords.value = list.length >= PAGE_SIZE;
      allExternalWords = [];
      allExternalWordsLength.value = 0;
      enrichWordbookListInBackground(words.value, book, words);
      console.log('极速加载：自用分页成功，数量:', words.value.length);
    await loadLearningSnapshot();
      return;
    }

    let raw = [];
    if (isLocalWordbookKey(book)) {
      raw = await loadLocalWordbook(book);
    } else {
      raw = getWordbookWords(book) || [];
    }

    allExternalWords = prepareExternalWords(raw);
    allExternalWordsLength.value = allExternalWords.length;

    words.value = allExternalWords.slice(0, PAGE_SIZE);
    displayLimit.value = PAGE_SIZE;
    console.log('极速加载：外部单词本首屏成功，响应式数量:', words.value.length, '全量:', allExternalWords.length);

    enrichWordbookListInBackground(words.value, book, words);
    await loadLearningSnapshot();
  } catch (error) {
    console.error('加载失败:', error);
    words.value = [];
  } finally {
    loadWordsInProgress = false;
  }
};

onLoad(() => {
  console.log('首页 onLoad - 开始加载');
  try {
    const v = uni.getStorageSync(SHOW_CHINESE_KEY);
    if (v === false || v === 'false' || v === 0 || v === '0') showChinese.value = false;
  } catch (_) {}

  // 加载单词列表，添加错误处理
  loadWords().catch(error => {
    console.error('首页加载单词失败:', error);
    uni.showToast({
      title: '加载失败，请重试',
      icon: 'error'
    });
  });

  // App 端：若首页初次进入时 plus 尚未就绪，plusready 后补跑一次非自用词书补全
  try {
    if (typeof plus !== 'undefined' && typeof document !== 'undefined') {
      plusReadyHandler = () => {
        reEnrichCurrentWordbook();
      };
      document.addEventListener('plusready', plusReadyHandler, false);
    }
  } catch (_) {}
  uni.$on('refreshWordList', () => loadWords());
  uni.$on('wordEnriched', () => loadWords());
  uni.$on('wordbookChanged', () => {
    words.value = [];
    loadWords();
  });
});

onShow(() => {
  if (words.value.length === 0) loadWords();
  else {
    // 延迟到返回动画结束后再做补全，避免 DB 查询卡动画
    setTimeout(() => reEnrichCurrentWordbook(), 350);
  }
  loadLearningSnapshot();
});

// onReady: reEnrichCurrentWordbook 已在 onShow 中调用，此处无需重复执行

onUnload(() => {
  uni.$off('refreshWordList');
  uni.$off('wordEnriched');
  uni.$off('wordbookChanged');
  try {
    if (plusReadyHandler && typeof document !== 'undefined') {
      document.removeEventListener('plusready', plusReadyHandler, false);
    }
  } catch (_) {}
  plusReadyHandler = null;

  // 清理过期缓存
  try {
    cleanupExpiredCaches();
  } catch (error) {
    logger.warn('Index', '清理缓存失败', error);
  }
});

let searchDebounceTimer = null;
let filterDebounceTimer = null;
watch(searchText, () => {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    loadWords();
  }, 300);
});

watch(filterValue, () => {
  if (filterDebounceTimer) clearTimeout(filterDebounceTimer);
  filterDebounceTimer = setTimeout(() => {
    if (filterType.value === 'none') return;
    loadWords();
  }, 220);
});

const filteredWords = computed(() => {
  if (isSelfWordbook()) return [...words.value];
  return [...words.value];
});

const visibleWords = computed(() => {
  if (isSelfWordbook()) return words.value;
  return words.value;
});

const hasMoreWords = computed(() => {
  if (isSelfWordbook()) return hasMoreSelfWords.value;
  return words.value.length < allExternalWordsLength.value;
});

const loadMoreSelfWords = async () => {
  if (!hasMoreSelfWords.value || !isSelfWordbook()) return;
  const next = await db.getWordsForList(PAGE_SIZE, words.value.length, mapSortByToDb(sortBy.value), sortOrder.value, getFilters());
  const normalizedNext = next.map(normalizeListWord);
  words.value = [...words.value, ...normalizedNext];
  // 仅补全新增页，保持滚动流畅并修复释义/标签缺失
  enrichWordbookListInBackground(normalizedNext, getCurrentWordbook(), words);
  hasMoreSelfWords.value = next.length >= PAGE_SIZE;
};

const onScrollToLower = () => {
  if (!hasMoreWords.value) return;
  if (isSelfWordbook()) {
    loadMoreSelfWords();
    return;
  }
  const currentLen = words.value.length;
  if (currentLen < allExternalWords.length) {
    const nextBatch = allExternalWords.slice(currentLen, currentLen + PAGE_SIZE);
    words.value = [...words.value, ...nextBatch];
    enrichWordbookListInBackground(nextBatch, getCurrentWordbook(), words);
  }
};

const onSortChange = (e) => {
  const index = e.detail.value;
  sortBy.value = sortOptions[index];
  loadWords();
};

const onSortOrderChange = (e) => {
  const index = e.detail.value;
  sortOrder.value = sortOrderOptions[index] || 'desc';
  loadWords();
};

const onFilterChange = (e) => {
  const index = e.detail.value;
  filterType.value = filterOptions[index];
  loadWords();
};

const onShowChineseChange = (e) => {
  const idx = Number(e?.detail?.value ?? 0);
  showChinese.value = idx === 0;
  try { uni.setStorageSync(SHOW_CHINESE_KEY, showChinese.value); } catch (_) {}
};

const onTagChange = (e) => {
  const idx = e.detail.value;
  const list = tagOptions.value;
  filterValue.value = list[idx] || '';
  loadWords();
};

const clearFilter = () => {
  filterType.value = 'none';
  filterValue.value = '';
  loadWords();
};

const goToDetail = (word) => {
  if (word.id) {
    uni.navigateTo({ url: `/pages/word-detail/word-detail?id=${word.id}` });
  } else {
    uni.navigateTo({ url: `/pages/word-detail/word-detail?english=${encodeURIComponent(word.english)}&fromWordbook=1` });
  }
};

const goToReview = () => {
  uni.navigateTo({
    url: `/pages/review/review`
  });
};

const goToReviewPreset = (preset) => {
  uni.navigateTo({
    url: `/pages/review/review?preset=${encodeURIComponent(preset || 'default')}`
  });
};

const goToQuickAdd = () => {
  uni.navigateTo({
    url: `/pages/quick-add/quick-add`
  });
};

const goToMy = () => {
  uni.navigateTo({
    url: `/pages/my/my`
  });
};

const goToStats = () => {
  uni.navigateTo({ url: '/pages/stats/stats' });
};

const goToMistakes = () => {
  uni.navigateTo({ url: '/pages/mistakes/mistakes' });
};

/** 真题总出现次数（单词本词用 CSV 的 exam_count，自用词用静态数据） */
const getExamCount = (word) => {
  if (!word || !word.english) return 0;
  if (word.exam_count != null) return Number(word.exam_count) || 0;
  return 0;
};

const onSearchInput = (e) => {
  searchText.value = e.detail.value || '';
};

const onSearchConfirm = () => {
  loadWords();
};
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding-top: 0;
  background-color: #FFF0F3;
}

.status-bar {
  min-height: 0;
  height: constant(safe-area-inset-top); /* iOS < 11.2 */
  height: env(safe-area-inset-top); /* iOS >= 11.2 */
  width: 100%;
  background-color: #FFF0F3;
}

.toolbar-row {
  margin-top: 12px;
}

.search-bar {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  padding: 0 12px;
}

.search-input-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  background-color: #FFF0F4;
  border-radius: 20px;
  padding: 0 18px;
  height: 48px;
}

.search-input {
  flex: 1;
  height: 48px;
  border: none;
  background: transparent;
  font-size: 16px;
  color: #4A4E69;
  outline: none;
}

.search-input::placeholder {
  color: #B8B8B8;
}

.filter-bar {
  display: flex;
  flex-wrap: wrap;
  margin-bottom: 20px;
  gap: 10px;
  align-items: center;
}

.filter-bar select {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
  flex: 1;
  min-width: 150px;
}

.picker-display {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: white;
  min-width: 120px;
}

.filter-bar button {
  padding: 10px 15px;
  background-color: #F48FB1;
  color: white;
  border: none;
  border-radius: 8px;
}

.filter-controls {
  display: flex;
  gap: 10px;
  align-items: center;
  flex: 1;
  min-width: 300px;
}

.filter-controls input {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
  flex: 1;
  min-width: 100px;
}

.filter-controls button {
  padding: 10px 15px;
  background-color: #F1B8C8;
  color: white;
  border: none;
  border-radius: 8px;
}

.word-list {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 8px 0 20px 0;
  background-color: #FFF0F3;
}

:deep(.word-list) {
  background-color: #FFF0F3 !important;
}

:deep(.uni-scroll-view) {
  background-color: #FFF0F3 !important;
}

:deep(.uni-scroll-view__refresh-inner) {
  background-color: #FFF0F3 !important;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
}

.empty-text {
  font-size: 16px;
  color: #999;
  margin-bottom: 24px;
  text-align: center;
}

.empty-btn {
  padding: 12px 32px !important;
  background-color: #FF85A1 !important;
  color: white !important;
  font-size: 15px !important;
  border-radius: 24px !important;
  font-weight: 500;
}

.load-more {
  padding: 20px;
  text-align: center;
  color: #999;
  font-size: 14px;
}

.word-item {
  background-color: white;
  padding: 16px 20px;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(255, 133, 161, 0.08);
  transition: transform 0.2s ease;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  width: 90%;
  margin: 8px auto;
}

.word-content {
  flex: 1;
  cursor: pointer;
}

.word-item:active {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 133, 161, 0.12);
}

.word-english {
  font-size: 28px;
  font-weight: 700;
  color: #FF85A1;
  letter-spacing: 0.5px;
}

.repeat-count {
  font-size: 13px;
  color: #999;
  background-color: #FFF0F4;
  padding: 3px 8px;
  border-radius: 12px;
  margin-left: 12px;
  font-weight: 500;
}

.word-chinese {
  font-size: 14px;
  color: #666;
  margin-top: 6px;
  line-height: 1.5;
}

.word-source {
  font-size: 12px;
  color: #999;
  margin-top: 6px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.word-exam-count {
  font-size: 12px;
  color: #999;
}

.word-tags {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag-chip {
  font-size: 12px;
  color: #FF85A1;
  background: #FFF0F3;
  padding: 4px 10px;
  border-radius: 12px;
  white-space: nowrap;
}

.word-importance {
  margin-top: 8px;
  display: flex;
  gap: 2px;
}

.word-importance .star {
  font-size: 16px;
  color: #FFD9E3;
}

.word-importance .star.active {
  color: #FF85A1;
}

/* 卡片通用样式 */
.card {
  background-color: white;
  border-radius: 28px;
  padding: 20px;
  margin-bottom: 16px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #4A4E69;
  margin-bottom: 16px;
}

/* 筛选与排序卡片 */
.filter-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 18px;
}

.filter-toggle {
  display: none;
}

.toolbar-row {
  display: flex;
  gap: 8px;
  padding: 0 12px 10px;
}

.toolbar-btn {
  flex: 1;
  padding: 8px 0;
  background-color: #FFF0F4;
  border: 1px solid #F3DCE5;
  border-radius: 20px;
  text-align: center;
  color: #B85C6F;
  font-size: 13px;
  font-weight: 500;
}

.lc-panel {
  margin-bottom: 4px;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.filter-row > * {
  flex: 1;
  min-width: 44%;
}

.picker-btn {
  flex: 1;
  padding: 14px 16px;
  background-color: #FFE5EC;
  border-radius: 999px;
  font-size: 14px;
  color: #4A4E69;
  text-align: center;
}

.filter-input {
  flex: 1;
  padding: 14px 16px;
  background-color: #FFE5EC;
  border-radius: 999px;
  font-size: 14px;
}

.clear-btn {
  height: 42px;
  line-height: 42px;
  padding: 0 18px;
  background-color: #FFF1F5 !important;
  color: #B85C6F !important;
  border: 1px solid #F3DCE5 !important;
  border-radius: 999px !important;
  font-size: 14px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.clear-btn:active {
  background-color: #FFE8F0 !important;
  border-color: #EFC7D5 !important;
}

.learning-center-card {
  box-shadow: 0 8px 22px rgba(255, 133, 161, 0.08);
  cursor: pointer;
  user-select: none;
}

.lc-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.lc-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.lc-summary-inline {
  font-size: 12px;
  color: #9A8FA0;
}

.lc-toggle-icon {
  font-size: 11px;
  color: #9A8FA0;
  font-weight: 400;
  margin-left: 4px;
}

.lc-body {
  margin-top: 14px;
}

.learning-sub {
  font-size: 12px;
  color: #8E8798;
}

.learning-summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0;
  margin-bottom: 14px;
  border: 1px solid #F3DCE5;
  border-radius: 14px;
  overflow: hidden;
}

.learning-summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 14px 6px;
  text-align: center;
  border-right: 1px solid #F3DCE5;
  box-sizing: border-box;
  gap: 4px;
}

.learning-summary-item:last-child {
  border-right: none;
}

.learning-summary-value {
  display: block;
  font-size: 20px;
  line-height: 1;
  font-weight: 800;
  color: #B85C6F;
}

.learning-summary-label {
  font-size: 11px;
  color: #8E8798;
  white-space: nowrap;
  line-height: 1.2;
}

.learning-actions {
  display: flex;
  gap: 8px;
}

.learning-action-btn {
  flex: 1;
  height: 38px;
  line-height: 38px;
  border-radius: 999px;
  background-color: #FF85A1;
  color: #FFFFFF;
  font-size: 13px;
  font-weight: 600;
  text-align: center;
  padding: 0;
  border: none;
}

.learning-action-btn.secondary {
  background-color: #E8748F;
  color: #FFFFFF;
  border: none;
}

/* 数据库操作卡片 */
.db-card {
  margin-bottom: 16px;
}

.db-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.db-btn {
  padding: 16px 12px;
  font-size: 14px;
  background-color: #FFF0F3 !important;
  color: #4A4E69 !important;
}

/* 底部导航 */
.footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  width: 100%;
  height: calc(56px + env(safe-area-inset-bottom));
  display: flex;
  justify-content: space-evenly;
  align-items: center;
  padding: 0;
  padding-bottom: env(safe-area-inset-bottom);
  background-color: #FFF0F3;
  border-top: 1px solid #FFE5EC;
  z-index: 100;
  box-sizing: border-box;
}

.footer button {
  flex: 1;
  height: 56px;
  line-height: 56px;
  padding: 0;
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  background: transparent !important;
  color: #FF85A1 !important;
  border: none !important;
  border-radius: 0 !important;
  transition: all 0.2s ease;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.footer button::after {
  display: none !important;
}

.footer button:active {
  background-color: #FFE5EC !important;
}

/* 下拉刷新区域背景颜色 */
:deep(.uni-scroll-view__refresh) {
  background-color: #FFF0F3 !important;
}
</style>