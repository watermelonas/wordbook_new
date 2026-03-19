/**
 * 改进的 learningCenter.js - 添加缓存过期机制和数据一致性保护
 * 解决缓存无过期机制和数据一致性问题
 */

import { getCurrentWordbook } from './wordbookSource.js';
import {
  REVIEW_DEFAULTS,
  clamp,
  normalizeReviewFields,
  computeElapsedDays,
  computeRetrievabilityByStability,
  scheduleReviewState,
  calculateMastery,
} from './reviewAlgo.js';
import { StorageCache, MemoryCache } from './cacheManager.js';

const PROFILE_KEY = 'learning_center_profiles_v2';
const MISTAKE_KEY = 'learning_center_mistakes_v2';
const HISTORY_KEY = 'learning_center_history_v2';
const EXTRA_KEY = 'learning_center_extra_v2';

// 缓存配置
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 分钟
const STORAGE_TTL_MS = 24 * 60 * 60 * 1000; // 24 小时

// 内存缓存（带过期机制）
const profilesMemCache = new MemoryCache(500, CACHE_TTL_MS);
const mistakesMemCache = new MemoryCache(200, CACHE_TTL_MS);

// 本地存储缓存（带过期机制）
const profilesStorageCache = new StorageCache(PROFILE_KEY, STORAGE_TTL_MS);
const mistakesStorageCache = new StorageCache(MISTAKE_KEY, STORAGE_TTL_MS);

/**
 * 安全读取本地存储
 */
const safeRead = (key, fallback) => {
  try {
    const raw = uni.getStorageSync(key);
    if (!raw) return fallback;
    if (typeof raw === 'string') {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : fallback;
    }
    return raw && typeof raw === 'object' ? raw : fallback;
  } catch (e) {
    console.error(`[learningCenter] 读取 ${key} 失败:`, e);
    return fallback;
  }
};

/**
 * 安全写入本地存储
 */
const safeWrite = (key, value) => {
  try {
    uni.setStorageSync(key, JSON.stringify(value));
  } catch (e) {
    console.error(`[learningCenter] 写入 ${key} 失败:`, e);
  }
};

/**
 * 规范化单词键
 */
export const normalizeWordKey = (word) => {
  if (!word) return '';
  if (typeof word === 'string') return word.trim().toLowerCase();
  return String(word.english || '').trim().toLowerCase();
};

/**
 * 规范化学习档案
 */
const normalizeProfile = (profile = {}) => {
  const key = normalizeWordKey(profile.english || profile.key || '');
  const bookIds = Array.isArray(profile.bookIds) ? [...new Set(profile.bookIds.filter(Boolean))] : [];
  const normalized = {
    key,
    english: String(profile.english || key || '').trim(),
    chinese: String(profile.chinese || '').trim(),
    importance: Number(profile.importance || 0) || 0,
    mastery: Number(profile.mastery || 0) || 0,
    seen_count: Math.max(0, Number(profile.seen_count || 0)),
    correct_count: Math.max(0, Number(profile.correct_count || 0)),
    wrong_count: Math.max(0, Number(profile.wrong_count || 0)),
    consecutive_correct: Math.max(0, Number(profile.consecutive_correct || 0)),
    first_learned_at: profile.first_learned_at || '',
    first_day_stage: Math.max(0, Number(profile.first_day_stage || 0)),
    first_day_due_at: profile.first_day_due_at || '',
    bookIds,
    last_book_id: profile.last_book_id || '',
    source: profile.source || '',
    created_at: profile.created_at || '',
    updated_at: profile.updated_at || '',
    ...normalizeReviewFields(profile),
  };
  normalized.mastery = normalized.mastery || calculateMastery(normalized);
  return normalized;
};

/**
 * 获取档案 Map（带缓存）
 */
const getProfilesMap = () => {
  // 先查内存缓存
  const memKey = '__profiles_map';
  if (profilesMemCache.has(memKey)) {
    return profilesMemCache.get(memKey, {});
  }

  // 再查本地存储
  const map = safeRead(PROFILE_KEY, {});
  profilesMemCache.set(memKey, map);
  return map;
};

/**
 * 设置档案 Map（同时更新内存和存储）
 */
const setProfilesMap = (map) => {
  profilesMemCache.set('__profiles_map', map || {});
  safeWrite(PROFILE_KEY, map || {});
};

/**
 * 获取错误词 Map（带缓存）
 */
const getMistakesMap = () => {
  const memKey = '__mistakes_map';
  if (mistakesMemCache.has(memKey)) {
    return mistakesMemCache.get(memKey, {});
  }

  const map = safeRead(MISTAKE_KEY, {});
  mistakesMemCache.set(memKey, map);
  return map;
};

/**
 * 设置错误词 Map（同时更新内存和存储）
 */
