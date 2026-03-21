# 数据库设计文档

## 1. 数据库概览

### 1.1 数据库分类

本应用使用多个数据库，各司其职：

| 数据库 | 类型 | 位置 | 用途 | 更新方式 |
|--------|------|------|------|---------|
| **wordbook.db** | SQLite | `_doc/wordbook.db` | 用户自定义单词本 | 实时更新 |
| **vocal_master.db** | SQLite | `_doc/vocal_master.db` | 统一主库（真题+预生成+字典） | 手动重建 |
| **pregen_data.db** | SQLite | `_doc/pregen_data.db` | 预生成词库 | 手动重建 |
| **localStorage** | 键值存储 | 浏览器 | H5 环境数据 | 实时更新 |
| **uniCloud** | 云数据库 | 云端 | 云端备份和同步 | 实时同步 |

### 1.2 初始化流程

```
App 启动
  ↓
App.vue onLaunch
  ↓
db.init()
  ├─ 检测环境（App / H5）
  ├─ 创建 wordbook.db（如不存在）
  ├─ 创建表结构
  └─ 初始化完成
  ↓
masterDb.init()（首次访问时）
  ├─ 检查 _doc/vocal_master.db 是否存在
  ├─ 不存在则从 static/vocal_master.db 复制
  ├─ 打开数据库
  └─ 验证表结构
```

## 2. wordbook.db 设计

### 2.1 words 表（主表）

存储用户自定义的单词本数据。

```sql
CREATE TABLE words (
  -- 基础字段
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  english TEXT UNIQUE NOT NULL,
  chinese TEXT,

  -- 内容字段
  tags TEXT,                    -- JSON 数组，如 ["高频", "阅读"]
  examples TEXT,                -- JSON 数组，例句
  synonyms TEXT,                -- JSON 数组，同义词
  antonyms TEXT,                -- JSON 数组，反义词

  -- 来源字段
  source_page TEXT,             -- 来源页码，如 "reading_2024_part1"
  year INTEGER,                 -- 来源年份，如 2024

  -- 重要程度和难度
  importance INTEGER DEFAULT 0, -- 重要程度 0-5，0 表示未设置

  -- 复习相关字段（FSRS 算法）
  difficulty_score REAL DEFAULT 0.5,    -- 难度系数 0.15-0.98
  stability REAL DEFAULT 1,              -- 稳定性（天数）
  retrievability REAL DEFAULT 0.9,       -- 可检索性 0.05-0.99
  interval_days INTEGER DEFAULT 0,       -- 复习间隔（天）
  lapse_count INTEGER DEFAULT 0,         -- 错误次数
  review_count INTEGER DEFAULT 0,        -- 复习次数
  next_review_time TEXT,                 -- 下次复习时间 ISO 8601
  last_reviewed_at TEXT,                 -- 上次复习时间 ISO 8601

  -- 统计字段
  view_count INTEGER DEFAULT 0,          -- 查看次数

  -- 时间戳
  create_time TEXT NOT NULL,             -- 创建时间 ISO 8601
  update_time TEXT NOT NULL              -- 更新时间 ISO 8601
);

-- 创建索引
CREATE INDEX idx_english ON words(english);
CREATE INDEX idx_next_review_time ON words(next_review_time);
CREATE INDEX idx_create_time ON words(create_time);
```

### 2.2 mastered_words 表（已掌握单词）

存储用户已掌握的单词，与 words 表结构相同。

```sql
CREATE TABLE mastered_words (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  english TEXT UNIQUE NOT NULL,
  chinese TEXT,
  tags TEXT,
  examples TEXT,
  synonyms TEXT,
  antonyms TEXT,
  source_page TEXT,
  year INTEGER,
  importance INTEGER DEFAULT 0,
  difficulty_score REAL DEFAULT 0.5,
  stability REAL DEFAULT 1,
  retrievability REAL DEFAULT 0.9,
  interval_days INTEGER DEFAULT 0,
  lapse_count INTEGER DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  next_review_time TEXT,
  last_reviewed_at TEXT,
  view_count INTEGER DEFAULT 0,
  create_time TEXT NOT NULL,
  update_time TEXT NOT NULL,
  mastered_at TEXT                       -- 标记为已掌握的时间
);

CREATE INDEX idx_english_mastered ON mastered_words(english);
CREATE INDEX idx_mastered_at ON mastered_words(mastered_at);
```

