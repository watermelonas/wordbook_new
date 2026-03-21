# API 接口文档

## 1. 云函数接口

### 1.1 用户中心 (user-center)

#### 用户登录
```
POST /user-center/login
```

**请求参数**：
```json
{
  "username": "string",
  "password": "string"
}
```

**响应**：
```json
{
  "code": 0,
  "message": "登录成功",
  "data": {
    "userId": "string",
    "token": "string",
    "userInfo": {
      "nickname": "string",
      "avatar": "string"
    }
  }
}
```

#### 用户注册
```
POST /user-center/register
```

**请求参数**：
```json
{
  "username": "string",
  "password": "string",
  "nickname": "string"
}
```

#### 获取用户信息
```
GET /user-center/userinfo
```

**请求头**：
```
Authorization: Bearer {token}
```

**响应**：
```json
{
  "code": 0,
  "data": {
    "userId": "string",
    "username": "string",
    "nickname": "string",
    "avatar": "string",
    "createdAt": "2026-03-21T10:00:00Z"
  }
}
```

#### 数据备份
```
POST /user-center/backup
```

**请求参数**：
```json
{
  "words": [
    {
      "english": "string",
      "chinese": "string",
      "tags": ["string"],
      "importance": 0-5
    }
  ]
}
```

**响应**：
```json
{
  "code": 0,
  "message": "备份成功",
  "data": {
    "backupId": "string",
    "timestamp": "2026-03-21T10:00:00Z"
  }
}
```

#### 数据恢复
```
POST /user-center/restore
```

**请求参数**：
```json
{
  "backupId": "string"
}
```

**响应**：
```json
{
  "code": 0,
  "message": "恢复成功",
  "data": {
    "words": [
      {
        "english": "string",
        "chinese": "string",
        "tags": ["string"],
        "importance": 0-5
      }
    ]
  }
}
```

### 1.2 单词同步 (word-sync)

#### 同步单词
```
POST /word-sync/sync
```

**请求参数**：
```json
{
  "words": [
    {
      "id": "string",
      "english": "string",
      "chinese": "string",
      "tags": ["string"],
      "importance": 0-5,
      "lastModified": "2026-03-21T10:00:00Z"
    }
  ],
  "lastSyncTime": "2026-03-21T10:00:00Z"
}
```

**响应**：
```json
{
  "code": 0,
  "message": "同步成功",
  "data": {
    "syncedCount": 10,
    "conflictCount": 0,
    "nextSyncTime": "2026-03-21T11:00:00Z"
  }
}
```

#### 获取同步更新
```
GET /word-sync/updates
```

**请求参数**：
```
?lastSyncTime=2026-03-21T10:00:00Z
```

**响应**：
```json
{
  "code": 0,
  "data": {
    "updates": [
      {
        "id": "string",
        "english": "string",
        "action": "add|update|delete",
        "timestamp": "2026-03-21T10:00:00Z"
      }
    ]
  }
}
```

## 2. AI 服务接口

### 2.1 DeepSeek API 集成

#### 配置

在 `src/utils/config.js` 中配置：

```javascript
export default {
  deepseekApiKey: 'your-api-key',
  aiServiceEnabled: true,
  aiModel: 'deepseek-chat'
};
```

#### 调用方式

```javascript
import aiService from '@/utils/aiService';

// 生成单个例句
const example = await aiService.generateExample('example');

// 生成多个例句
const examples = await aiService.generateMultipleExamples(
  'example',
  ['word1', 'word2'],  // 用户单词本中的其他单词
  3,                    // 生成 3 个例句
  examStatsText         // 真题统计信息
);

// 分析单词
const analysis = await aiService.analyzeWord('example');
```

### 2.2 AI 服务方法

#### generateExample(word, existingWords)

生成单个高质量例句。

**参数**：
- `word` (string): 目标单词
- `existingWords` (array): 用户单词本中的其他单词，用于形成反复记忆

**返回**：
```
Promise<string>: 包含英文例句和中文翻译的字符串
```

**示例**：
```javascript
const example = await aiService.generateExample('example', ['important', 'significant']);
// 返回：
// "For example, the **important** and **significant** findings demonstrate..."
// "例如，这些**重要**且**显著**的发现表明..."
```

