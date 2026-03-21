# 英语单词学习应用 (Wordbook)

一个基于 uni-app 的跨平台英语单词学习应用，集成了 FSRS 记忆算法、真题数据分析和云端同步功能。

## 📱 项目背景与意义

### 背景
考研英语词汇学习是考生的重要任务，但传统单词本存在以下问题：
- 学习效率低：无法科学安排复习时间
- 数据孤立：无法跨设备同步
- 缺乏针对性：无法根据真题出题规律优化学习

### 意义
本项目通过以下创新点解决上述问题：
1. **FSRS 记忆算法**：基于遗忘曲线的科学复习安排
2. **真题数据融合**：整合 1998-2025 年考研英语真题，提供题型分布、出现频率等数据
3. **多数据源整合**：融合预生成词库、真题统计、用户自定义单词本
4. **云端同步**：支持多设备数据同步和备份恢复
5. **跨平台支持**：支持 iOS、Android、H5 等多个平台

## 🎯 核心功能

### 1. 单词管理
- **自定义单词本**：支持导入 CSV、手动添加单词
- **多维度信息**：英文、中文释义、例句、同反义词、真题出现统计
- **标签系统**：按来源、难度、题型等多维度分类

### 2. 智能复习
- **FSRS 算法**：基于遗忘曲线的个性化复习计划
- **多种题型**：选择题、填空题、形近词辨析等
- **实时反馈**：答题后即时显示复习状态变化

### 3. 数据分析
- **学习统计**：掌握进度、复习频率、错误率等
- **真题分析**：单词在各题型中的出现频率和年份分布
- **个性化建议**：根据学习数据推荐复习策略

### 4. 云端同步
- **多设备同步**：在手机、平板、网页间无缝切换
- **数据备份**：自动备份和手动恢复
- **用户认证**：支持账号登录和数据隐私保护

## 🛠 技术栈

### 前端框架
- **uni-app**：跨平台开发框架
- **Vue 3**：渐进式 JavaScript 框架
- **Vite**：下一代前端构建工具

### 数据存储
- **SQLite**：App 端本地数据库
- **localStorage**：H5 端本地存储
- **uniCloud**：云端数据存储和云函数

### 核心算法
- **FSRS (Free Spaced Repetition Scheduler)**：记忆算法
- **Ebbinghaus 遗忘曲线**：学习理论基础

### 数据处理
- **Python**：真题数据处理脚本
- **PyMuPDF**：PDF 转 TXT
- **SQLite**：数据库操作

## 📁 项目结构

```
wordbook_new/
├── docs/                          # 📚 项目文档
│   ├── README.md                 # 项目说明（本文件）
│   ├── ARCHITECTURE.md           # 系统架构设计
│   ├── DATABASE.md               # 数据库设计
│   ├── ALGORITHM.md              # 复习算法设计
│   ├── API.md                    # 云函数接口文档
│   └── USER_GUIDE.md             # 用户手册
│
├── src/                           # 📝 源代码
│   ├── pages/                    # 页面组件
│   │   ├── index/               # 首页 - 单词列表
│   │   ├── word-detail/         # 单词详情页
│   │   ├── review/              # 复习页面
│   │   ├── quick-add/           # 快速添加单词
│   │   ├── stats/               # 学习统计
│   │   ├── mistakes/            # 错题本
│   │   ├── mastered-words/      # 已掌握单词
│   │   ├── wordbook-list/       # 单词本列表
│   │   ├── my/                  # 个人中心
│   │   └── login/               # 登录页面
│   │
│   ├── components/              # 可复用组件
│   │   └── VirtualScroller.vue  # 虚拟滚动组件
│   │
│   ├── utils/                   # 工具函数
│   │   ├── db_v2.js            # 数据库操作层
│   │   ├── masterDb.js         # 统一主库查询
│   │   ├── pregenVocab.js      # 预生成词库查询
│   │   ├── wordStats.js        # 真题统计数据
│   │   ├── reviewAlgo.js       # FSRS 复习算法
│   │   ├── algorithmConfig.js  # 算法配置参数
│   │   ├── wordbookSource.js   # 单词本数据源
│   │   ├── importExport.js     # 导入导出功能
│   │   ├── errorHandler.js     # 错误处理
│   │   ├── validators.js       # 数据验证
│   │   └── ...                 # 其他工具函数
│   │
│   ├── App.vue                  # 应用入口
│   └── main.js                  # 应用初始化
│
├── uniCloud/                      # ☁️ 云函数
│   └── cloudfunctions/
│       ├── user-center/         # 用户中心云函数
│       └── word-sync/           # 单词同步云函数
│
├── static/                        # 📦 静态资源
│   ├── vocal_master.db          # 统一主库（SQLite）
│   ├── pregen_data.db           # 预生成词库（SQLite）
│   ├── word-stats.json          # 真题统计数据
│   ├── word-exam-sentences.json # 真题例句
│   ├── wordbooks/               # 单词本 CSV 文件
│   └── logo.png                 # 应用图标
│
├── trueti/                        # 🔧 真题数据处理脚本
│   ├── build_master_db.py       # 生成统一主库
│   ├── word_stats_from_trueti.py # 统计真题词汇
│   ├── sync_pregen_to_app.py    # 同步预生成词库
│   ├── pdf_to_txt.py            # PDF 转 TXT
│   ├── requirements.txt         # Python 依赖
│   └── wordbooks/               # 真题文本文件
│
├── pages.json                     # uni-app 页面配置
├── package.json                   # npm 依赖配置
├── uni.scss                       # 全局样式
└── uniCloud.config.json          # uniCloud 配置
```