### 2.3 字段说明

#### 基础字段
- **id**: 主键，自增
- **english**: 英文单词，唯一约束
- **chinese**: 中文释义

#### 内容字段
- **tags**: JSON 数组，标签，如 `["高频", "阅读", "2024"]`
- **examples**: JSON 数组，例句，如 `[{"sentence": "...", "translation": "..."}, ...]`
- **synonyms**: JSON 数组，同义词，如 `["word1", "word2"]`
- **antonyms**: JSON 数组，反义词，如 `["word1", "word2"]`

#### 来源字段
- **source_page**: 来源页码，用于追溯原文
- **year**: 来源年份，用于统计

#### 重要程度
- **importance**: 0-5 级，0 表示未设置，5 表示最重要

#### FSRS 复习字段
- **difficulty_score**: 难度系数，范围 0.15-0.98
  - 0.15-0.3：简单
  - 0.3-0.6：中等
  - 0.6-0.98：困难
- **stability**: 稳定性，单位为天
  - 初始值：1 天
  - 答对时增加
  - 答错时减少
- **retrievability**: 可检索性，范围 0.05-0.99
  - 表示能回忆起单词的概率
  - 根据稳定性和经过天数计算
- **interval_days**: 复习间隔，单位为天
  - 下次复习距离现在的天数
- **lapse_count**: 错误次数
  - 用于判断单词是否需要重点复习
- **review_count**: 复习次数
  - 用于统计学习进度
- **next_review_time**: 下次复习时间
  - ISO 8601 格式，如 `2026-03-25T10:30:00Z`
- **last_reviewed_at**: 上次复习时间
  - ISO 8601 格式

#### 统计字段
- **view_count**: 查看次数
  - 用于统计学习热度

#### 时间戳
- **create_time**: 创建时间，ISO 8601 格式
- **update_time**: 更新时间，ISO 8601 格式

### 2.4 数据示例

```json
{
  "id": 1,
  "english": "example",
  "chinese": "例子，示例",
  "tags": ["高频", "阅读", "2024"],
  "examples": [
    {
      "sentence": "For example, the study shows...",
      "translation": "例如，这项研究表明..."
    }
  ],
  "synonyms": ["instance", "sample"],
  "antonyms": [],
  "source_page": "reading_2024_part1",
  "year": 2024,
  "importance": 4,
  "difficulty_score": 0.45,
  "stability": 5.2,
  "retrievability": 0.85,
  "interval_days": 3,
  "lapse_count": 1,
  "review_count": 5,
  "next_review_time": "2026-03-25T10:30:00Z",
  "last_reviewed_at": "2026-03-22T10:30:00Z",
  "view_count": 12,
  "create_time": "2026-03-10T08:00:00Z",
  "update_time": "2026-03-22T10:30:00Z"
}
```

## 3. vocal_master.db 设计

### 3.1 vocab_master 表

统一主库，包含真题、预生成词库、字典数据的合并。

```sql
CREATE TABLE vocab_master (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  english TEXT UNIQUE NOT NULL,
  chinese TEXT,
  data_json TEXT,                        -- 包含 examples, synonyms, antonyms, examStats, examSentences
  create_time TEXT
);

CREATE INDEX idx_word ON vocab_master(english);
```

#### data_json 结构

```json
{
  "examples": [
    {
      "sentence": "...",
      "translation": "..."
    }
  ],
  "synonyms": ["word1", "word2"],
  "antonyms": ["word1"],
  "examStats": {
    "total_count": 15,
    "by_section": {
      "完形": 2,
      "阅读": 8,
      "新题型": 1,
      "翻译": 3,
      "写作": 1
    },
    "by_year": {
      "2024": 2,
      "2023": 3,
      "2022": 2
    },
    "importance": 4,
    "tags": ["高频", "阅读词汇"]
  },
  "examSentences": [
    {
      "year": 2024,
      "section": "阅读",
      "sentence": "...",
      "translation": "..."
    }
  ]
}
```