#### generateMultipleExamples(word, existingWords, count, examStatsText)

生成多个不同场景的例句。

**参数**：
- `word` (string): 目标单词
- `existingWords` (array): 用户单词本中的其他单词
- `count` (number): 生成的例句数量，默认 3
- `examStatsText` (string): 真题统计信息，用于生成贴近考研的例句

**返回**：
```
Promise<array>: 例句数组
[
  {
    english: "...",
    chinese: "..."
  },
  ...
]
```

**真题统计信息格式**：
```
该词在考研真题中的统计：
- 总出现次数：15 次
- 按题型分布：完形 2 次，阅读 8 次，新题型 1 次，翻译 3 次，写作 1 次
- 出现年份：2024 年 2 次，2023 年 3 次，2022 年 2 次
- 重要程度：4 星
- 标签：高频词汇、阅读词汇
```

**示例**：
```javascript
const examStats = `该词在考研真题中的统计：
- 总出现次数：15 次
- 按题型分布：完形 2 次，阅读 8 次，新题型 1 次，翻译 3 次，写作 1 次
- 出现年份：2024 年 2 次，2023 年 3 次，2022 年 2 次`;

const examples = await aiService.generateMultipleExamples(
  'example',
  ['important', 'significant'],
  3,
  examStats
);
```

#### analyzeWord(word)

分析单词的语义和推荐标签。

**参数**：
- `word` (string): 目标单词

**返回**：
```
Promise<string>: 包含分析结果和推荐标签的字符串
```

**示例**：
```javascript
const analysis = await aiService.analyzeWord('example');
// 返回：
// "单词分析：
// 基本含义：例子、示例、范例
// 使用场景：学术、正式、日常
// 推荐标签：高频、学术词、阅读词汇"
```

### 2.3 AI 功能集成点

#### 快速添加页面 (quick-add.vue)

在快速添加单词时，自动调用 AI 生成例句：

```javascript
// 用户输入单词后，自动查询并生成例句
async function searchWord() {
  const word = wordRef.value.english;

  // 1. 从主库查询基础信息
  const detail = await masterDb.getWordFullDetail(word);

  // 2. 获取真题统计
  const examStats = wordStats.getWordStatsFromCache(word);
  const examStatsText = formatWordStatsForPrompt(examStats);

  // 3. 获取用户单词本中的其他单词
  const existingWords = await db.getWords().then(words =>
    words.map(w => w.english).slice(0, 10)
  );

  // 4. 调用 AI 生成例句
  const examples = await aiService.generateMultipleExamples(
    word,
    existingWords,
    3,
    examStatsText
  );

  // 5. 显示生成的例句
  wordRef.value.examples = examples;
}
```

#### 单词详情页 (word-detail.vue)

在编辑单词时，提供 AI 生成例句的选项：

```javascript
// 用户点击"AI 生成例句"按钮
async function generateExamplesWithAI() {
  isGenerating.value = true;

  try {
    // 获取真题统计
    const examStats = wordStats.getWordStatsFromCache(word.value.english);
    const examStatsText = formatWordStatsForPrompt(examStats);

    // 获取用户单词本中的其他单词
    const existingWords = await db.getWords().then(words =>
      words.map(w => w.english).slice(0, 10)
    );

    // 调用 AI 生成例句
    const examples = await aiService.generateMultipleExamples(
      word.value.english,
      existingWords,
      3,
      examStatsText
    );

    // 更新单词信息
    word.value.examples = examples;

    // 保存到数据库
    await db.updateWord(word.value.id, {
      examples: JSON.stringify(examples)
    });

    uni.showToast({
      title: '例句生成成功',
      icon: 'success'
    });
  } catch (error) {
    uni.showToast({
      title: '生成失败，请重试',
      icon: 'error'
    });
  } finally {
    isGenerating.value = false;
  }
}
```

## 3. 本地数据库接口

### 3.1 单词操作

#### 添加单词
```javascript
import db from '@/utils/db_v2';

await db.addWord({
  english: 'example',
  chinese: '例子',
  tags: ['高频', '阅读'],
  examples: [
    {
      english: 'For example, ...',
      chinese: '例如，...'
    }
  ],
  importance: 4,
  source_page: 'reading_2024',
  year: 2024
});
```

