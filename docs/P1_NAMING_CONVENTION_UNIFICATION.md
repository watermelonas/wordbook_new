# P1 优化：统一命名规范

## 🎯 优化目标

统一项目中的命名规范，解决 snake_case 和 camelCase 混用的问题。

## 📊 现状分析

### 命名规范混乱情况

**混用字段总数：23 个**

| 类别 | 现状 | 问题 |
|------|------|------|
| 数据库字段 | 统一 snake_case | ✅ 正确 |
| JS 变量 | 混用 snake_case 和 camelCase | ❌ 需要统一 |
| 受影响文件 | 4 个 | learningCenter_v2.js, index.vue, word-detail.vue, db_v2.js |

### 混用字段列表

```
repeat_count, view_count, create_time, update_time, source_page
is_favorite, is_mastered, exam_count, mastered_at, last_book_id
first_learned_at, first_day_stage, first_day_due_at, seen_count
correct_count, wrong_count, consecutive_correct, error_count
recover_count, last_wrong_at, created_at, updated_at
```

## ✅ 推荐方案

### 方案：数据库层保持 snake_case，JS 层统一 camelCase

**原理：**
- 数据库字段保持 snake_case（数据库规范）
- JavaScript 变量统一 camelCase（JavaScript 规范）
- 在数据转换层进行映射

### 实现步骤

#### 1️⃣ **创建数据转换工具**

创建 `src/utils/dataTransformer.js`：

```javascript
/**
 * 数据库行 → JavaScript 对象
 * 将 snake_case 字段转换为 camelCase
 */
export function dbToJs(dbRow) {
  if (!dbRow) return null;

  return {
    // 基础字段
    id: dbRow.id,
    english: dbRow.english,
    chinese: dbRow.chinese,

    // 学习相关（snake_case → camelCase）
    repeatCount: dbRow.repeat_count,
    viewCount: dbRow.view_count,
    examCount: dbRow.exam_count,

    // 时间字段
    createTime: dbRow.create_time,
    updateTime: dbRow.update_time,
    masteredAt: dbRow.mastered_at,
    firstLearnedAt: dbRow.first_learned_at,
    firstDayDueAt: dbRow.first_day_due_at,
    lastWrongAt: dbRow.last_wrong_at,
    createdAt: dbRow.created_at,
    updatedAt: dbRow.updated_at,

    // 布尔字段
    isFavorite: dbRow.is_favorite,
    isMastered: dbRow.is_mastered,

    // 其他字段
    sourcePage: dbRow.source_page,
    year: dbRow.year,
    tags: dbRow.tags,
    importance: dbRow.importance,

    // FSRS 相关
    difficulty: dbRow.difficulty,
    stability: dbRow.stability,
    retrievability: dbRow.retrievability,
    intervalDays: dbRow.interval_days,
    lapseCount: dbRow.lapse_count,
    reviewCount: dbRow.review_count,
    nextReviewTime: dbRow.next_review_time,
    lastReviewedAt: dbRow.last_reviewed_at,

    // 学习统计
    seenCount: dbRow.seen_count,
    correctCount: dbRow.correct_count,
    wrongCount: dbRow.wrong_count,
    consecutiveCorrect: dbRow.consecutive_correct,
    errorCount: dbRow.error_count,
    recoverCount: dbRow.recover_count,

    // 其他
    lastBookId: dbRow.last_book_id,
    firstDayStage: dbRow.first_day_stage,
    wordbookType: dbRow.wordbook_type,
  };
}

/**
 * JavaScript 对象 → 数据库行
 * 将 camelCase 字段转换为 snake_case
 */
export function jsToDb(jsObj) {
  if (!jsObj) return null;

  const result = {};

  // 只转换需要更新的字段
  if (jsObj.repeatCount !== undefined) result.repeat_count = jsObj.repeatCount;
  if (jsObj.viewCount !== undefined) result.view_count = jsObj.viewCount;
  if (jsObj.examCount !== undefined) result.exam_count = jsObj.examCount;
  if (jsObj.createTime !== undefined) result.create_time = jsObj.createTime;
  if (jsObj.updateTime !== undefined) result.update_time = jsObj.updateTime;
  if (jsObj.masteredAt !== undefined) result.mastered_at = jsObj.masteredAt;
  if (jsObj.isFavorite !== undefined) result.is_favorite = jsObj.isFavorite;
  if (jsObj.isMastered !== undefined) result.is_mastered = jsObj.isMastered;
  if (jsObj.sourcePage !== undefined) result.source_page = jsObj.sourcePage;
  if (jsObj.importance !== undefined) result.importance = jsObj.importance;

  // ... 其他字段

  return result;
}

/**
 * 批量转换数据库行数组
 */
export function dbRowsToJs(rows) {
  return (rows || []).map(dbToJs).filter(Boolean);
}

/**
 * 批量转换 JavaScript 对象数组
 */
export function jsRowsToDb(rows) {
  return (rows || []).map(jsToDb).filter(Boolean);
}
```