### 3.2 word_exam_stats 表

真题统计数据。

```sql
CREATE TABLE word_exam_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  english TEXT UNIQUE NOT NULL,
  total_count INTEGER,
  by_section TEXT,                      -- JSON: {完形, 阅读, 新题型, 翻译, 写作}
  by_year TEXT,                         -- JSON: {2024: 3, 2023: 2, ...}
  importance INTEGER,
  tags TEXT                             -- JSON 数组
);
```

### 3.3 word_exam_sentences 表

真题例句。

```sql
CREATE TABLE word_exam_sentences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  english TEXT NOT NULL,
  year INTEGER,
  section TEXT,                         -- 完形/阅读/新题型/翻译/写作
  sentence TEXT,
  translation TEXT
);

CREATE INDEX idx_english_exam ON word_exam_sentences(english);
```

## 4. pregen_data.db 设计

### 4.1 vocab 表

预生成词库。

```sql
CREATE TABLE vocab (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  english TEXT UNIQUE NOT NULL,
  chinese TEXT,
  examples TEXT,                        -- JSON 数组
  synonyms TEXT,                        -- JSON 数组
  antonyms TEXT                         -- JSON 数组
);

CREATE INDEX idx_english_pregen ON vocab(english);
```

## 5. 数据流和同步

### 5.1 数据来源优先级

```
首页列表释义补全：
  1. pregenVocab 缓存（最快）
  2. masterDb 释义（次快）
  3. 用户输入（最慢）

详情页信息：
  1. 自用单词本（wordbook.db）
  2. 统一主库（vocal_master.db）
  3. 预生成词库（pregen_data.db）

复习干扰项：
  1. masterDb 词表（最全）
  2. 用户单词本（备选）
```

### 5.2 云端同步

```
本地修改
  ↓
触发同步事件
  ↓
调用 word-sync 云函数
  ↓
云端更新 uniCloud 数据库
  ↓
其他设备拉取更新
  ↓
本地数据库更新
```

### 5.3 数据备份和恢复

```
备份流程：
  本地数据 → 调用 user-center 云函数 → 云端存储

恢复流程：
  用户点击恢复 → 调用 user-center 云函数 → 获取云端数据 →
  clearAndInsertWords() → 本地数据库更新
```

## 6. 性能优化

### 6.1 索引策略

| 表 | 索引字段 | 用途 |
|----|---------|------|
| words | english | 快速查询单词 |
| words | next_review_time | 快速获取待复习单词 |
| words | create_time | 快速按创建时间排序 |
| mastered_words | english | 快速查询已掌握单词 |
| vocab_master | english | 快速查询主库 |
| word_exam_sentences | english | 快速查询真题例句 |

### 6.2 查询优化

```javascript
// ❌ 不好：一次加载所有数据
const allWords = await db.getWords();

// ✅ 好：分页加载
const words = await db.getWordsForList(50, 0);

// ❌ 不好：多次查询
for (const word of words) {
  const detail = await db.getWordById(word.id);
}

// ✅ 好：批量查询
const details = await masterDb.getWordBriefBatch(englishList);
```

### 6.3 缓存策略

```javascript
// wordStats 缓存
await wordStats.loadWordStats();  // 首次加载
const stats = wordStats.getWordStatsFromCache(english);  // 后续使用缓存

// pregenVocab 缓存
const cache = await pregenVocab.getPregenVocabCache(englishList);
```

## 7. 数据一致性

### 7.1 事务保护

以下操作使用事务保护：

```javascript
// 标记为已掌握（从 words 移到 mastered_words）
await db.masterWord(id);

// 取消已掌握（从 mastered_words 移回 words）
await db.unmasterWord(id);

// 云端恢复（清空并批量插入）
await db.clearAndInsertWords(words);
```