const setMistakesMap = (map) => {
  mistakesMemCache.set('__mistakes_map', map || {});
  safeWrite(MISTAKE_KEY, map || {});
};

/**
 * 获取历史列表
 */
const getHistoryList = () => {
  const list = safeRead(HISTORY_KEY, []);
  return Array.isArray(list) ? list : [];
};

/**
 * 设置历史列表（保留最近 400 条）
 */
const setHistoryList = (list) => safeWrite(HISTORY_KEY, Array.isArray(list) ? list.slice(-400) : []);

/**
 * 获取额外信息 Map
 */
const getExtraMap = () => safeRead(EXTRA_KEY, {});

/**
 * 设置额外信息 Map
 */
const setExtraMap = (map) => safeWrite(EXTRA_KEY, map || {});

/**
 * 计算首日复习下一次到期时间
 */
const getFirstDayNextDue = (profile, isCorrect, now = new Date()) => {
  const stage = Math.max(0, Number(profile.first_day_stage || 0));
  if (!profile.first_learned_at) {
    return {
      first_day_stage: 1,
      first_day_due_at: new Date(now.getTime() + 10 * 60 * 1000).toISOString(),
      first_learned_at: now.toISOString(),
    };
  }
  if (!isCorrect) {
    return {
      first_day_stage: stage || 1,
      first_day_due_at: new Date(now.getTime() + 20 * 60 * 1000).toISOString(),
      first_learned_at: profile.first_learned_at,
    };
  }
  if (stage <= 1) {
    return {
      first_day_stage: 2,
      first_day_due_at: new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString(),
      first_learned_at: profile.first_learned_at,
    };
  }
  if (stage === 2) {
    return {
      first_day_stage: 3,
      first_day_due_at: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      first_learned_at: profile.first_learned_at,
    };
  }
  return {
    first_day_stage: 4,
    first_day_due_at: '',
    first_learned_at: profile.first_learned_at,
  };
};

/**
 * 获取单词档案
 */
export const getWordProfile = (word) => {
  const key = normalizeWordKey(word);
  if (!key) return null;
  const map = getProfilesMap();
  return map[key] ? normalizeProfile(map[key]) : null;
};

/**
 * 获取所有档案
 */
export const getAllProfiles = () => {
  const map = getProfilesMap();
  return Object.values(map).map((item) => normalizeProfile(item)).filter((item) => item.key);
};

/**
 * 保存单词档案
 */
export const saveWordProfile = (word, patch = {}) => {
  const key = normalizeWordKey(word);
  if (!key) return null;

  const profiles = getProfilesMap();
  const prev = normalizeProfile(profiles[key] || { key, english: typeof word === 'string' ? word : word.english });
  const next = normalizeProfile({
    ...prev,
    ...(typeof word === 'object' ? word : {}),
    ...patch,
    key,
    english: typeof word === 'string' ? word : (word.english || prev.english),
    updated_at: new Date().toISOString(),
    created_at: prev.created_at || new Date().toISOString(),
  });

  profiles[key] = next;
  setProfilesMap(profiles);
  return next;
};

/**
 * 记录复习结果（带事务保护）
 */
