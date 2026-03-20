/**
 * 单词本来源：当前选中的单词本
 * - 云端/可编辑：自用单词(id=self) + 用户新建的单词本(id=uuid)，存云端或本地 storage
 * - 本地只读：红宝书、红宝书补全版、真题高频词、真题所有词，来自 CSV
 */

const STORAGE_KEY = 'currentWordbook';
const CLOUD_LIST_KEY = 'cloudWordbooks';
const SELF_ID = 'self';
const GUEST_DEFAULT_BOOK = '红宝书';
const LOGIN_DEFAULT_BOOK = SELF_ID;

const LOCAL_KEYS = ['红宝书', '红宝书补全版', '真题高频词', '真题所有词'];

export function getCloudWordbooks() {
  try {
    const raw = uni.getStorageSync(CLOUD_LIST_KEY);
    let list = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(list)) return [{ id: SELF_ID, name: '自用单词' }];

    // 移除重复的特殊单词本，以及旧的"收藏单词本"和多余的"收藏"
    list = list.filter((o, index, arr) => {
      // 移除旧的"收藏单词本"
      if (o.name === '收藏单词本') {
        return false;
      }
      // 移除名称为"收藏"但id不是'favorite'的单词本
      if (o.name === '收藏' && o.id !== 'favorite') {
        return false;
      }
      // 移除重复的特殊单词本
      if (o.id === 'mastered' || o.id === 'favorite') {
        return arr.findIndex(item => item.id === o.id) === index;
      }
      return true;
    });

    // 确保自用单词存在
    const hasSelf = list.some((o) => o.id === SELF_ID);
    if (!hasSelf) {
      list = [{ id: SELF_ID, name: '自用单词' }, ...list];
    }

    // 确保已斯单词本存在
    const hasMastered = list.some((o) => o.id === 'mastered');
    if (!hasMastered) {
      list = [...list, { id: 'mastered', name: '已斯单词本' }];
      uni.setStorageSync(CLOUD_LIST_KEY, JSON.stringify(list));
    }

    // 确保收藏单词本存在（使用 'favorite' id，名称为"收藏"）
    const hasFavorite = list.some((o) => o.id === 'favorite');
    if (!hasFavorite) {
      list = [...list, { id: 'favorite', name: '收藏' }];
      uni.setStorageSync(CLOUD_LIST_KEY, JSON.stringify(list));
    }

    return list;
  } catch (_) {
    return [{ id: SELF_ID, name: '自用单词' }, { id: 'mastered', name: '已斯单词本' }, { id: 'favorite', name: '收藏' }];
  }
}

export function setCloudWordbooks(list) {
  // 移除旧的"收藏单词本"和多余的"收藏"
  list = list.filter((o) => o.name !== '收藏单词本' && !(o.name === '收藏' && o.id !== 'favorite'));

  // 确保特殊单词本始终存在
  let finalList = list.filter((o) => o.id !== 'mastered' && o.id !== 'favorite');

  // 检查是否有自用单词
  const hasSelf = finalList.some((o) => o.id === SELF_ID);
  if (!hasSelf) {
    finalList = [{ id: SELF_ID, name: '自用单词' }, ...finalList];
  }

  // 添加特殊单词本到末尾
  finalList.push({ id: 'mastered', name: '已斯单词本' });
  finalList.push({ id: 'favorite', name: '收藏' });

  uni.setStorageSync(CLOUD_LIST_KEY, JSON.stringify(finalList));
}

export function addCloudWordbook(name) {
  const id = 'wb_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
  const list = getCloudWordbooks().filter((o) => o.id !== SELF_ID && o.id !== 'mastered' && o.id !== 'favorite');
  list.push({ id, name: (name || '').trim() || '未命名' });
  setCloudWordbooks([
    { id: SELF_ID, name: '自用单词' },
    ...list,
    { id: 'mastered', name: '已斯单词本' },
    { id: 'favorite', name: '收藏' }
  ]);
  return id;
}

export function removeCloudWordbook(id) {
  if (id === SELF_ID || id === 'mastered' || id === 'favorite') return;
  const list = getCloudWordbooks().filter((o) => o.id !== id);
  setCloudWordbooks(list);
  try {
    uni.removeStorageSync('wordbook_words_' + id);
  } catch (_) {}
}

function isLoggedIn() {
  try {
    return !!uni.getStorageSync('uid');
  } catch (_) {
    return false;
  }
}

function getDefaultWordbook() {
  return isLoggedIn() ? LOGIN_DEFAULT_BOOK : GUEST_DEFAULT_BOOK;
}