### 7.2 数据验证

```javascript
// 在添加/更新前验证
const errors = validateWord(word);
if (errors.length > 0) {
  throw new Error(errors.join(', '));
}

// 验证项：
// - english 不为空
// - chinese 不为空
// - tags 是有效的 JSON 数组
// - examples 是有效的 JSON 数组
// - 复习字段在有效范围内
```

### 7.3 错误恢复

```javascript
// 如果主库缺表，自动修复
if (isMissingExamTableError(err)) {
  await repairMasterDbFromStatic();
}

// 如果数据损坏，使用默认值
const word = {
  ...defaultWord,
  ...corruptedData
};
```

## 8. 数据库维护

### 8.1 主库更新

当真题数据更新时，需要重新生成主库：

```bash
# 1. 更新真题文本
# 2. 运行统计脚本
python trueti/word_stats_from_trueti.py

# 3. 生成主库
python trueti/build_master_db.py

# 4. 替换 static/vocal_master.db

# 5. 清除应用数据或卸载重装
# （这样下次启动会重新复制新的主库）
```

### 8.2 数据库版本管理

```javascript
// 版本检查
const storedVersion = getStoredDbVersion();
const currentVersion = MASTER_DB_VERSION;

if (storedVersion < currentVersion) {
  // 需要更新
  await repairMasterDbFromStatic();
  setStoredDbVersion(currentVersion);
}
```

### 8.3 数据库清理

```javascript
// 删除已掌握的单词（可选）
await db.deleteWord(id);

// 清空所有数据（谨慎使用）
await db.clearAndInsertWords([]);
```

## 9. ER 图

```
┌─────────────────────────────────────────┐
│           wordbook.db                   │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────────────────────────┐  │
│  │ words 表                         │  │
│  ├──────────────────────────────────┤  │
│  │ id (PK)                          │  │
│  │ english (UK, Index)              │  │
│  │ chinese                          │  │
│  │ tags (JSON)                      │  │
│  │ examples (JSON)                  │  │
│  │ synonyms (JSON)                  │  │
│  │ antonyms (JSON)                  │  │
│  │ source_page                      │  │
│  │ year                             │  │
│  │ importance                       │  │
│  │ difficulty_score                 │  │
│  │ stability                        │  │
│  │ retrievability                   │  │
│  │ interval_days                    │  │
│  │ lapse_count                      │  │
│  │ review_count                     │  │
│  │ next_review_time (Index)         │  │
│  │ last_reviewed_at                 │  │
│  │ view_count                       │  │
│  │ create_time (Index)              │  │
│  │ update_time                      │  │
│  └──────────────────────────────────┘  │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │ mastered_words 表                │  │
│  ├──────────────────────────────────┤  │
│  │ (结构同 words 表)                │  │
│  │ + mastered_at                    │  │
│  └──────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│        vocal_master.db                  │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────────────────────────┐  │
│  │ vocab_master 表                  │  │
│  ├──────────────────────────────────┤  │
│  │ id (PK)                          │  │
│  │ english (UK, Index)              │  │
│  │ chinese                          │  │
│  │ data_json (包含 examples,        │  │
│  │            synonyms, antonyms,   │  │
│  │            examStats,            │  │
│  │            examSentences)        │  │
│  │ create_time                      │  │
│  └──────────────────────────────────┘  │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │ word_exam_stats 表               │  │
│  ├──────────────────────────────────┤  │
│  │ id (PK)                          │  │
│  │ english (UK)                     │  │
│  │ total_count                      │  │
│  │ by_section (JSON)                │  │
│  │ by_year (JSON)                   │  │
│  │ importance                       │  │
│  │ tags (JSON)                      │  │
│  └──────────────────────────────────┘  │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │ word_exam_sentences 表           │  │
│  ├──────────────────────────────────┤  │
│  │ id (PK)                          │  │
│  │ english (Index)                  │  │
│  │ year                             │  │
│  │ section                          │  │
│  │ sentence                         │  │
│  │ translation                      │  │
│  └──────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

---

**最后更新**：2026-03-21
