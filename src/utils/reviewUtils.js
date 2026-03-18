/**
 * 复习模块的共享工具函数
 * 这些函数是纯函数，不依赖组件状态
 */

/**
 * 获取单词的规范化 key（用于去重和比较）
 */
export const getWordKey = (word) => {
  if (!word) return '';
  const english = typeof word === 'string' ? word : word.english;
  return String(english || '').trim().toLowerCase();
};

/**
 * 获取唯一的单词 key 列表（去重）
 */
export const uniqueWordKeys = (list) => {
  if (!Array.isArray(list)) return [];
  return [...new Set(list.map((item) => getWordKey(item)).filter(Boolean))];
};

/**
 * 获取今天的日期 key（格式：YYYY-MM-DD）
 */
export const getTodayKey = () => {
  const d = new Date();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
};

/**
 * 规范化计划条目
 */
export const normalizePlanEntry = (entry = {}) => ({
  completed: Math.max(0, Number(entry.completed || 0)),
  learnedKeys: uniqueWordKeys(entry.learnedKeys),
  roundReviewedKeys: uniqueWordKeys(entry.roundReviewedKeys || entry.completedKeys),
  todayKey: typeof entry.todayKey === 'string' ? entry.todayKey : '',
  todayKeys: uniqueWordKeys(entry.todayKeys),
  updatedAt: Number(entry.updatedAt || Date.now()),
});

/**
 * 过滤单词列表（根据 key 集合）
 */
export const filterWordsByKeys = (list, keySet) => {
  const set = keySet instanceof Set ? keySet : new Set(keySet || []);
  return (list || []).filter((item) => set.has(getWordKey(item)));
};

/**
 * Fisher-Yates 洗牌算法
 */
export const shuffleList = (list) => {
  const arr = Array.isArray(list) ? [...list] : [];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

/**
 * 获取复习进度的存储 key
 */
export const getReviewProgressKey = () => {
  const bookId = typeof uni !== 'undefined' ? uni.getStorageSync('currentWordbook') || 'self' : 'self';
  return `review_progress_${bookId}`;
};

/**
 * 获取复习计划的存储 key
 */
export const REVIEW_PLAN_KEY = 'reviewPlanByBook_v2';

/**
 * 加载计划存储
 */
export const loadPlanStore = () => {
  try {
    const raw = uni.getStorageSync(REVIEW_PLAN_KEY);
    if (!raw) return {};
    if (typeof raw === 'string') {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    }
    return raw && typeof raw === 'object' ? raw : {};
  } catch (_) {
    return {};
  }
};

/**
 * 保存计划存储
 */
export const savePlanStore = (obj) => {
  try {
    uni.setStorageSync(REVIEW_PLAN_KEY, JSON.stringify(obj || {}));
  } catch (_) {}
};

/**
 * 获取计划条目
 */
export const getPlanEntry = (bookId) => {
  const store = loadPlanStore();
  return normalizePlanEntry(store[bookId] || {});
};

/**
 * 保存计划条目
 */
export const savePlanEntry = (bookId, entry) => {
  const store = loadPlanStore();
  const next = normalizePlanEntry(entry);
  store[bookId] = next;
  savePlanStore(store);
  return next;
};

/**
 * 交错排列新旧单词
 */
export const interleaveOldWords = (freshWords, oldWords, count) => {
  const fresh = shuffleList(freshWords).map((item) => ({ ...item, __isOldReview: false }));
  const old = shuffleList(oldWords).map((item) => ({ ...item, __isOldReview: true }));
  const result = [];
  const step = Math.max(2, Math.round(fresh.length / Math.max(old.length, 1)));
  let freshIndex = 0;
  let oldIndex = 0;

  while (result.length < count && (freshIndex < fresh.length || oldIndex < old.length)) {
    let pushedFresh = 0;
    while (freshIndex < fresh.length && pushedFresh < step && result.length < count) {
      result.push(fresh[freshIndex++]);
      pushedFresh++;
    }
    if (oldIndex < old.length && result.length < count) {
      result.push(old[oldIndex++]);
    }
  }
  return result.slice(0, count);
};

/**
 * 计算旧单词复习配额
 */
export const getOldReviewQuota = (count, oldPoolSize, newPoolSize) => {
  if (oldPoolSize <= 0) return 0;
  if (newPoolSize <= 0) return Math.min(count, oldPoolSize);
  return Math.min(oldPoolSize, Math.max(2, Math.min(count - 1, Math.round(count * 0.25))));
};