#### 查询单词
```javascript
// 按 ID 查询
const word = await db.getWordById(1);

// 分页查询
const words = await db.getWordsForList(50, 0, 'create_time', 'desc');

// 按英文查询
const word = await db.getWordByEnglish('example');
```

#### 更新单词
```javascript
await db.updateWord(word.id, {
  chinese: '新的释义',
  importance: 5,
  examples: JSON.stringify([...])
});
```

#### 删除单词
```javascript
await db.deleteWord(word.id);
```

### 3.2 复习操作

#### 获取待复习单词
```javascript
const reviewWords = await db.getReviewWords({
  limit: 20,
  nextReviewTime: { $lte: new Date().toISOString() }
});
```

#### 更新复习状态
```javascript
import { computeNextReviewState } from '@/utils/reviewAlgo';

const newState = computeNextReviewState(word, true);  // true 表示答对
await db.updateWord(word.id, newState);
```

### 3.3 已掌握单词

#### 标记为已掌握
```javascript
await db.masterWord(word.id);
```

#### 取消已掌握
```javascript
await db.unmasterWord(word.id);
```

#### 获取已掌握单词
```javascript
const masteredWords = await db.getMasteredWords();
```

## 4. 统一主库接口

### 4.1 查询方法

#### 获取完整单词信息
```javascript
import * as masterDb from '@/utils/masterDb';

const detail = await masterDb.getWordFullDetail('example');
// 返回：
// {
//   chinese: '例子',
//   examples: [...],
//   synonyms: [...],
//   antonyms: [...],
//   examStats: {...},
//   examSentences: [...]
// }
```

#### 批量获取释义
```javascript
const englishList = ['example', 'important', 'significant'];
const briefDict = await masterDb.getWordBriefBatch(englishList);
// 返回：
// {
//   'example': '例子',
//   'important': '重要的',
//   'significant': '显著的'
// }
```

#### 获取复习词表
```javascript
const reviewWords = await masterDb.getWordListForReview();
// 用于生成复习题目的干扰项
```

## 5. 真题统计接口

### 5.1 加载和查询

#### 加载真题统计
```javascript
import * as wordStats from '@/utils/wordStats';

await wordStats.loadWordStats();
```

#### 从缓存获取统计
```javascript
const stats = wordStats.getWordStatsFromCache('example');
// 返回：
// {
//   total_count: 15,
//   by_section: {
//     完形: 2,
//     阅读: 8,
//     新题型: 1,
//     翻译: 3,
//     写作: 1
//   },
//   by_year: {
//     2024: 2,
//     2023: 3,
//     2022: 2
//   },
//   importance: 4,
//   tags: ['高频', '阅读词汇']
// }
```

#### 格式化为提示文本
```javascript
import { formatWordStatsForPrompt } from '@/utils/wordStats';

const examStatsText = formatWordStatsForPrompt(stats);
// 用于传递给 AI 生成例句
```

## 6. 错误处理

### 6.1 错误类型

| 错误代码 | 说明 |
|---------|------|
| 1001 | 网络错误 |
| 1002 | API 密钥无效 |
| 1003 | 请求超时 |
| 2001 | 数据库错误 |
| 2002 | 数据验证失败 |
| 3001 | 用户未登录 |
| 3002 | 权限不足 |

### 6.2 错误处理示例

```javascript
import { errorHandler } from '@/utils/errorHandler';

try {
  const examples = await aiService.generateMultipleExamples(word, [], 3);
} catch (error) {
  errorHandler.handle(error, {
    context: 'generateExamples',
    word: word
  });

  uni.showToast({
    title: '生成失败，请重试',
    icon: 'error'
  });
}
```

## 7. 性能优化建议

### 7.1 缓存策略
- 真题统计数据在内存中缓存，避免重复加载
- 预生成词库使用数据库索引加速查询
- AI 生成的例句保存到数据库，避免重复调用

### 7.2 异步处理
- AI 调用使用异步处理，不阻塞主线程
- 大量数据操作使用分页，避免一次加载过多数据
- 云端同步使用后台任务，不影响用户体验

### 7.3 网络优化
- 使用连接池复用 HTTP 连接
- 启用 gzip 压缩减少传输数据量
- 实现请求重试机制，提高可靠性

---

**最后更新**：2026-03-21
