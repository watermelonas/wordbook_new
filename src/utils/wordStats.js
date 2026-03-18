/**
 * 该模块已降级为纯计算/格式化工具。
 * 真题统计与真题出处的运行时读取已全面迁移到 masterDb.js。
 */

const SECTION_ORDER = ['完形', '阅读', '新题型', '翻译', '写作', '完整试卷'];

export function loadWordStats() {
  return Promise.resolve(null);
}

export function loadWordExamSentences() {
  return Promise.resolve(null);
}

export async function getWordExamSentences() {
  return [];
}

export async function getWordStats() {
  return null;
}

export function getWordStatsFromCache() {
  return null;
}

export function getWordExamSentencesFromCache() {
  return [];
}

export function getExamTotalCount() {
  return 0;
}

/**
 * 将单个单词的真题信息格式化为给 AI 看的短文本（用于生成例句等时的上下文）
 * @param {Object} stats getWordStats 返回的对象
 * @returns {string}
 */
export function formatWordStatsForPrompt(stats) {
  if (!stats || typeof stats !== 'object') return '';
  const total = stats.total_count || 0;
  const by = stats.by_section || {};
  const parts = SECTION_ORDER.filter((s) => by[s] > 0).map((s) => `${s}${by[s]}次`);
  const years = stats.years && stats.years.length ? stats.years : [];
  const yearStr = years.length > 0 ? `，出现年份：${years.slice(0, 5).join('、')}${years.length > 5 ? '等' + years.length + '年' : ''}` : '';
  return `该词在考研真题中的统计：总出现${total}次；按题型：${parts.join('、') || '无'}${yearStr}。生成例句时可参考其真题考查频率与题型分布。`;
}

/**
 * 重要程度 0–5 星。无真题数据 → 0 星；有数据则按频次百分位划分，使 1–5 星都有明确区间。
 * 百分位 p = 在全体词中「频次高于该词」的比例；p 越高越重要。
 * 区间：1 星 p<0.35，2 星 0.35–0.55，3 星 0.55–0.75，4 星 0.75–0.90，5 星 p≥0.90。
 */
export function getImportanceFromStats(stats, allWords) {
  if (!stats) return 1;
  const total = stats.total_count;
  if (total == null || total === 0) return 1;
  if (typeof stats.importance === 'number') {
    if (stats.importance === 0) return 0;
    if (stats.importance >= 1 && stats.importance <= 5) return stats.importance;
  }
  const words = allWords || {};
  const counts = Object.values(words).map((st) => st.total_count || 0).filter((n) => n > 0);
  if (counts.length === 0) return 0;
  counts.sort((a, b) => b - a);
  if (total <= counts[counts.length - 1]) return 1;
  const rank = counts.findIndex((c) => c <= total);
  const index = rank >= 0 ? rank : counts.length;
  const p = 1 - index / counts.length;
  if (p >= 0.90) return 5;
  if (p >= 0.75) return 4;
  if (p >= 0.55) return 3;
  if (p >= 0.35) return 2;
  return 1;
}

/** 题型标签阈值：该题型出现次数 >= 阈值则打对应标签 */
const TAG_THRESHOLDS = {
  高频: null, // 用百分位
  阅读词汇: 5,
  完形词汇: 3,
  翻译词汇: 3,
  新题型词汇: 3,
  写作词汇: 2,
};

/**
 * 标签列表。若 stats 来自预计算文件且含 tags 数组则直接返回，否则按题型阈值现场算。
 */
export function getSuggestedTagsFromStats(stats, allWords) {
  if (!stats || typeof stats !== 'object') return [];
  if (Array.isArray(stats.tags)) return stats.tags;
  const tags = [];
  const by = stats.by_section || {};
  const total = stats.total_count || 0;
  const words = allWords || {};
  const counts = Object.values(words).map((st) => st.total_count || 0).filter((n) => n > 0);
  if (counts.length > 0 && total > 0) {
    counts.sort((a, b) => b - a);
    const rank = counts.findIndex((c) => c <= total);
    const index = rank >= 0 ? rank : counts.length;
    const p = 1 - index / counts.length;
    if (p >= 0.75) tags.push('高频');
  }
  if ((by['阅读'] || 0) >= (TAG_THRESHOLDS['阅读词汇'] || 0)) tags.push('阅读词汇');
  if ((by['完形'] || 0) >= (TAG_THRESHOLDS['完形词汇'] || 0)) tags.push('完形词汇');
  if ((by['翻译'] || 0) >= (TAG_THRESHOLDS['翻译词汇'] || 0)) tags.push('翻译词汇');
  if ((by['新题型'] || 0) >= (TAG_THRESHOLDS['新题型词汇'] || 0)) tags.push('新题型词汇');
  if ((by['写作'] || 0) >= (TAG_THRESHOLDS['写作词汇'] || 0)) tags.push('写作词汇');
  return tags;
}
