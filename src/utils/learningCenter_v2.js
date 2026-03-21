/**
 * 学习中心模块 (learningCenter_v2.js)
 *
 * 功能：
 * - 管理用户的学习档案（学习进度、掌握度等）
 * - 管理错词本（记录答错的单词）
 * - 管理学习历史（复习记录）
 * - 计算学习统计（正确率、连续学习天数等）
 * - 生成学习建议
 *
 * 核心特性：
 * 1. 缓存机制：内存缓存 + 本地存储缓存，带过期机制
 * 2. 数据一致性：规范化数据格式，防止数据不一致
 * 3. 多词书支持：支持不同词书的独立学习档案
 * 4. FSRS 算法集成：使用 FSRS 算法计算复习间隔
 * 5. 性能优化：批量操作、缓存优化
 *
 * 数据结构：
 * - Profile：学习档案（单词的学习进度）
 * - Mistake：错词记录（答错的单词）
 * - History：学习历史（复习记录）
 * - Extra：额外信息（词族、搭配等）
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
import { logger } from './errorHandler.js';

// ========== 存储 key ==========
const PROFILE_KEY = 'learning_center_profiles_v2';  // 学习档案存储 key
const MISTAKE_KEY = 'learning_center_mistakes_v2';  // 错词本存储 key
const HISTORY_KEY = 'learning_center_history_v2';  // 学习历史存储 key
const EXTRA_KEY = 'learning_center_extra_v2';  // 额外信息存储 key

// ========== 缓存配置 ==========
const CACHE_TTL_MS = 5 * 60 * 1000;  // 内存缓存过期时间：5 分钟
const STORAGE_TTL_MS = 24 * 60 * 60 * 1000;  // 本地存储缓存过期时间：24 小时

// ========== 缓存实例 ==========
// 内存缓存（带过期机制）
const profilesMemCache = new MemoryCache(500, CACHE_TTL_MS);  // 最多缓存 500 个档案
const mistakesMemCache = new MemoryCache(200, CACHE_TTL_MS);  // 最多缓存 200 个错词

// 本地存储缓存（带过期机制）
const profilesStorageCache = new StorageCache(PROFILE_KEY, STORAGE_TTL_MS);
const mistakesStorageCache = new StorageCache(MISTAKE_KEY, STORAGE_TTL_MS);

/**
 * 安全读取本地存储
 * 处理 JSON 解析错误和类型检查
 * @param {string} key - 存储 key
 * @param {*} fallback - 读取失败时的默认值
 * @returns {*} 读取的值或默认值
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
    logger.error('learningCenter', `读取 ${key} 失败`, e);
    return fallback;
  }
};

/**
 * 安全写入本地存储
 * 处理 JSON 序列化错误
 * @param {string} key - 存储 key
 * @param {*} value - 要存储的值
 */
const safeWrite = (key, value) => {
  try {
    uni.setStorageSync(key, JSON.stringify(value));
  } catch (e) {
    logger.error('learningCenter', `写入 ${key} 失败`, e);
  }
};

/**
 * 规范化单词键
 * 统一为小写，用于作为 Map 的 key
 * @param {string|object} word - 单词字符串或单词对象
 * @returns {string} 规范化后的 key
 */
export const normalizeWordKey = (word) => {
  if (!word) return '';
  if (typeof word === 'string') return word.trim().toLowerCase();
  return String(word.english || '').trim().toLowerCase();
};

/**
 * 规范化学习档案
 * 确保所有字段都有正确的类型和默认值
 * @param {object} profile - 学习档案对象
 * @returns {object} 规范化后的档案
 */