## 🚀 快速开始

### 环境要求
- Node.js >= 14.0
- npm >= 6.0 或 yarn >= 1.22
- Python >= 3.8（用于真题数据处理）

### 安装依赖
```bash
# 安装 npm 依赖
npm install

# 安装 Python 依赖（可选，仅用于真题数据处理）
pip install -r trueti/requirements.txt
```

### 开发运行
```bash
# 启动开发服务器
npm run dev

# 在 HBuilderX 中打开项目，选择运行到浏览器或模拟器
```

### 生产构建
```bash
# 构建应用
npm run build

# 输出到 unpackage/dist 目录
```

### 真题数据处理
```bash
# 1. 将 PDF 真题放入 trueti 文件夹
# 2. 转换 PDF 为 TXT
python trueti/pdf_to_txt.py

# 3. 统计真题词汇
python trueti/word_stats_from_trueti.py

# 4. 生成应用用数据
python trueti/build_word_stats_app.py

# 5. 生成统一主库
python trueti/build_master_db.py
```

## 📚 文档导航

| 文档 | 说明 |
|------|------|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | 系统架构、数据流、模块划分 |
| [DATABASE.md](docs/DATABASE.md) | 数据库设计、表结构、ER 图 |
| [ALGORITHM.md](docs/ALGORITHM.md) | FSRS 算法原理、参数说明 |
| [API.md](docs/API.md) | 云函数接口、数据格式 |
| [USER_GUIDE.md](docs/USER_GUIDE.md) | 功能使用说明、常见问题 |

## 🎓 毕业设计亮点

### 1. ⭐ AI 驱动的智能学习（核心创新）
- **集成 DeepSeek API**：调用 DeepSeek 大模型生成高质量例句
- **真题感知的例句生成**：根据单词在真题中的出现频率和题型分布，生成贴近考研的例句
- **上下文感知**：利用用户单词本中已有的单词，生成包含多个词汇的复合例句，形成反复记忆效果
- **智能标签推荐**：AI 分析单词的语义和使用场景，自动推荐合适的标签（高频、作文词、口语词等）
- **多例句生成**：一次生成多个不同场景的例句，提供多角度学习

### 2. 数据融合与真题分析
- 整合 28 年考研英语真题（1998-2025）
- 按题型分类统计词汇出现频率（完形、阅读、新题型、翻译、写作）
- 为每个单词计算重要程度和标签
- AI 生成的例句融合真题统计数据，提高针对性

### 3. 记忆算法优化
- 实现了 FSRS-lite 记忆算法，相比 SM-2 更科学
- 支持难度、稳定性、可检索性等多维度参数
- 动态调整复习间隔，提高学习效率

### 4. 架构设计与性能优化
- 多数据源统一查询（主库、预生成库、用户库）
- 两阶段加载优化（轻量首帧 + 异步补全）
- 虚拟滚动支持大列表高效渲染
- AI 调用异步处理，不阻塞主线程

### 5. 跨平台支持
- 支持 iOS、Android、H5 等多平台
- 云端同步和离线可用
- 适配不同屏幕尺寸

## 🔧 开发指南

### 添加新单词
```javascript
import db from '@/utils/db_v2';

await db.addWord({
  english: 'example',
  chinese: '例子',
  tags: ['高频', '阅读'],
  source_page: 'reading_2024',
  importance: 4
});
```

### 查询单词
```javascript
// 按 ID 查询
const word = await db.getWordById(1);

// 分页查询
const words = await db.getWordsForList(50, 0, 'create_time', 'desc');

// 从主库查询
const detail = await masterDb.getWordFullDetail('example');
```

### 复习流程
```javascript
import { computeNextReviewState } from '@/utils/reviewAlgo';

// 用户答题后计算新状态
const newState = computeNextReviewState(word, true); // true 表示答对

// 更新数据库
await db.updateWord(word.id, newState);
```

## 📊 性能指标

- **首屏加载**：< 1s（H5）/ < 2s（App）
- **列表滚动**：60 FPS（虚拟滚动）
- **数据库查询**：< 100ms（SQLite 索引）
- **内存占用**：< 50MB（App）

## 🐛 常见问题

### Q: 如何导入自己的单词本？
A: 支持 CSV 格式，格式为 `english,chinese,tags`。在首页点击"导入"按钮选择文件。

### Q: 如何同步到其他设备？
A: 登录账号后，数据会自动同步到云端。在其他设备登录同一账号即可恢复数据。

### Q: 复习算法如何工作？
A: 详见 [ALGORITHM.md](docs/ALGORITHM.md)。简单来说，答对会增加复习间隔，答错会缩短间隔。

### Q: 如何更新真题数据？
A: 将新的真题 PDF 放入 `trueti` 文件夹，运行 `python trueti/build_master_db.py` 重新生成主库。

## 📝 许可证

本项目为本科毕业设计项目，仅供学习和研究使用。

## 👨‍💻 作者

[你的名字]

## 🙏 致谢

感谢以下开源项目和资源：
- uni-app 框架
- FSRS 算法论文
- 考研英语真题数据

---

**最后更新**：2026-03-21
