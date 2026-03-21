# 系统架构设计

## 1. 整体架构

### 1.1 分层架构

```
┌─────────────────────────────────────────────────────────┐
│                    表现层 (UI Layer)                      │
│  Pages: index, word-detail, review, stats, my, etc.     │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                  业务逻辑层 (Logic Layer)                 │
│  reviewAlgo, wordStats, importExport, validators,       │
│  aiService (DeepSeek API), learningCenter, etc.         │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                  数据访问层 (Data Layer)                  │
│  db_v2, masterDb, pregenVocab, wordbookSource, etc.     │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                  存储层 (Storage Layer)                   │
│  SQLite (App) / localStorage (H5) / uniCloud (Cloud)    │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                  外部服务层 (External Services)           │
│  DeepSeek API (AI 例句生成) / uniCloud (云端同步)        │
└─────────────────────────────────────────────────────────┘
```

### 1.2 模块划分

```
应用
├── 页面模块
│   ├── 首页 (index)
│   ├── 单词详情 (word-detail)
│   ├── 复习 (review)
│   ├── 快速添加 (quick-add)
│   ├── 统计 (stats)
│   ├── 错题本 (mistakes)
│   ├── 已掌握 (mastered-words)
│   ├── 单词本列表 (wordbook-list)
│   ├── 个人中心 (my)
│   └── 登录 (login)
│
├── 数据模块
│   ├── 本地数据库 (db_v2)
│   ├── 统一主库 (masterDb)
│   ├── 预生成词库 (pregenVocab)
│   ├── 真题统计 (wordStats)
│   └── 单词本源 (wordbookSource)
│
├── 业务模块
│   ├── 复习算法 (reviewAlgo)
│   ├── 导入导出 (importExport)
│   ├── 数据验证 (validators)
│   ├── 错误处理 (errorHandler)
│   └── 缓存管理 (cacheManager)
│
└── 云端模块
    ├── 用户中心 (user-center)
    └── 单词同步 (word-sync)
```

## 2. 数据流

### 2.1 首页加载流程

```
用户打开首页
    ↓
检查是否登录
    ├─ 未登录 → 跳转登录页
    └─ 已登录 ↓
加载单词列表
    ├─ 自用单词本 → db.getWordsForList()
    └─ 非自用单词本 ↓
        ├─ 加载原始列表
        ├─ 取首屏 50 条
        └─ 后台 enrich
            ├─ 加载 wordStats 缓存
            ├─ 查询 pregenVocab 缓存
            ├─ 查询 masterDb 释义
            └─ 合并数据更新 UI
```

### 2.2 单词详情加载流程

#### 自用单词本入口
```
用户点击单词
    ↓
首帧加载 (getWordByIdLight)
    ├─ 显示 english、chinese、tags
    ├─ 增加查看次数
    └─ 加载同标签单词
    ↓
异步补全 (getWordByIdHeavy)
    ├─ 加载 examples
    ├─ 加载 synonyms
    └─ 加载 antonyms
    ↓
1 秒后懒加载真题 (loadExamDataLazy)
    ├─ 加载 word-stats.json
    ├─ 加载 word-exam-sentences.json
    └─ 显示真题统计和例句
```

#### 单词本点进入口
```
用户从单词本列表点进
    ↓
首帧显示占位符
    ├─ 显示 english
    ├─ 显示 "加载中..."
    └─ 显示大色块占位
    ↓
一次拉齐 (masterDb.getWordFullDetail)
    ├─ 查询 vocal_master.db
    ├─ 解析 data_json
    └─ 返回完整信息
        ├─ chinese
        ├─ examples
        ├─ synonyms
        ├─ antonyms
        ├─ examStats
        └─ examSentences
    ↓
更新 UI，隐藏占位符
```

### 2.3 复习流程

