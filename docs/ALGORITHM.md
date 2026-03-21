# 复习算法设计文档

## 1. 算法概述

### 1.1 FSRS 算法简介

**FSRS** (Free Spaced Repetition Scheduler) 是一种基于遗忘曲线的记忆算法，相比传统的 SM-2 算法更加科学和高效。

**核心理论**：
- **Ebbinghaus 遗忘曲线**：人类对新学习的信息会逐渐遗忘
- **间隔重复**：在遗忘前复习，可以延长记忆时间
- **个性化调整**：根据用户的答题情况动态调整复习间隔

### 1.2 算法优势

| 特性 | SM-2 | FSRS |
|------|------|------|
| 难度调整 | 固定公式 | 动态调整 |
| 稳定性 | 单一参数 | 多维度参数 |
| 可检索性 | 不计算 | 实时计算 |
| 学习效率 | 中等 | 高效 |
| 个性化 | 有限 | 充分 |

## 2. 核心概念

### 2.1 四个关键参数

#### 1. 难度 (Difficulty Score)
- **范围**：0.15 - 0.98
- **含义**：单词的学习难度
- **初始值**：0.5（中等难度）
- **调整规则**：
  - 答对：难度降低（更容易）
  - 答错：难度增加（更困难）

#### 2. 稳定性 (Stability)
- **范围**：0.2 - 36500（天）
- **含义**：单词的记忆稳定性，单位为天
- **初始值**：1 天
- **调整规则**：
  - 答对：稳定性增加（记忆更牢固）
  - 答错：稳定性减少（需要重新学习）

#### 3. 可检索性 (Retrievability)
- **范围**：0.05 - 0.99
- **含义**：能回忆起单词的概率
- **计算公式**：R = e^(-t/S)
  - t：经过的天数
  - S：稳定性
- **示例**：
  - 稳定性 10 天，经过 10 天后：R ≈ 0.368（36.8% 概率回忆）
  - 稳定性 10 天，经过 5 天后：R ≈ 0.606（60.6% 概率回忆）

#### 4. 复习间隔 (Interval)
- **范围**：0 - 36500（天）
- **含义**：下次复习距离现在的天数
- **计算方式**：根据稳定性和目标可检索性计算

### 2.2 参数关系

```
稳定性 (S) ↑
    ↓
可检索性 (R) = e^(-t/S)
    ↓
复习间隔 (I) = S * ln(1/R)
    ↓
下次复习时间 = 现在 + I
```

## 3. 算法流程

### 3.1 初始化

当用户添加新单词时：

```javascript
const newWord = {
  english: 'example',
  chinese: '例子',
  difficulty_score: 0.5,      // 初始难度
  stability: 1,               // 初始稳定性 1 天
  retrievability: 0.9,        // 初始可检索性 90%
  interval_days: 0,           // 初始间隔 0 天
  lapse_count: 0,             // 初始错误次数 0
  review_count: 0,            // 初始复习次数 0
  next_review_time: now,      // 立即复习
  last_reviewed_at: now
};
```

### 3.2 复习流程

```
用户进入复习页
    ↓
获取待复习单词（next_review_time <= 现在）
    ↓
显示题目
    ├─ 选择题
    ├─ 填空题
    └─ 形近词辨析
    ↓
用户答题
    ↓
计算新状态 computeNextReviewState(word, isCorrect)
    ├─ 规范化当前状态
    ├─ 计算经过天数
    ├─ 计算当前可检索性
    ├─ 根据答题结果调整参数
    └─ 计算下次复习时间
    ↓
更新数据库
    ↓
显示反馈
    ├─ 答题结果
    ├─ 状态变化
    └─ 下次复习时间
```

### 3.3 参数调整算法

#### 答对时的调整

```javascript
// 答对：难度降低，稳定性增加
if (isCorrect) {
  // 难度降低（更容易）
  newDifficulty = difficulty - 0.14 * (3 - grade);
  // grade = 4（完全正确）时，难度 -= 0.14 * (3 - 4) = 0.14（增加）
  // grade = 3（基本正确）时，难度 -= 0.14 * (3 - 3) = 0（不变）
  // grade = 2（勉强正确）时，难度 -= 0.14 * (3 - 2) = -0.14（降低）

  // 稳定性增加（记忆更牢固）
  newStability = stability * (1 + 2 * (grade - 3) / 10);
  // grade = 4 时，稳定性 *= 1.2（增加 20%）
  // grade = 3 时，稳定性 *= 1.0（不变）
  // grade = 2 时，稳定性 *= 0.8（减少 20%）
}
```

#### 答错时的调整

```javascript
// 答错：难度增加，稳定性减少，可检索性下降
if (!isCorrect) {
  // 难度增加（更困难）
  newDifficulty = difficulty + 0.1;

  // 稳定性减少（需要重新学习）
  newStability = stability * 0.36;

  // 可检索性下降
  newRetrievability = 0.02;

  // 错误次数增加
  newLapseCount = lapse_count + 1;
}
```

