真题数据处理工具说明

本目录包含用于处理考研英语真题数据的Python脚本和相关数据文件。

目录结构

真题文本文件
- 1998-2025年考研英语真题（一）：按年份命名的TXT文件
- 2010-2016考研英语二真题集.txt：英语二真题合集
- 2017-2025年考研英语二真题：按年份命名的TXT文件
- 2026红宝书.txt：2026年考研英语红宝书词汇
- 26红宝书导览速记打卡簿.txt：红宝书学习辅助资料
- 26红宝书连线自测本.txt：红宝书自测资料

单词本数据
- wordbooks/目录下包含处理后的单词本数据：
  - 红宝书.csv / 红宝书.txt：红宝书词汇表
  - 红宝书补全版.csv / 红宝书补全版.txt：补全版词汇表
  - 真题高频词.csv / 真题高频词.txt：真题中的高频词汇
  - 真题所有词.csv / 真题所有词.txt：真题中出现的所有词汇

数据库文件
- kaoyan_vocab.db：主数据库，包含所有单词的基础信息和真题统计数据
- word_exam.db：真题例句数据库

JSON数据文件
- word_exam_sentences.json：真题例句数据（JSON格式）
- word_stats_output.json：真题词汇统计数据（JSON格式）

Python脚本说明

核心数据处理脚本

1. build_master_db.py
   功能：从真题文本生成统一主库
   输入：真题TXT文件、单词本CSV文件
   输出：kaoyan_vocab.db（主数据库）
   用途：生成应用使用的主数据库，包含所有单词的基础信息和真题统计数据

2. word_stats_from_trueti.py
   功能：统计真题词汇出现频率和题型分布
   输入：真题TXT文件
   输出：word_stats_output.json、word_exam_sentences.json
   用途：分析单词在真题中的出现频率、题型分布、年份分布等

3. batch_ai_vocab.py
   功能：调用DeepSeek API生成例句和标签
   输入：单词列表、真题统计数据
   输出：预生成词库数据
   用途：使用AI大模型为单词生成高质量例句和智能标签

4. sync_pregen_to_app.py
   功能：将预生成数据同步到应用
   输入：预生成词库数据
   输出：应用可用的数据格式
   用途：将AI生成的数据转换为应用可直接使用的格式

辅助脚本

5. build_wordbooks.py
   功能：从真题文本提取单词并生成单词本
   输入：真题TXT文件
   输出：单词本CSV文件
   用途：从真题中提取词汇，生成标准化的单词本

6. build_hongbaoshu_wordbook.py
   功能：从红宝书文本生成单词本
   输入：红宝书TXT文件
   输出：红宝书单词本CSV文件
   用途：处理红宝书词汇数据

7. build_hongbaoshu_from_txt.py
   功能：从PDF转换的TXT生成红宝书数据
   输入：红宝书TXT文件
   输出：结构化的红宝书数据
   用途：处理红宝书原始数据

8. build_word_stats_app.py
   功能：生成应用使用的统计数据
   输入：真题统计数据
   输出：应用可用的JSON格式数据
   用途：将统计数据转换为应用前端可直接使用的格式

数据检查脚本

9. check_batch_data.py
   功能：检查批量处理的数据质量
   输入：处理后的数据
   输出：数据质量报告
   用途：验证AI生成的数据是否符合要求

10. check_batch_progress.py
    功能：检查批量处理的进度
    输入：处理日志
    输出：进度统计
    用途：监控长时间运行的批处理任务

11. check_master_db.py
    功能：检查主数据库的完整性
    输入：kaoyan_vocab.db
    输出：数据库检查报告
    用途：验证主数据库是否完整正确

12. inspect_master_dbs.py
    功能：检查多个主数据库
    输入：多个数据库文件
    输出：对比分析报告
    用途：对比不同版本的主数据库

13. inspect_word_entry.py
    功能：检查单个单词条目
    输入：单词
    输出：单词详细信息
    用途：调试单个单词的数据

14. inspect_db_schema.py
    功能：检查数据库架构
    输入：数据库文件
    输出：表结构信息
    用途：了解数据库的表结构和字段定义

数据导入导出脚本

15. import_pregen_json_to_db.py
    功能：将预生成JSON数据导入数据库
    输入：预生成JSON文件
    输出：数据库记录
    用途：将AI生成的JSON数据导入数据库