```
用户进入复习页
    ↓
加载复习单词列表
    ├─ 获取待复习单词
    ├─ 按复习优先级排序
    └─ 计算下次复习时间
    ↓
显示题目
    ├─ 选择题：显示选项
    ├─ 填空题：显示干扰项
    └─ 形近词：显示相似词
    ↓
用户答题
    ↓
计算复习状态 (computeNextReviewState)
    ├─ 规范化当前状态
    ├─ 计算经过天数
    ├─ 根据答题结果调整参数
    │   ├─ 答对：难度↓ 稳定性↑
    │   └─ 答错：难度↑ 稳定性↓
    └─ 计算下次复习时间
    ↓
更新数据库
    ├─ 更新复习参数
    ├─ 记录复习时间
    └─ 更新错误率
    ↓
显示反馈
    ├─ 显示答题结果
    ├─ 显示状态变化
    └─ 显示下次复习时间
```

## 3. 数据库设计

### 3.1 数据库分类

| 数据库 | 位置 | 用途 | 更新频率 |
|--------|------|------|---------|
| **wordbook.db** | `_doc/wordbook.db` | 用户自定义单词本 | 实时 |
| **vocal_master.db** | `_doc/vocal_master.db` | 统一主库（真题+预生成+字典） | 手动更新 |
| **pregen_data.db** | `_doc/pregen_data.db` | 预生成词库 | 手动更新 |
| **localStorage** | 浏览器存储 | H5 环境数据 | 实时 |
| **uniCloud** | 云端 | 云端备份和同步 | 实时 |

### 3.2 主要表结构

#### wordbook.db - words 表
```sql
CREATE TABLE words (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  english TEXT UNIQUE NOT NULL,
  chinese TEXT,
  tags TEXT,                    -- JSON 数组
  examples TEXT,                -- JSON 数组
  synonyms TEXT,                -- JSON 数组
  antonyms TEXT,                -- JSON 数组
  source_page TEXT,             -- 来源页码
  year INTEGER,                 -- 来源年份
  importance INTEGER DEFAULT 0, -- 重要程度 0-5
  difficulty_score REAL DEFAULT 0.5,
  stability REAL DEFAULT 1,
  retrievability REAL DEFAULT 0.9,
  interval_days INTEGER DEFAULT 0,
  lapse_count INTEGER DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  next_review_time TEXT,
  last_reviewed_at TEXT,
  view_count INTEGER DEFAULT 0,
  create_time TEXT,
  update_time TEXT
);
```

#### vocal_master.db - vocab_master 表
```sql
CREATE TABLE vocab_master (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  english TEXT UNIQUE NOT NULL,
  chinese TEXT,
  data_json TEXT,  -- 包含 examples, synonyms, antonyms, examStats, examSentences
  create_time TEXT
);

CREATE INDEX idx_word ON vocab_master(english);
```

#### vocal_master.db - word_exam_stats 表
```sql
CREATE TABLE word_exam_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  english TEXT UNIQUE NOT NULL,
  total_count INTEGER,
  by_section TEXT,  -- JSON: {完形, 阅读, 新题型, 翻译, 写作}
  by_year TEXT,     -- JSON: {2024: 3, 2023: 2, ...}
  importance INTEGER,
  tags TEXT         -- JSON 数组
);
```

### 3.3 ER 图

```
┌─────────────────┐
│   words 表      │
├─────────────────┤
│ id (PK)         │
│ english (UK)    │
│ chinese         │
│ tags            │
│ examples        │
│ synonyms        │
│ antonyms        │
│ importance      │
│ difficulty_score│
│ stability       │
│ retrievability  │
│ interval_days   │
│ lapse_count     │
│ review_count    │
│ next_review_time│
│ last_reviewed_at│
│ view_count      │
│ create_time     │
│ update_time     │
└─────────────────┘

┌──────────────────────┐
│ vocab_master 表      │
├──────────────────────┤
│ id (PK)              │
│ english (UK, Index)  │
│ chinese              │
│ data_json            │
│ create_time          │
└──────────────────────┘

┌──────────────────────┐
│ word_exam_stats 表   │
├──────────────────────┤
│ id (PK)              │
│ english (UK)         │
│ total_count          │
│ by_section (JSON)    │
│ by_year (JSON)       │
│ importance           │
│ tags (JSON)          │
└──────────────────────┘
```

## 4. 关键模块说明

### 4.1 数据库层 (db_v2.js)

**职责**：管理用户自定义单词本的 CRUD 操作