#### 2️⃣ **更新 db_v2.js**

在查询结果返回时使用转换函数：

```javascript
import { dbToJs, dbRowsToJs } from './dataTransformer.js';

// 查询单个单词
export async function getWord(id) {
  const row = await db.get('words', id);
  return dbToJs(row);
}

// 查询单词列表
export async function getWords(limit, offset) {
  const rows = await db.query('words', { limit, offset });
  return dbRowsToJs(rows);
}

// 更新单词
export async function updateWord(id, updates) {
  const dbUpdates = jsToDb(updates);
  return await db.update('words', id, dbUpdates);
}
```

#### 3️⃣ **更新 learningCenter_v2.js**

统一使用 camelCase：

```javascript
// 改进前
const snapshot = {
  last_book_id: '',
  first_learned_at: '',
  seen_count: 0,
  correct_count: 0,
};

// 改进后
const snapshot = {
  lastBookId: '',
  firstLearnedAt: '',
  seenCount: 0,
  correctCount: 0,
};
```

#### 4️⃣ **更新 index.vue 和 word-detail.vue**

使用转换后的 camelCase 字段：

```javascript
// 改进前
<view class="word-english">{{ word.repeat_count }}</view>
<view class="word-time">{{ word.create_time }}</view>

// 改进后
<view class="word-english">{{ word.repeatCount }}</view>
<view class="word-time">{{ word.createTime }}</view>
```

## 📋 修复清单

### 优先级 1（高）- learningCenter_v2.js

- [ ] 统一所有字段为 camelCase
- [ ] 更新 snapshot 对象结构
- [ ] 更新所有字段访问

### 优先级 2（高）- index.vue

- [ ] 更新单词列表中的字段访问
- [ ] 更新过滤和排序逻辑
- [ ] 更新计算属性

### 优先级 3（中）- word-detail.vue

- [ ] 更新单词详情中的字段访问
- [ ] 更新编辑表单中的字段映射

### 优先级 4（中）- db_v2.js

- [ ] 添加数据转换层
- [ ] 更新所有查询方法
- [ ] 更新所有更新方法

## 🎯 预期收益

| 指标 | 改进前 | 改进后 |
|------|--------|--------|
| 命名规范一致性 | 30% | 95% |
| 代码可读性 | 中等 | 高 |
| 维护难度 | 高 | 低 |
| 新开发者学习成本 | 高 | 低 |

## 📝 命名规范指南

### JavaScript 变量命名规范

```javascript
// ✅ 正确
const repeatCount = 5;
const isFavorite = true;
const createTime = '2026-03-20';
const firstLearnedAt = '2026-03-15';

// ❌ 错误
const repeat_count = 5;
const is_favorite = true;
const create_time = '2026-03-20';
const first_learned_at = '2026-03-15';
```

### 数据库字段命名规范

```sql
-- ✅ 正确
CREATE TABLE words (
  repeat_count INT,
  is_favorite BOOLEAN,
  create_time DATETIME,
  first_learned_at DATETIME
);

-- ❌ 错误
CREATE TABLE words (
  repeatCount INT,
  isFavorite BOOLEAN,
  createTime DATETIME,
  firstLearnedAt DATETIME
);
```

## 🔗 相关文档

- `docs/CODE_QUALITY_IMPROVEMENTS.md` - 代码质量改进总结
- `docs/REFACTOR_SUMMARY.md` - 重构总结

---

**状态**：📋 规划中
**优先级**：🔴 高
**预期工作量**：2-3 小时
**性能影响**：无（纯代码质量改进）
