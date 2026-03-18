# 考研英语单词本

由 `trueti/build_wordbooks.py` 根据真题词频与重要程度生成。先运行 `word_stats_from_trueti.py` 和 `build_word_stats_app.py` 再运行 `build_wordbooks.py`。依赖 `src/utils/word-dict.json`（单词库）和 `nltk`（词形还原）。

## 处理规则

- **只保留词根**：过去式、现在分词、过去分词等变形会通过 NLTK 词形还原合并为同一词根，频次累加。
- **仅保留词库中的词**：只有出现在 `word-dict.json` 中的词（或能还原为该词库中的词根）才会写入单词本，垃圾词、拼写错误等会被过滤。
- **傻瓜词**：极常见功能词（the, a, of, is, are 等） + 真题出现次数最高的前 120 个词，不进入任何单词本。

## 单词本列表

| 文件名 | 说明 |
|--------|------|
| **真题高频词** | 真题出现次数 ≥ 4 次，适合重点背诵。 |
| **真题所有词** | 真题高频词 + 出现 1～3 次的词，覆盖真题全部词。 |
| **红宝书** | 仅从两本 TXT（导览速记打卡簿 + 连线自测本）二合一提取，约六千多词；格式同上。 |
| **红宝书补全版** | 红宝书 + 真题中出现≥1 次但两本 TXT 未收录的词（均在词库中），更全。 |

## 文件格式

- `.csv`：三列「单词, 真题出现次数, 重要程度(1-5)」
- `.txt`：每行一个单词，便于导入 App 或打印

## 重新生成

- 真题相关三个单词本：`python trueti/build_wordbooks.py`
- 红宝书单词库（需先将两个 TXT 放入 `trueti` 并运行过 `pdf_to_txt.py`）：`python trueti/build_hongbaoshu_from_txt.py`

## AI 预生成批处理（例句 / 近义词 / 反义词）

使用 `trueti/batch_ai_vocab.py` 可对「红宝书补全版」中的单词批量调用 DeepSeek API，生成例句、近义词、反义词并写入 `trueti/kaoyan_vocab.db`（表结构与 App 内 SQLite 一致，便于后续导入或作为预置词库）。

- **断点续传**：默认跳过数据库中已存在的单词（按 `english` 判断），中断后重新运行即可接着跑。
- **速率限制**：每次请求后等待 2 秒（可 `--delay` 调整），失败自动重试。
- **依赖**：`pip install requests`（见 `trueti/requirements.txt`）。
- **API Key**：设置环境变量 `DEEPSEEK_API_KEY`，或在项目根目录创建 `.env` 写入 `DEEPSEEK_API_KEY=你的key`。

示例：

```bash
cd 项目根目录
set DEEPSEEK_API_KEY=你的key
python trueti/batch_ai_vocab.py
```

可选参数：`--txt` 单词列表路径、`--db` 输出库路径、`--delay` 请求间隔（秒）、`--limit N` 只处理前 N 个词、`--no-dict` 不加载 word-dict（不填中文释义以省内存）、`--no-skip` 不跳过已存在单词、`--export-only` 仅从已有 DB 导出 JSON（不调 API）、`--json` 指定导出 JSON 路径。

**与 App 的衔接**：脚本结束后会导出 `static/pregen_vocab.json`。App 在切换「红宝书补全版」等单词本、快速添加、单词详情中会**优先从该文件读取**释义 / 例句 / 近义词 / 反义词，仅当预生成中无该词时才调用 API，从而避免对约 1 万词重复请求。
