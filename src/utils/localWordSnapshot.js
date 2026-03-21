/**
 * 本地单词快照模块 (localWordSnapshot.js)
 *
 * 功能：
 * - 从多个数据源（主库、预生成库）获取单词的完整信息
 * - 构建单词的快照（中文、例句、近义词等）
 * - 支持并行查询优化性能
 * - 合并多个数据源的信息
 *
 * 数据源：
 * 1. masterDb：真题数据库（中文、例句、统计信息）
 * 2. pregenVocab：预生成词库（中文、例句、近义词等）
 * 3. briefMap：简要信息映射（用户自定义或导入的信息）
 *
 * 使用场景：
 * - 显示单词详情时获取完整信息
 * - 复习时获取单词的例句和近义词
 * - 学习时获取单词的重要性和标签
 */

import * as masterDb from './masterDb.js';
import * as pregenVocab from './pregenVocab.js';

/**
 * 从词性和翻译列表构建简短的中文释义
 *
 * 功能：
 * - 将多个词性和翻译合并为一个字符串
 * - 最多取前 4 个翻译
 * - 用"；"分隔不同的词性
 *
 * @param {Array} defs - 词性和翻译数组，每项包含 pos（词性）和 trans（翻译）
 * @returns {string} 合并后的中文释义
 *
 * @example
 * const defs = [
 *   { pos: 'n.', trans: '名词' },
 *   { pos: 'v.', trans: '动词' }
 * ];
 * buildShortChineseFromDefs(defs);  // 返回 "n. 名词；v. 动词"
 */
export function buildShortChineseFromDefs(defs) {
  if (!Array.isArray(defs)) return '';
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

/**
 * 将标签字符串分割为数组
 *
 * 功能：
 * - 支持多种分隔符：逗号、中文逗号、空格
 * - 去除空白和空字符串
 * - 返回标签数组
 *
 * @param {string} tags - 标签字符串，如 "高频,阅读词汇 翻译词汇"
 * @returns {Array<string>} 标签数组
 *
 * @example
 * splitTags('高频,阅读词汇 翻译词汇');  // 返回 ['高频', '阅读词汇', '翻译词汇']
 */
function splitTags(tags) {
  if (!tags) return [];
  return String(tags)
    .split(/[,，\s]+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

/**
 * 获取单词的本地快照信息
 *
 * 功能：
 * - 从多个数据源获取单词的完整信息
 * - 优先级：briefMap > masterDb > pregenVocab
 * - 并行查询多个数据源，提升性能
 * - 合并来自不同源的信息（例句、近义词、标签等）
 *
 * 数据优先级：
 * - 中文释义：briefMap > masterDb > pregenVocab
 * - 例句：masterDb > pregenVocab
 * - 近义词/反义词：masterDb > pregenVocab
 * - 标签：briefMap + masterDb 合并
 * - 重要性：masterDb > briefMap
 *
 * @param {string} english - 单词英文
 * @param {object} options - 选项对象
 *   - briefMap: 简要信息映射，格式 { 'word': { chinese, tags, importance, ... } }
 * @returns {Promise<object>} 单词快照对象，包含：
 *   - chinese: 中文释义
 *   - examples: 例句数组
 *   - synonyms: 近义词数组
 *   - antonyms: 反义词数组
 *   - tags: 标签字符串
 *   - importance: 重要性（0-5）
 *   - examCount: 真题出现次数
 *
 * @example
 * const snapshot = await getLocalWordSnapshot('abandon', {
 *   briefMap: { 'abandon': { chinese: '放弃', tags: '高频' } }
 * });
 * // 返回 { chinese: '放弃', examples: [...], ... }
 */
export async function getLocalWordSnapshot(english, options = {}) {
  // 规范化单词（转小写、去空白）
  const key = String(english || '').trim().toLowerCase();
  if (!key) {
    // 返回空快照
    return {
      chinese: '',
      examples: [],
      synonyms: [],
      antonyms: [],
      tags: '',
      importance: undefined,
      examCount: 0,
    };
  }

  // 获取简要信息映射
  const briefMap = options.briefMap && typeof options.briefMap === 'object' ? options.briefMap : {};
  const brief = briefMap[key] && typeof briefMap[key] === 'object' ? briefMap[key] : null;

  // 并行查询两个库，减少等待时间
  // 使用 Promise.all 同时查询，而不是顺序查询
  const [detail, pregen] = await Promise.all([
    masterDb.getWordFullDetail(key).catch(() => null),  // 查询主库（真题数据）
    pregenVocab.getPregenWord(key).catch(() => null),   // 查询预生成库
  ]);

  const stats = detail?.examStats || null;

  const chinese =
    (brief?.chinese || '').trim() ||
    (detail?.chinese || '').trim() ||
    buildShortChineseFromDefs(detail?.defs) ||
    (pregen?.chinese || '').trim() ||
    '';

  const examples = Array.isArray(detail?.examples) && detail.examples.length
    ? detail.examples
    : (Array.isArray(pregen?.examples) ? pregen.examples : []);
  const synonyms = Array.isArray(detail?.synonyms) && detail.synonyms.length
    ? detail.synonyms
    : (Array.isArray(pregen?.synonyms) ? pregen.synonyms : []);
  const antonyms = Array.isArray(detail?.antonyms) && detail.antonyms.length
    ? detail.antonyms
    : (Array.isArray(pregen?.antonyms) ? pregen.antonyms : []);

  const tagSet = new Set([
    ...splitTags(brief?.tags || ''),
    ...(detail?.examStats?.tags && Array.isArray(detail.examStats.tags) ? detail.examStats.tags : []),
  ]);

  let importance;
  if (typeof detail?.examStats?.importance === 'number') {
    importance = detail.examStats.importance;
  } else if (typeof brief?.importance === 'number') {
    importance = brief.importance;
  } else if (typeof brief?.examCount === 'number') {
    importance = brief.examCount > 0 ? 1 : 0;
  }

  return {
    chinese,
    examples,
    synonyms,
    antonyms,
    tags: Array.from(tagSet).join(','),
    importance,
    examCount: typeof brief?.examCount === 'number'
      ? brief.examCount
      : (typeof detail?.examStats?.total_count === 'number' ? detail.examStats.total_count : 0),
  };
}