**主要方法**：
- `init()` - 初始化数据库
- `getWordsForList(limit, offset, orderBy, orderDir, filters)` - 分页查询
- `getWordById(id)` / `getWordByIdLight(id)` / `getWordByIdHeavy(id)` - 按 ID 查询
- `addWord(word)` - 添加单词
- `updateWord(id, updates)` - 更新单词
- `deleteWord(id)` - 删除单词
- `masterWord(id)` - 标记为已掌握

### 4.2 统一主库 (masterDb.js)

**职责**：查询统一主库（真题+预生成+字典数据）

**主要方法**：
- `getWordFullDetail(english)` - 获取完整单词信息
- `getWordBriefBatch(englishList)` - 批量获取释义
- `getWordListForReview()` - 获取复习词表（干扰项）

**特点**：
- 单例模式，初始化只执行一次
- 自动从 `static/vocal_master.db` 复制到 `_doc/`
- 支持版本检查和自动修复

### 4.3 预生成词库 (pregenVocab.js)

**职责**：查询预生成词库（按需加载）

**主要方法**：
- `getPregenWord(english)` - 获取单个单词
- `getPregenVocabCache(englishList)` - 批量获取缓存

**特点**：
- 按需打开数据库，避免重复打开
- 支持缓存机制

### 4.4 真题统计 (wordStats.js)

**职责**：管理真题统计数据的加载和缓存

**主要方法**：
- `loadWordStats()` - 加载真题统计
- `loadWordExamSentences()` - 加载真题例句
- `getWordStatsFromCache(english)` - 从缓存获取统计
- `getWordExamSentencesFromCache(english)` - 从缓存获取例句

**特点**：
- 懒加载，按需加载
- 内存缓存，避免重复加载

### 4.6 AI 服务 (aiService.js)

**职责**：集成 DeepSeek API，提供 AI 驱动的例句生成和单词分析

**主要方法**：
- `generateExample(word, existingWords)` - 生成单个高质量例句
- `generateMultipleExamples(word, existingWords, count, examStatsText)` - 生成多个例句
- `analyzeWord(word)` - 分析单词并推荐标签

**特点**：
- 真题感知：根据单词在真题中的出现频率生成例句
- 上下文感知：利用用户单词本中的其他单词，形成反复记忆
- 异步处理：不阻塞主线程，提供良好的用户体验
- 错误处理：网络错误时优雅降级

**AI 生成流程**：
```
用户输入单词
    ↓
查询主库获取基础信息
    ↓
获取真题统计数据
    ↓
获取用户单词本中的其他单词
    ↓
调用 DeepSeek API
    ├─ 传入单词
    ├─ 传入真题统计信息
    ├─ 传入用户单词本中的词汇
    └─ 请求生成高质量例句
    ↓
解析 AI 响应
    ├─ 提取英文例句
    ├─ 提取中文翻译
    └─ 标记关键词汇
    ↓
显示生成的例句
    ↓
用户选择满意的例句
    ↓
保存到数据库
```

**配置参数**：
```javascript
// src/utils/config.js
export default {
  deepseekApiKey: 'your-api-key',
  aiServiceEnabled: true,
  aiModel: 'deepseek-chat',
  aiTemperature: 0.6,  // 推理稳定性
  aiMaxTokens: 2000    // 最大输出长度
};
```

### 4.7 学习中心 (learningCenter_v2.js)

**职责**：管理用户的学习进度和学习数据

**主要方法**：
- `noteNewWordLearned(word)` - 记录新学单词
- `getLearningSummary()` - 获取学习总结
- `cleanupExpiredCaches()` - 清理过期缓存

**特点**：
- 跟踪学习进度
- 提供学习建议
- 管理缓存生命周期

## 5. 数据流详解

### 5.1 首页非自用单词本的 Enrich 流程

