# 考研真题文件夹结构说明

若你**只有 PDF 真题**，请先按下面「第一步」把 PDF 转成 TXT，再按「第二步」做词汇统计。

---

## 第一步：把 PDF 转成 TXT

1. 把真题 PDF 放进 `trueti` 文件夹（可分子文件夹，见下）。
2. 在项目根目录执行：

```bash
pip install -r trueti/requirements.txt   # 首次运行，安装 pymupdf
python trueti/pdf_to_txt.py
```

脚本会**递归扫描** `trueti` 下所有 `.pdf`，在每个 PDF 同目录生成**同名 .txt**（如 `2024_阅读.pdf` → `2024_阅读.txt`）。  
转换完成后，再执行第二步的词汇统计即可。

---

## 真题卷内题型（自动分段）

每份完整试卷的 TXT 内通常包含：**Section I Use of English**（完形）→ **Section II Reading** 下 Part A（阅读）、Part B（新题型）、Part C（翻译）→ **Section III Writing**（写作）。脚本会按这些标题自动分段统计每个词在 完形/阅读/新题型/翻译/写作 中的次数，无需手动分文件。详见 `题型说明.md`。

---

## 第二步：组织方式与词汇统计

若已是「一年一文件」的完整试卷，放在 trueti 下即可，年份和题型会自动识别。也可按以下方式组织（PDF 或已转好的 TXT 均可）。

### 方式一：按年份 + 题型分文件夹（推荐）

```
trueti/
├── 2024/
│   ├── 阅读/
│   │   └── part1.pdf    → 会生成 part1.txt
│   ├── 翻译/
│   │   └── 翻译.pdf
│   └── 完形/
│       └── 完形.pdf
├── 2023/
│   └── ...
└── ...
```

- **年份**：由文件夹名解析（如 `2024`、`2010`）。
- **题型**：由子文件夹名解析，支持：`阅读`、`翻译`、`完形`、`新题型`、`写作`。

### 方式二：文件名包含年份和题型

```
trueti/
├── 2024_阅读.pdf   → 生成 2024_阅读.txt
├── 2024_翻译.pdf
├── 2023_阅读.pdf
└── ...
```

- 文件名中需包含 4 位年份（1990–2030）和题型关键词（阅读/翻译/完形/新题型/写作）。

---

## 运行词汇统计

PDF 已转成 TXT 后，在项目根目录执行：

```bash
python trueti/word_stats_from_trueti.py
```

结果输出到 `trueti/word_stats_output.json`。

---

## 第三步：生成 App 用静态数据（推荐）

在 `word_stats_output.json` 生成后，运行：

```bash
python trueti/build_word_stats_app.py
```

脚本会为每个词**预计算**重要程度(importance)、标签(tags)，并去掉 positions 等大字段，输出到 **`static/word-stats.json`**。  
App 直接读取该文件做展示与筛选，**无需在端上再算**，打开单词详情时也不会重复加载/计算。

- 支持 **.txt**、**.md** 纯文本（含由 PDF 转换得到的 .txt）。
- 若同一题型多篇，可放在同一文件夹的多个文件中（如 part1.txt, part2.txt），或合并为一个文件。
