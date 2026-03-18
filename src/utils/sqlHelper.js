/**
 * SQL 工具模块 - 统一处理 SQL 参数绑定和数据转换
 * 避免 db.js 和 masterDb.js 中的重复代码
 */

/**
 * 将值转换为 SQL 字面量
 * @param {*} value
 * @returns {string}
 */
export const sqlLiteral = (value) => {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : 'NULL';
  if (typeof value === 'boolean') return value ? '1' : '0';
  return `'${String(value).replace(/'/g, "''")}'`;
};

/**
 * 绑定 SQL 参数
 * @param {string} sql
 * @param {Array} params
 * @returns {string}
 */
export const bindSql = (sql, params = []) => {
  let i = 0;
  return String(sql).replace(/\?/g, () => sqlLiteral(params[i++]));
};

/**
 * 安全地将值转换为 JSON 字符串
 * @param {*} value
 * @param {*} fallback
 * @returns {string}
 */
export const toJsonString = (value, fallback = []) => {
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value ?? fallback);
  } catch (_) {
    return JSON.stringify(fallback);
  }
};

/**
 * 安全地解析 JSON 字符串
 * @param {string} jsonStr
 * @param {*} fallback
 * @returns {*}
 */
export const parseJsonSafe = (jsonStr, fallback = null) => {
  if (!jsonStr) return fallback;
  try {
    return JSON.parse(jsonStr);
  } catch (_) {
    return fallback;
  }
};

/**
 * 规范化数据库行（处理列名大小写不一致）
 * @param {object} row
 * @returns {object}
 */
export const normalizeRow = (row) => {
  if (!row || typeof row !== 'object') return row;
  const out = {};
  for (const k of Object.keys(row)) {
    out[k.toLowerCase()] = row[k];
  }
  return out;
};

/**
 * 构建 WHERE 条件和参数
 * @param {object} conditions - { field: value, ... }
 * @returns {{ where: string, params: Array }}
 */
export const buildWhereClause = (conditions = {}) => {
  const clauses = [];
  const params = [];

  for (const [field, value] of Object.entries(conditions)) {
    if (value === undefined) continue;

    if (value === null) {
      clauses.push(`${field} IS NULL`);
    } else if (Array.isArray(value)) {
      if (value.length === 0) continue;
      clauses.push(`${field} IN (${value.map(() => '?').join(',')})`);
      params.push(...value);
    } else {
      clauses.push(`${field} = ?`);
      params.push(value);
    }
  }

  return {
    where: clauses.length ? ' WHERE ' + clauses.join(' AND ') : '',
    params
  };
};

/**
 * 构建 SET 子句（用于 UPDATE）
 * @param {object} updates - { field: value, ... }
 * @returns {{ set: string, params: Array }}
 */
export const buildSetClause = (updates = {}) => {
  const clauses = [];
  const params = [];

  for (const [field, value] of Object.entries(updates)) {
    if (value === undefined) continue;
    clauses.push(`${field} = ?`);
    params.push(value);
  }

  return {
    set: clauses.join(', '),
    params
  };
};