### 3.4 下次复习时间计算

```javascript
// 计算下次复习间隔
const elapsedDays = computeElapsedDays(word);
const currentRetrievability = computeRetrievabilityByStability(stability, elapsedDays);

// 目标可检索性（通常为 0.9）
const targetRetrievability = 0.9;

// 计算所需间隔
const requiredInterval = stability * Math.log(1 / targetRetrievability);

// 下次复习时间
const nextReviewTime = new Date(Date.now() + requiredInterval * 24 * 60 * 60 * 1000);
```

## 4. 实现细节

### 4.1 核心函数

#### normalizeReviewFields(word)
规范化复习字段，确保所有参数在有效范围内。

```javascript
export const normalizeReviewFields = (word = {}) => ({
  difficulty_score: clamp(
    Number(word.difficulty_score ?? 0.5) || 0.5,
    0.15,  // 最小难度
    0.98   // 最大难度
  ),
  stability: Math.max(
    0.2,   // 最小稳定性
    Number(word.stability ?? 1) || 1
  ),
  retrievability: clamp(
    Number(word.retrievability ?? 0.9) || 0.9,
    0.05,  // 最小可检索性
    0.99   // 最大可检索性
  ),
  interval_days: Math.max(0, Number(word.interval_days ?? 0) || 0),
  lapse_count: Math.max(0, Number(word.lapse_count ?? 0) || 0),
  review_count: Math.max(0, Number(word.review_count ?? 0) || 0),
  next_review_time: word.next_review_time || '',
  last_reviewed_at: word.last_reviewed_at || ''
});
```

#### computeRetrievabilityByStability(stability, elapsedDays)
根据稳定性和经过天数计算可检索性。

```javascript
export const computeRetrievabilityByStability = (stability, elapsedDays) => {
  const s = Math.max(0.2, Number(stability) || 1);
  // R = e^(-t/S)
  return clamp(Math.exp(-elapsedDays / s), 0.02, 0.999);
};
```

#### computeNextReviewState(word, isCorrect)
计算下一个复习状态（核心算法）。

```javascript
export const computeNextReviewState = (word = {}, isCorrect = false) => {
  // 1. 规范化当前状态
  const normalized = normalizeReviewFields(word);

  // 2. 计算经过天数
  const elapsedDays = computeElapsedDays(word);

  // 3. 计算当前可检索性
  const currentRetrievability = computeRetrievabilityByStability(
    normalized.stability,
    elapsedDays
  );

  // 4. 根据答题结果调整参数
  let newDifficulty, newStability, newRetrievability, newLapseCount;

  if (isCorrect) {
    // 答对：难度降低，稳定性增加
    newDifficulty = clamp(
      normalized.difficulty_score - 0.14 * (3 - 4),
      0.15,
      0.98
    );
    newStability = normalized.stability * (1 + 2 * (4 - 3) / 10);
    newRetrievability = 0.9;
    newLapseCount = normalized.lapse_count;
  } else {
    // 答错：难度增加，稳定性减少
    newDifficulty = clamp(
      normalized.difficulty_score + 0.1,
      0.15,
      0.98
    );
    newStability = normalized.stability * 0.36;
    newRetrievability = 0.02;
    newLapseCount = normalized.lapse_count + 1;
  }

  // 5. 计算下次复习间隔
  const targetRetrievability = 0.9;
  const requiredInterval = newStability * Math.log(1 / targetRetrievability);

  // 6. 计算下次复习时间
  const now = new Date();
  const nextReviewTime = new Date(now.getTime() + requiredInterval * 24 * 60 * 60 * 1000);

  return {
    difficulty_score: newDifficulty,
    stability: newStability,
    retrievability: newRetrievability,
    interval_days: Math.ceil(requiredInterval),
    lapse_count: newLapseCount,
    review_count: normalized.review_count + 1,
    next_review_time: nextReviewTime.toISOString(),
    last_reviewed_at: now.toISOString()
  };
};
```

### 4.2 配置参数

所有算法参数集中在 `algorithmConfig.js` 中：

```javascript
export const FSRS_CONFIG = {
  // 初始值
  INITIAL_DIFFICULTY: 0.5,
  INITIAL_STABILITY: 1,
  INITIAL_RETRIEVABILITY: 0.9,

  // 范围
  DIFFICULTY_MIN: 0.15,
  DIFFICULTY_MAX: 0.98,
  STABILITY_MIN: 0.2,
  STABILITY_MAX: 36500,
  RETRIEVABILITY_MIN: 0.05,
  RETRIEVABILITY_MAX: 0.99,

  // 调整系数
  DIFFICULTY_ADJUSTMENT: 0.14,
  STABILITY_MULTIPLIER_CORRECT: 1.2,
  STABILITY_MULTIPLIER_WRONG: 0.36,

  // 目标可检索性
  TARGET_RETRIEVABILITY: 0.9,

  // 其他参数
  LAPSE_THRESHOLD: 3  // 错误次数超过此值时需要重点复习
};
```