export const recordReviewOutcome = (word, isCorrect, options = {}) => {
  const key = normalizeWordKey(word);
  if (!key) return null;

  const now = new Date();
  const bookId = options.bookId || getCurrentWordbook() || 'self';

  try {
    // 获取当前档案
    const prev = getWordProfile(word) || normalizeProfile({
      ...(typeof word === 'object' ? word : {}),
      english: typeof word === 'string' ? word : word.english,
      chinese: typeof word === 'object' ? word.chinese : '',
      importance: typeof word === 'object' ? word.importance : 0,
      created_at: now.toISOString(),
    });

    // 计算新的复习状态
    const reviewState = scheduleReviewState({ ...prev, ...(typeof word === 'object' ? word : {}) }, isCorrect, now);
    const firstDayState = getFirstDayNextDue(prev, isCorrect, now);

    // 保存档案
    const next = saveWordProfile(word, {
      ...reviewState,
      mastery: calculateMastery({ ...prev, ...reviewState }),
      seen_count: prev.seen_count + 1,
      correct_count: prev.correct_count + (isCorrect ? 1 : 0),
      wrong_count: prev.wrong_count + (isCorrect ? 0 : 1),
      consecutive_correct: isCorrect ? prev.consecutive_correct + 1 : 0,
      chinese: (typeof word === 'object' && word.chinese) ? word.chinese : prev.chinese,
      importance: (typeof word === 'object' && word.importance != null) ? Number(word.importance) || 0 : prev.importance,
      bookIds: [...new Set([...(prev.bookIds || []), bookId])],
      last_book_id: bookId,
      source: options.source || 'review',
      first_learned_at: firstDayState.first_learned_at,
      first_day_stage: firstDayState.first_day_stage,
      first_day_due_at: firstDayState.first_day_due_at,
    });

    // 更新错误词记录
    const mistakes = getMistakesMap();
    const oldMistake = mistakes[key] || {
      key,
      english: next.english,
      chinese: next.chinese,
      error_count: 0,
      recover_count: 0,
      active: false,
      bookIds: [],
      last_wrong_at: '',
    };

    if (isCorrect) {
      oldMistake.recover_count = Math.min(2, Number(oldMistake.recover_count || 0) + 1);
      if (oldMistake.recover_count >= 2) oldMistake.active = false;
    } else {
      oldMistake.error_count = Number(oldMistake.error_count || 0) + 1;
      oldMistake.recover_count = 0;
      oldMistake.active = true;
      oldMistake.last_wrong_at = now.toISOString();
      oldMistake.chinese = next.chinese || oldMistake.chinese;
    }

    oldMistake.english = next.english;
    oldMistake.bookIds = [...new Set([...(oldMistake.bookIds || []), bookId])];
    oldMistake.updated_at = now.toISOString();
    mistakes[key] = oldMistake;
    setMistakesMap(mistakes);

    // 异步上传到云端（不阻塞UI）
    if (typeof uni !== 'undefined' && uni.getStorageSync('uid')) {
      try {
        const cloudSync = (await import('./cloudProgressSync.js')).default;
        cloudSync.uploadProgress(bookId).catch(e => {
          console.warn('[learningCenter] 云端同步失败:', e);
        });
      } catch (e) {
        console.warn('[learningCenter] 无法加载云端同步模块:', e);
      }
    }

    return next;
  } catch (error) {
    console.error('[learningCenter] recordReviewOutcome 失败:', error);
    return null;
  }
};

/**
 * 记录新学单词
 */
export const noteNewWordLearned = (word, options = {}) => {
  const now = new Date();
  return saveWordProfile(word, {
    bookIds: [options.bookId || getCurrentWordbook() || 'self'],
    source: options.source || 'quick-add',
    first_learned_at: now.toISOString(),
    first_day_stage: 1,
    first_day_due_at: new Date(now.getTime() + 10 * 60 * 1000).toISOString(),
    mastery: 8,
  });
};

/**
 * 清除错误记录
 */
export const clearMistake = (word) => {
  const key = normalizeWordKey(word);
  if (!key) return;

  const mistakes = getMistakesMap();
  if (!mistakes[key]) return;

  mistakes[key] = {
    ...mistakes[key],
    active: false,
    recover_count: 2,
    updated_at: new Date().toISOString(),
  };
  setMistakesMap(mistakes);
};

/**
 * 获取错误词列表
 */
export const getMistakeWords = (bookId = '', onlyActive = true) => {
  const mistakes = Object.values(getMistakesMap() || {});
  return mistakes
    .filter((item) => item && item.english)
    .filter((item) => !onlyActive || !!item.active)
    .filter((item) => !bookId || (Array.isArray(item.bookIds) && item.bookIds.includes(bookId)))
    .sort((a, b) => {
      const diff = Number(b.error_count || 0) - Number(a.error_count || 0);
      if (diff !== 0) return diff;
      return new Date(b.last_wrong_at || 0) - new Date(a.last_wrong_at || 0);
    });
};

/**
 * 获取到期的档案
 */