16. export_for_ai.py
    功能：导出数据供AI处理
    输入：数据库数据
    输出：AI可处理的格式
    用途：准备数据供AI大模型处理

其他脚本

17. pdf_to_txt.py
    功能：将PDF真题转换为TXT文本
    输入：PDF文件
    输出：TXT文本文件
    用途：处理PDF格式的真题文件

18. scan_pdf_pages.py
    功能：扫描PDF页数
    输入：PDF文件
    输出：页数信息
    用途：了解PDF文件的结构

19. retry_failed_batch.py
    功能：重试失败的批处理任务
    输入：失败的任务列表
    输出：重试结果
    用途：处理之前失败的AI生成任务

20. refine_pending_only.py
    功能：仅处理待处理的数据
    输入：待处理数据列表
    输出：处理结果
    用途：增量处理新增数据

21. refine_vocab_deepseek.py
    功能：使用DeepSeek优化词汇数据
    输入：词汇数据
    输出：优化后的词汇数据
    用途：改进词汇的例句和标签质量

22. scan_refined_db_candidates.py
    功能：扫描需要优化的数据库记录
    输入：数据库
    输出：候选记录列表
    用途：找出需要AI优化的词汇

23. restore_merged_master_db.py
    功能：恢复合并的主数据库
    输入：备份文件
    输出：恢复的数据库
    用途：从备份恢复数据库

24. word_stats_report.py
    功能：生成词汇统计报告
    输入：统计数据
    输出：报告文件
    用途：生成可读的统计报告

配置文件

- api_config.py：API配置文件，包含DeepSeek API密钥等配置
- requirements.txt：Python依赖列表

使用流程

基础流程（生成主数据库）

1. 准备真题文本文件
   将所有真题PDF转换为TXT文件，放入trueti目录

2. 生成单词本
   python build_wordbooks.py
   从真题中提取词汇，生成单词本CSV文件

3. 统计真题词汇
   python word_stats_from_trueti.py
   分析单词在真题中的出现频率和题型分布

4. 生成主数据库
   python build_master_db.py
   生成应用使用的主数据库

5. 生成应用数据
   python build_word_stats_app.py
   生成应用前端使用的JSON数据

AI增强流程（生成例句和标签）

1. 导出数据供AI处理
   python export_for_ai.py
   准备数据供AI大模型处理

2. 调用AI生成例句
   python batch_ai_vocab.py
   使用DeepSeek API为单词生成高质量例句和标签

3. 检查AI生成质量
   python check_batch_data.py
   验证AI生成的数据是否符合要求

4. 导入预生成数据
   python import_pregen_json_to_db.py
   将AI生成的数据导入数据库

5. 同步到应用
   python sync_pregen_to_app.py
   将预生成数据同步到应用

数据库架构

主数据库（kaoyan_vocab.db）包含以下主要表：

- words：单词基础信息
  - id：单词ID
  - english：英文单词
  - chinese：中文释义
  - phonetic：音标
  - part_of_speech：词性
  - source：来源

- word_stats：真题统计数据
  - word_id：单词ID
  - frequency：出现频率
  - exam_years：出现年份
  - question_types：题型分布
  - importance：重要程度

- pregen_data：预生成数据
  - word_id：单词ID
  - sentences：生成的例句
  - tags：智能标签
  - ai_generated_at：生成时间

常见问题

Q: 如何更新真题数据？
A: 将新的真题PDF放入trueti目录，转换为TXT，然后运行build_master_db.py重新生成主数据库。

Q: AI生成的例句质量不好怎么办？
A: 可以调整batch_ai_vocab.py中的提示词，或者手动编辑生成的数据。

Q: 如何增量处理新增数据？
A: 使用refine_pending_only.py脚本，只处理标记为待处理的数据。

Q: 数据库太大怎么办？
A: 可以定期清理过期数据，或者分离为多个数据库。

Q: 如何备份数据？
A: 定期复制数据库文件到备份位置，或使用restore_merged_master_db.py进行备份恢复。

依赖安装

pip install -r requirements.txt

主要依赖包括：
- sqlite3：数据库操作
- requests：HTTP请求（调用API）
- json：JSON数据处理
- PyPDF2：PDF处理（可选）