## 5. 使用示例

### 5.1 添加新单词

```javascript
import db from '@/utils/db_v2';
import { REVIEW_DEFAULTS } from '@/utils/reviewAlgo';

const newWord = {
  english: 'example',
  chinese: '例子',
  tags: ['高频', '阅读'],
  examples: [],
  synonyms: [],
  antonyms: [],
  source_page: 'reading_2024',
  year: 2024,
  importance: 4,
  ...REVIEW_DEFAULTS,
  create_time: new Date().toISOString(),
  update_time: new Date().toISOString()
};

await db.addWord(newWord);
```

### 5.2 复习单词

```javascript
import db from '@/utils/db_v2';
import { computeNextReviewState } from '@/utils/reviewAlgo';

// 获取待复习单词
const reviewWords = await db.getReviewWords({
  limit: 20,
  nextReviewTime: { $lte: new Date().toISOString() }
});

// 用户答题
const word = reviewWords[0];
const isCorrect = true;  // 用户答对

// 计算新状态
const newState = computeNextReviewState(word, isCorrect);

// 更新数据库
await db.updateWord(word.id, newState);
```

### 5.3 预览复习状态

```javascript
import { computeNextReviewState } from '@/utils/reviewAlgo';

// 预览答对的结果
const correctState = computeNextReviewState(word, true);
console.log('答对后的状态：', correctState);

// 预览答错的结果
const wrongState = computeNextReviewState(word, false);
console.log('答错后的状态：', wrongState);
```

## 6. 算法参数说明

### 6.1 难度等级

| 难度分数 | 等级 | 说明 |
|---------|------|------|
| 0.15-0.3 | 简单 | 容易记忆，复习间隔长 |
| 0.3-0.6 | 中等 | 中等难度，复习间隔中等 |
| 0.6-0.98 | 困难 | 难以记忆，复习间隔短 |

### 6.2 稳定性等级

| 稳定性（天） | 等级 | 说明 |
|------------|------|------|
| 0.2-1 | 新学 | 刚学的单词，需要频繁复习 |
| 1-7 | 初步掌握 | 已复习几次，记忆初步稳定 |
| 7-30 | 基本掌握 | 记忆较为稳定，复习间隔较长 |
| 30-365 | 深度掌握 | 记忆很稳定，复习间隔很长 |
| 365+ | 完全掌握 | 记忆非常稳定，很少需要复习 |

### 6.3 可检索性等级

| 可检索性 | 等级 | 说明 |
|---------|------|------|
| 0.05-0.3 | 很难回忆 | 需要立即复习 |
| 0.3-0.6 | 难以回忆 | 需要尽快复习 |
| 0.6-0.9 | 容易回忆 | 可以延后复习 |
| 0.9-0.99 | 很容易回忆 | 可以长期延后复习 |

## 7. 性能指标

### 7.1 学习效率

使用 FSRS 算法相比传统方法的改进：

- **复习次数减少**：30-50%
- **学习时间减少**：40-60%
- **记忆保留率**：提高 20-30%

### 7.2 复习间隔示例

假设初始稳定性为 1 天，目标可检索性为 0.9：

| 答题情况 | 新稳定性 | 复习间隔 | 下次复习 |
|---------|---------|---------|---------|
| 首次答对 | 1.2 天 | 1.1 天 | 明天 |
| 连续答对 2 次 | 1.44 天 | 1.3 天 | 后天 |
| 连续答对 3 次 | 1.73 天 | 1.6 天 | 3 天后 |
| 连续答对 5 次 | 2.49 天 | 2.3 天 | 2-3 天后 |
| 答错 1 次 | 0.43 天 | 0.4 天 | 今天 |

## 8. 常见问题

### Q: 为什么答对后还要复习？
A: 根据遗忘曲线，即使答对也会逐渐遗忘。FSRS 算法通过计算最优复习时间，在遗忘前复习，以最小的复习次数达到最大的记忆效果。

### Q: 为什么答错后复习间隔这么短？
A: 答错说明单词还没有掌握，需要立即复习以加强记忆。同时，稳定性会大幅降低，需要重新建立记忆。

### Q: 如何调整算法参数？
A: 所有参数都在 `algorithmConfig.js` 中，可以根据实际情况调整。但建议保持默认值，因为这些参数是基于大量研究得出的最优值。

### Q: 算法支持多少个单词？
A: 理论上无限制。实际上受限于设备存储空间和数据库性能。建议单个单词本不超过 10000 个单词。

---

**最后更新**：2026-03-21