export const getDueProfilesForWords = (words = [], bookId = '', now = new Date()) => {
  const nowMs = now.getTime();
  return (Array.isArray(words) ? words : [])
    .map((item) => {
      const profile = getWordProfile(item);
      if (!profile) return null;
      if (bookId && Array.isArray(profile.bookIds) && profile.bookIds.length && !profile.bookIds.includes(bookId)) return null;
      const reviewDueMs = profile.next_review_time ? new Date(profile.next_review_time).getTime() : Infinity;
      const firstDayDueMs = profile.first_day_due_at ? new Date(profile.first_day_due_at).getTime() : Infinity;
      const dueMs = Math.min(reviewDueMs, firstDayDueMs);
      if (!Number.isFinite(dueMs) || dueMs > nowMs) return null;
      return {
        ...profile,
        dueMs,
        overdueMs: Math.max(0, nowMs - dueMs),
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.overdueMs - a.overdueMs);
};

/**
 * 获取学习仪表板
 */
export const getLearningDashboard = (words = [], bookId = '', options = {}) => {
  const now = options.now ? new Date(options.now) : new Date();
  const dueProfiles = getDueProfilesForWords(words, bookId, now);
  const mistakes = getMistakeWords(bookId, true);
  const profiles = (Array.isArray(words) ? words : [])
    .map((item) => getWordProfile(item))
    .filter(Boolean);

  const masteryBuckets = {
    strong: 0,
    normal: 0,
    weak: 0,
    danger: 0,
  };

  profiles.forEach((item) => {
    const mastery = Number(item.mastery || 0);
    if (mastery >= 80) masteryBuckets.strong++;
    else if (mastery >= 60) masteryBuckets.normal++;
    else if (mastery >= 35) masteryBuckets.weak++;
    else masteryBuckets.danger++;
  });

  const firstDayDue = dueProfiles.filter((item) => item.first_day_due_at && Number(item.first_day_stage || 0) > 0 && Number(item.first_day_stage || 0) < 4).length;
  const overdueCount = dueProfiles.filter((item) => item.dueMs < now.getTime()).length;

  return {
    dueCount: dueProfiles.length,
    overdueCount,
    mistakeCount: mistakes.length,
    firstDayDue,
    masteryBuckets,
    reviewedCount: profiles.length,
    latestMistakes: mistakes.slice(0, 5),
  };
};

/**
 * 记录学习会话
 */
export const logStudySession = (session = {}) => {
  const list = getHistoryList();
  list.push({
    id: `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}_${Math.floor(Math.random() * 10000)}`,
    created_at: new Date().toISOString(),
    bookId: session.bookId || getCurrentWordbook() || 'self',
    mode: session.mode || '',
    preset: session.preset || 'default',
    reviewedCount: Number(session.reviewedCount || 0),
    correctCount: Number(session.correctCount || 0),
    wrongCount: Number(session.wrongCount || 0),
    masteryBefore: Number(session.masteryBefore || 0),
    masteryAfter: Number(session.masteryAfter || 0),
    newCount: Number(session.newCount || 0),
    oldCount: Number(session.oldCount || 0),
    mistakeCount: Number(session.mistakeCount || 0),
  });
  setHistoryList(list);

  // 异步上传到云端（不阻塞UI）
  if (typeof uni !== 'undefined' && uni.getStorageSync('uid')) {
    try {
      const bookId = session.bookId || getCurrentWordbook() || 'self';
      const cloudSync = (await import('./cloudProgressSync.js')).default;
      cloudSync.uploadProgress(bookId).catch(e => {
        console.warn('[learningCenter] 会话同步失败:', e);
      });
    } catch (e) {
      console.warn('[learningCenter] 无法加载云端同步模块:', e);
    }
  }
};

/**
 * 获取日期键
 */
const getDayKey = (dateLike) => {
  const date = new Date(dateLike);
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/**
 * 获取学习统计
 */
export const getStudyStats = (words = [], bookId = '') => {
  const history = getHistoryList()
    .filter((item) => !bookId || item.bookId === bookId);
  const dashboard = getLearningDashboard(words, bookId);
  const recentMap = {};

  history.forEach((item) => {
    const key = getDayKey(item.created_at);
    if (!recentMap[key]) {
      recentMap[key] = { day: key, reviewedCount: 0, correctCount: 0, wrongCount: 0 };
    }
    recentMap[key].reviewedCount += Number(item.reviewedCount || 0);
    recentMap[key].correctCount += Number(item.correctCount || 0);
    recentMap[key].wrongCount += Number(item.wrongCount || 0);
  });

  const trend = Object.values(recentMap).sort((a, b) => a.day.localeCompare(b.day)).slice(-7);
  let streak = 0;
  let cursor = new Date();

  while (true) {
    const key = getDayKey(cursor);
    if (!recentMap[key]) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return {
    ...dashboard,
    totalSessions: history.length,
    totalReviewed: history.reduce((sum, item) => sum + Number(item.reviewedCount || 0), 0),
    totalCorrect: history.reduce((sum, item) => sum + Number(item.correctCount || 0), 0),
    totalWrong: history.reduce((sum, item) => sum + Number(item.wrongCount || 0), 0),
    streak,
    trend,
  };
};

/**
 * 获取最后一个会话
 */
export const getLatestSession = (bookId = '') => {
  const history = getHistoryList()
    .filter((item) => !bookId || item.bookId === bookId)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return history[0] || null;
};

/**
 * 获取单词额外信息
 */
export const getWordExtra = (word) => {
  const key = normalizeWordKey(word);
  if (!key) return {};
  const extras = getExtraMap();
  return extras[key] || {};
};

/**
 * 保存单词额外信息
 */
export const saveWordExtra = (word, patch = {}) => {
  const key = normalizeWordKey(word);
  if (!key) return {};

  const extras = getExtraMap();
  const prev = extras[key] || {};
  const next = {
    ...prev,
    ...patch,
    updated_at: new Date().toISOString(),
  };
  extras[key] = next;
  setExtraMap(extras);
  return next;
};

/**
 * 清理过期缓存
 */
export const cleanupExpiredCaches = () => {
  profilesMemCache.cleanup();
  mistakesMemCache.cleanup();
};