```javascript
// 1. 加载原始列表
const allExternalWords = await wordbookSource.loadExternalWordbook(bookId);

// 2. 取首屏
const words = allExternalWords.slice(0, PAGE_SIZE);

// 3. 后台 enrich
enrichWordbookListInBackground(words, bookId, wordsRef);

// 4. enrich 内部流程
async function enrichWordbookListInBackground(list, book, wordsRef) {
  // 4.1 加载 wordStats 缓存
  await wordStats.loadWordStats();

  // 4.2 并行查询 pregenVocab 和 masterDb
  const [cache, dictLookup] = await Promise.all([
    pregenVocab.getPregenVocabCache(englishList),
    masterDb.getWordBriefBatch(englishList)
  ]);

  // 4.3 按批 enrich
  for (let i = 0; i < list.length; i++) {
    const enriched = enrichOneWord(list[i], cache, dictLookup);
    wordsRef.value[i] = enriched;
  }
}

// 5. enrichOneWord 内部流程
function enrichOneWord(word, cache, dictLookup) {
  // 5.1 优先用 pregenVocab 缓存
  if (cache[word.english]) {
    word.chinese = cache[word.english].chinese;
    word.examples = cache[word.english].examples;
  }

  // 5.2 释义不足时用 masterDb 补全
  if (!word.chinese && dictLookup[word.english]) {
    word.chinese = dictLookup[word.english];
  }

  // 5.3 添加真题标签
  const stats = wordStats.getWordStatsFromCache(word.english);
  if (stats) {
    word.examStats = stats;
    word.tags = stats.tags;
  }

  return word;
}
```

### 5.2 单词详情页的两阶段加载

```javascript
// 自用单词本入口
async function loadWord(id) {
  // 第一阶段：轻量加载
  const word = await db.getWordByIdLight(id);
  wordRef.value = word;

  // 增加查看次数
  await db.incrementViewCount(id);

  // 加载同标签单词
  await loadSameTagWords(word.tags);

  // 第二阶段：异步补全
  db.getWordByIdHeavy(id).then(heavy => {
    wordRef.value.examples = heavy.examples;
    wordRef.value.synonyms = heavy.synonyms;
    wordRef.value.antonyms = heavy.antonyms;
  });

  // 第三阶段：1 秒后懒加载真题
  setTimeout(() => loadExamDataLazy(word.english, id), 1000);
}

// 单词本点进入口
async function loadWordFromWordbook(english) {
  // 首帧显示占位符
  wordRef.value = {
    english,
    chinese: '加载中...',
    examples: [],
    synonyms: [],
    antonyms: []
  };
  detailHeavyLoading.value = true;

  // 一次拉齐
  const detail = await masterDb.getWordFullDetail(english);

  // 更新 UI
  wordRef.value = {
    ...wordRef.value,
    ...detail
  };
  detailHeavyLoading.value = false;
}
```

## 6. 性能优化

### 6.1 数据库优化
- **索引**：在 `english` 字段上建立索引，加快查询
- **分页**：使用 LIMIT/OFFSET 分页，避免一次加载过多数据
- **事务**：关键操作使用事务保护，确保数据一致性

### 6.2 缓存优化
- **内存缓存**：wordStats、pregenVocab 使用内存缓存
- **懒加载**：真题数据 1 秒后懒加载，不阻塞首屏
- **两阶段加载**：详情页先显示基础信息，再异步补全

### 6.3 渲染优化
- **虚拟滚动**：大列表使用虚拟滚动，只渲染可见区域
- **响应式更新**：使用 Vue 3 的响应式系统，精确更新
- **防抖**：搜索、排序等操作使用防抖，减少不必要的查询

### 6.4 网络优化
- **离线支持**：本地数据库支持离线使用
- **增量同步**：云端同步只同步变化的数据
- **压缩**：大数据使用压缩传输

## 7. 扩展性设计

### 7.1 新增数据源
如需添加新的数据源（如其他考试真题），只需：
1. 创建新的数据库文件
2. 在 `masterDb.js` 中添加查询方法
3. 在相应页面调用新方法

### 7.2 新增题型
如需添加新的复习题型，只需：
1. 在 `review.vue` 中添加新的题型组件
2. 在 `reviewAlgo.js` 中添加相应的算法
3. 在数据库中添加新的字段

### 7.3 新增功能
如需添加新的功能（如语音朗读），只需：
1. 创建新的工具函数
2. 在相应页面调用
3. 添加相应的配置和权限

---

**最后更新**：2026-03-21
