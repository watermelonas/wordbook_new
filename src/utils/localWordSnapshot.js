import * as masterDb from './masterDb.js';
import * as pregenVocab from './pregenVocab.js';

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

function splitTags(tags) {
  if (!tags) return [];
  return String(tags)
    .split(/[,，\s]+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

export async function getLocalWordSnapshot(english, options = {}) {
  const key = String(english || '').trim().toLowerCase();
  if (!key) {
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

  const briefMap = options.briefMap && typeof options.briefMap === 'object' ? options.briefMap : {};
  const brief = briefMap[key] && typeof briefMap[key] === 'object' ? briefMap[key] : null;

  // 并行查询两个库，减少等待时间
  const [detail, pregen] = await Promise.all([
    masterDb.getWordFullDetail(key).catch(() => null),
    pregenVocab.getPregenWord(key).catch(() => null),
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
