# FSRS 记忆算法文档

## 概述

本项目使用 FSRS-lite（Free Spaced Repetition Scheduler）算法，这是一个基于遗忘曲线理论的智能复习调度算法。

## 核心概念

### 1. 难度（Difficulty）

**定义**：单词的学习难度，范围 0.15-0.98

**含义**：
- 0.15：非常简单的单词
- 0.5：中等难度
- 0.98：非常难的单词

**调整规则**：
- 答对时：难度降低（说明单词没有预期那么难）
- 答错时：难度增加（说明单词比预期更难）

### 2. 稳定性（Stability）

**定义**：单词的记忆稳定性，单位为天

**含义**：
- 0.6 天：记忆不稳定，容易忘记
- 10 天：记忆较稳定，10 天后遗忘概率为 37%
- 30 天：记忆很稳定，30 天后遗忘概率为 37%

**调整规则**：
- 答对时：稳定性增加（记忆更稳定）
- 答错时：稳定性降低（记忆不稳定）

### 3. 可检索性（Retrievability）

**定义**：能回忆起单词的概率，范围 0.05-0.99

**含义**：
- 0.05：只有 5% 的概率回忆起
- 0.5：有 50% 的概率回忆起
- 0.99：有 99% 的概率回忆起

**计算公式**：
```
R = e^(-t/S)
```
其中：
- R：可检索性
- t：经过的天数
- S：稳定性

**示例**：
- 稳定性 10 天，经过 10 天后：R = e^(-1) ≈ 0.368（37%）
- 稳定性 10 天，经过 5 天后：R = e^(-0.5) ≈ 0.606（61%）

### 4. 复习间隔（Interval）

**定义**：下次复习的天数

**含义**：
- 0.125 天：答错后立即复习（3 小时）
- 1 天：明天复习
- 7 天：一周后复习
- 30 天：一个月后复习

**计算公式**：
```
I = S * (0.7 + (1 - D) * 0.9)
```
其中：
- I：复习间隔
- S：稳定性
- D：难度

## 算法流程

### 答对时的参数调整

```
1. 难度降低
   d' = d - 0.06 + (1 - R) * 0.05 - (importance / 100)

2. 稳定性增加
   S' = S * (1.55 + (1 - d) * 0.65 + R * 0.35 + importance * 0.04)

3. 复习间隔增加
   I' = S' * (0.7 + (1 - d) * 0.9)

4. 可检索性设为高值
   R' = 0.97
```

### 答错时的参数调整

```
1. 难度增加
   d' = d + 0.12 + (1 - R) * 0.12 + 0.02 * max(0, 3 - importance)

2. 稳定性降低
   S' = S * (0.42 + (1 - d) * 0.22)

3. 复习间隔变短
   I' = 0.125（3 小时）

4. 可检索性设为低值
   R' = 0.35
```

## 掌握度计算

掌握度是一个 0-99 的分数，表示用户对单词的掌握程度。

**计算公式**：
```
Mastery = (1 - (forgetProb * 0.72 + difficulty * 0.28)) * 100
```

**分层标准**：
| 掌握度 | 等级 | 颜色 | 含义 |
|--------|------|------|------|
| 80-99 | 熟练 | 绿色 | 已完全掌握 |
| 60-79 | 稳定 | 蓝色 | 记忆稳定 |
| 40-59 | 薄弱 | 黄色 | 需要加强 |
| 0-39 | 危险 | 红色 | 容易遗忘 |

## 复习优先级

复习优先级分数用于决定哪些单词应该优先复习。

**计算公式**：
```
Priority = forgetProb * 55 + difficulty * 22 + overdueDays * 12 + lapseCount * 8 + importance * 4
```

**权重分析**：
- 遗忘概率（55%）：最重要，容易忘记的单词优先复习
- 难度系数（22%）：难的单词需要更多复习
- 逾期天数（12%）：超期的单词需要立即复习
- 错误次数（8%）：经常出错的单词需要加强
- 重要性（4%）：重要的单词优先复习

## 参数配置

所有算法参数都定义在 `algorithmConfig.js` 中，可以根据需要调整。

### 关键参数

| 参数 | 默认值 | 范围 | 说明 |
|------|--------|------|------|
| INITIAL_DIFFICULTY | 0.35 | 0.15-0.98 | 新单词的初始难度 |
| INITIAL_STABILITY | 0.6 | 0.2+ | 新单词的初始稳定性（天） |
| INITIAL_RETRIEVABILITY | 0.92 | 0.05-0.99 | 新单词的初始可检索性 |
| DIFFICULTY_DECREASE_ON_CORRECT | 0.06 | - | 答对时难度的减少量 |
| DIFFICULTY_INCREASE_ON_WRONG | 0.12 | - | 答错时难度的增加量 |
| STABILITY_GROWTH_FACTOR | 1.55 | - | 答对时稳定性的增长系数 |
| INTERVAL_MAX_DAYS | 90 | - | 复习间隔的最大值（天） |

## 使用示例

### 基本用法

```javascript
import { scheduleReviewState, calculateMastery } from './reviewAlgo.js';

// 单词对象
const word = {
  english: 'abandon',
  difficulty_score: 0.35,
  stability: 0.6,
  retrievability: 0.92,
  importance: 3,
  last_reviewed_at: '2026-03-10T00:00:00Z'
};

// 用户答对了
const newState = scheduleReviewState(word, true);
console.log(newState);
// {
//   difficulty_score: 0.31,
//   stability: 0.95,
//   retrievability: 0.97,
//   interval_days: 1.2,
//   lapse_count: 0,
//   review_count: 1,
//   next_review_time: '2026-03-11T...',
//   last_reviewed_at: '2026-03-10T...'
// }

// 计算掌握度
const mastery = calculateMastery(newState);
console.log(mastery); // 85
```

### 计算优先级

```javascript
import { calculateReviewPriority } from './reviewAlgo.js';

const priority = calculateReviewPriority(word);
console.log(priority);
// {
//   score: 45.2,
//   forget_probability: 0.3682,
//   overdue_days: 0
// }

// 用于排序
const words = [...];
words.sort((a, b) => {
  const priorityA = calculateReviewPriority(a).score;
  const priorityB = calculateReviewPriority(b).score;
  return priorityB - priorityA; // 降序排列
});
```

## 调整建议

### 如果用户觉得复习太频繁

增加稳定性增长系数：
```javascript
FSRS_CONFIG.STABILITY_GROWTH_FACTOR = 1.8; // 从 1.55 增加到 1.8
```

### 如果用户觉得复习太少

减少稳定性增长系数：
```javascript
FSRS_CONFIG.STABILITY_GROWTH_FACTOR = 1.3; // 从 1.55 减少到 1.3
```

### 如果想要更快地掌握难单词

增加难度对稳定性的影响：
```javascript
FSRS_CONFIG.STABILITY_DIFFICULTY_FACTOR = 0.8; // 从 0.65 增加到 0.8
```

## 参考资源

- [Ebbinghaus Forgetting Curve](https://en.wikipedia.org/wiki/Forgetting_curve)
- [SM-2 Algorithm](https://en.wikipedia.org/wiki/SuperMemo#SM-2)
- [FSRS Algorithm](https://github.com/open-spaced-repetition/fsrs.js)
- [Spaced Repetition](https://en.wikipedia.org/wiki/Spaced_repetition)