export const normalizeProfile = (profile = {}) => {
  const key = normalizeWordKey(profile.english || profile.key || '');
  const bookIds = Array.isArray(profile.bookIds) ? [...new Set(profile.bookIds.filter(Boolean))] : [];
  const normalized = {
    key,
    english: String(profile.english || key || '').trim(),
    chinese: String(profile.chinese || '').trim(),
    importance: Number(profile.importance || 0) || 0,
    mastery: Number(profile.mastery || 0) || 0,
    seenCount: Math.max(0, Number(profile.seenCount || profile.seen_count || 0)),
    correctCount: Math.max(0, Number(profile.correctCount || profile.correct_count || 0)),
    wrongCount: Math.max(0, Number(profile.wrongCount || profile.wrong_count || 0)),
    consecutiveCorrect: Math.max(0, Number(profile.consecutiveCorrect || profile.consecutive_correct || 0)),
    firstLearnedAt: profile.firstLearnedAt || profile.first_learned_at || '',
    firstDayStage: Math.max(0, Number(profile.firstDayStage || profile.first_day_stage || 0)),
    firstDayDueAt: profile.firstDayDueAt || profile.first_day_due_at || '',
    bookIds,
    lastBookId: profile.lastBookId || profile.last_book_id || '',
    source: profile.source || '',
    createdAt: profile.createdAt || profile.created_at || '',
    updatedAt: profile.updatedAt || profile.updated_at || '',
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
  const stage = Math.max(0, Number(profile.firstDayStage || profile.first_day_stage || 0));
  const firstLearnedAt = profile.firstLearnedAt || profile.first_learned_at;

  if (!firstLearnedAt) {
    return {
      firstDayStage: 1,
      firstDayDueAt: new Date(now.getTime() + 10 * 60 * 1000).toISOString(),
      firstLearnedAt: now.toISOString(),
    };
  }
  if (!isCorrect) {
    return {
      firstDayStage: stage || 1,
      firstDayDueAt: new Date(now.getTime() + 20 * 60 * 1000).toISOString(),
      firstLearnedAt: firstLearnedAt,
    };
  }
  if (stage <= 1) {
    return {
      firstDayStage: 2,
      firstDayDueAt: new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString(),
      firstLearnedAt: firstLearnedAt,
    };
  }
  if (stage === 2) {
    return {
      firstDayStage: 3,
      firstDayDueAt: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      firstLearnedAt: firstLearnedAt,
    };
  }
  return {
    firstDayStage: 4,
    firstDayDueAt: '',
    firstLearnedAt: firstLearnedAt,
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
 * 初始化数据检查和修复（应用启动时调用）
 */
export const initializeDataIntegrity = async () => {
  try {
    const profiles = getProfilesMap();
    if (!profiles || Object.keys(profiles).length === 0) {
      logger.info('learningCenter', '没有档案数据需要检查');
      return;
    }

    // 检测问题
    let hasIssues = false;
    for (const [key, profile] of Object.entries(profiles)) {
      if (!profile || typeof profile !== 'object') {
        hasIssues = true;
        break;
      }
      if (!profile.english || typeof profile.english !== 'string') {
        hasIssues = true;
        break;
      }
    }

    if (hasIssues) {
      logger.warn('learningCenter', '检测到数据一致性问题，尝试修复');
      try {
        const { autoRepairStorageData } = await import('./dataRepair.js');
        const result = await autoRepairStorageData(
          PROFILE_KEY,
          () => getProfilesMap(),
          (repaired) => setProfilesMap(repaired)
        );
        if (result.success) {
          logger.info('learningCenter', '数据修复成功', result.report);
        } else {
          logger.warn('learningCenter', '数据修复失败', result);
        }
      } catch (e) {
        logger.error('learningCenter', '数据修复异常', e);
      }
    }
  } catch (e) {
    logger.error('learningCenter', '数据完整性检查失败', e);
  }
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
    updatedAt: new Date().toISOString(),
    createdAt: prev.createdAt || prev.created_at || new Date().toISOString(),
  });

  profiles[key] = next;
  setProfilesMap(profiles);
  return next;
};

/**
 * 记录复习结果（带事务保护和参数验证）
 */
export const recordReviewOutcome = (word, isCorrect, options = {}) => {
  const key = normalizeWordKey(word);
  if (!key) return null;

  // ✅ 参数验证
  if (typeof isCorrect !== 'boolean') {
    logger.error('learningCenter', '复习结果验证失败：isCorrect 必须是布尔值', { isCorrect });
    throw new Error('isCorrect 必须是布尔值');
  }

  const now = new Date();
  const bookId = options.bookId || getCurrentWordbook() || 'self';

  try {
    // 获取当前档案
    const prev = getWordProfile(word) || normalizeProfile({
      ...(typeof word === 'object' ? word : {}),
      english: typeof word === 'string' ? word : word.english,
      chinese: typeof word === 'object' ? word.chinese : '',
      importance: typeof word === 'object' ? word.importance : 0,
      createdAt: now.toISOString(),
    });

    // 计算新的复习状态
    const reviewState = scheduleReviewState({ ...prev, ...(typeof word === 'object' ? word : {}) }, isCorrect, now);
    const firstDayState = getFirstDayNextDue(prev, isCorrect, now);

    // 保存档案
    const next = saveWordProfile(word, {
      ...reviewState,
      mastery: calculateMastery({ ...prev, ...reviewState }),
      seenCount: prev.seenCount + 1,
      correctCount: prev.correctCount + (isCorrect ? 1 : 0),
      wrongCount: prev.wrongCount + (isCorrect ? 0 : 1),
      consecutiveCorrect: isCorrect ? prev.consecutiveCorrect + 1 : 0,
      chinese: (typeof word === 'object' && word.chinese) ? word.chinese : prev.chinese,
      importance: (typeof word === 'object' && word.importance != null) ? Number(word.importance) || 0 : prev.importance,
      bookIds: [...new Set([...(prev.bookIds || []), bookId])],
      lastBookId: bookId,
      source: options.source || 'review',
      firstLearnedAt: firstDayState.firstLearnedAt,
      firstDayStage: firstDayState.firstDayStage,
      firstDayDueAt: firstDayState.firstDayDueAt,
    });

    // 更新错误词记录
    const mistakes = getMistakesMap();
    const oldMistake = mistakes[key] || {
      key,
      english: next.english,
      chinese: next.chinese,
      errorCount: 0,
      recoverCount: 0,
      active: false,
      bookIds: [],
      lastWrongAt: '',
    };

    if (isCorrect) {
      oldMistake.recoverCount = Math.min(2, Number(oldMistake.recoverCount || 0) + 1);
      if (oldMistake.recoverCount >= 2) oldMistake.active = false;
    } else {
      oldMistake.errorCount = Number(oldMistake.errorCount || 0) + 1;
      oldMistake.recoverCount = 0;
      oldMistake.active = true;
      oldMistake.lastWrongAt = now.toISOString();
      oldMistake.chinese = next.chinese || oldMistake.chinese;
    }

    oldMistake.english = next.english;
    // ✅ 修复：确保 bookId 不为空才加入 bookIds
    if (bookId) {
      oldMistake.bookIds = [...new Set([...(oldMistake.bookIds || []), bookId])];
    }
    oldMistake.updatedAt = now.toISOString();
    mistakes[key] = oldMistake;
    setMistakesMap(mistakes);

    return next;
  } catch (error) {
    logger.error('[learningCenter] recordReviewOutcome 失败:', error);
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
    // ✅ 修复：如果指定了 bookId，则必须在 bookIds 中；如果没指定 bookId，则返回所有活跃错词
    .filter((item) => {
      if (!bookId) return true; // 没指定 bookId，返回所有
      return Array.isArray(item.bookIds) && item.bookIds.includes(bookId);
    })
    .sort((a, b) => {
      const diff = Number(b.errorCount || b.error_count || 0) - Number(a.errorCount || a.error_count || 0);
      if (diff !== 0) return diff;
      return new Date(b.lastWrongAt || b.last_wrong_at || 0) - new Date(a.lastWrongAt || a.last_wrong_at || 0);
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
    const key = getDayKey(item.createdAt || item.created_at);
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
    .sort((a, b) => new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at));
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

/**
 * 分页加载单词（优化内存占用）
 * @param {Array} allWords - 所有单词列表
 * @param {number} pageSize - 每页大小，默认 200
 * @param {number} pageIndex - 页码（从 0 开始）
 * @returns {Array} 该页的单词列表
 */
export const getWordsPage = (allWords, pageSize = 200, pageIndex = 0) => {
  if (!Array.isArray(allWords) || allWords.length === 0) {
    return [];
  }
  const start = pageIndex * pageSize;
  const end = start + pageSize;
  return allWords.slice(start, end);
};

/**
 * 获取总页数
 * @param {number} totalCount - 总单词数
 * @param {number} pageSize - 每页大小
 * @returns {number} 总页数
 */
export const getTotalPages = (totalCount, pageSize = 200) => {
  return Math.ceil(Math.max(0, totalCount) / pageSize);
};