export function getCurrentWordbook() {
  try {
    let v = uni.getStorageSync(STORAGE_KEY);
    if (v === '自用单词') v = SELF_ID;
    if (LOCAL_KEYS.includes(v)) return v;
    if (v === SELF_ID) return isLoggedIn() ? SELF_ID : GUEST_DEFAULT_BOOK;
    const list = getCloudWordbooks();
    if (list.some((o) => o.id === v)) return isLoggedIn() ? v : GUEST_DEFAULT_BOOK;
    return getDefaultWordbook();
  } catch (_) {
    return getDefaultWordbook();
  }
}

export function setCurrentWordbook(idOrKey) {
  uni.setStorageSync(STORAGE_KEY, idOrKey);
}

export function isSelfWordbook() {
  return getCurrentWordbook() === SELF_ID;
}

export function isLocalWordbookKey(key) {
  return LOCAL_KEYS.includes(key);
}

/** 供选择页使用的完整列表：云端(自用+用户新建) + 本地只读 */
export function getWordbookListForUI() {
  const cloud = getCloudWordbooks();
  const local = LOCAL_KEYS.map((key) => ({ id: key, name: key, isLocal: true, canDelete: false }));
  return [
    ...cloud.map((o) => ({
      ...o,
      isLocal: false,
      canDelete: o.id !== SELF_ID && o.id !== 'mastered' && o.id !== 'favorite'
    })),
    ...local,
  ];
}

const WORDS_PREFIX = 'wordbook_words_';

/** 获取用户新建单词本的词表（仅非 self 的云端 id） */
export function getWordbookWords(id) {
  if (!id || id === SELF_ID) return [];
  try {
    const raw = uni.getStorageSync(WORDS_PREFIX + id);
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
}

/** 写入用户新建单词本的词表 */
export function setWordbookWords(id, words) {
  if (!id || id === SELF_ID) return;
  uni.setStorageSync(WORDS_PREFIX + id, JSON.stringify(words || []));
}

function parseCsvToWordList(text) {
  if (!text || typeof text !== 'string') return [];
  const lines = text.trim().split(/\r?\n/);
  const out = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const parts = line.split(',');
    if (parts.length >= 1 && parts[0].trim()) {
      out.push({
        english: parts[0].trim(),
        exam_count: parseInt(parts[1], 10) || 0,
        importance: parseInt(parts[2], 10) || 0,
      });
    }
  }
  return out;
}

/** 用 plus.io 读本地 CSV 文本（App 端） */
function loadCsvByPlusIo(fileName) {
  return new Promise((resolve) => {
    if (typeof plus === 'undefined' || !plus.io) {
      resolve(null);
      return;
    }
    const paths = ['_www/static/wordbooks/' + fileName, 'static/wordbooks/' + fileName];
    let tried = 0;
    const tryNext = () => {
      if (tried >= paths.length) {
        resolve(null);
        return;
      }
      const path = paths[tried++];
      plus.io.resolveLocalFileSystemURL(path, (entry) => {
        entry.file((file) => {
          const reader = new plus.io.FileReader();
          reader.onloadend = (e) => resolve(e.target?.result ?? null);
          reader.onerror = () => resolve(null);
          reader.readAsText(file, 'utf-8');
        }, () => tryNext());
      }, () => tryNext());
    };
    tryNext();
  });
}

/**
 * 加载本地单词本 CSV，返回 [{ english, exam_count, importance }, ...]
 * @param {string} key 红宝书 | 红宝书补全版 | 真题高频词 | 真题所有词
 * @returns {Promise<Array<{english: string, exam_count: number, importance: number}>>}
 */
export function loadLocalWordbook(key) {
  const fileName = key + '.csv';
  return new Promise((resolve) => {
    const onText = (text) => {
      if (text != null && typeof text !== 'string') text = String(text);
      const list = parseCsvToWordList(text);
      if (list.length === 0 && text != null) {
        console.warn('[wordbookSource] CSV 解析后为空，key=', key, 'textLen=', (text || '').length);
      }
      resolve(list);
    };

    // 1) App 端优先用 plus.io 读本地文件
    if (typeof plus !== 'undefined' && plus.io) {
      loadCsvByPlusIo(fileName).then((text) => {
        if (text != null) return onText(text);
        // 2) plus.io 失败则用 file URL 请求
        try {
          const fileUrl = plus.io.convertLocalFileSystemURL('_www/static/wordbooks/' + fileName);
          if (fileUrl) {
            uni.request({
              url: fileUrl,
              method: 'GET',
              dataType: 'text',
              success: (res) => {
                if (res.statusCode === 200) onText(res.data);
                else onText(null);
              },
              fail: () => onText(null),
            });
            return;
          }
        } catch (_) {}
        onText(null);
      });
      return;
    }

    // 3) H5 等：直接请求 /static/wordbooks/xxx.csv，要求返回文本
    uni.request({
      url: '/static/wordbooks/' + encodeURIComponent(fileName),
      method: 'GET',
      dataType: 'text',
      success: (res) => {
        if (res.statusCode === 200) onText(res.data);
        else onText(null);
      },
      fail: () => onText(null),
    });
  });
}
