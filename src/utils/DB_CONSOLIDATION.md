# 数据库层整合说明

## 当前状态

### 文件结构
- **db.js** - 兼容层（保留）
  - 仅导出 `db_v2.js` 的默认导出
  - 所有导入 `db.js` 的代码无需修改

- **db_v2.js** - 核心实现（唯一的实现文件）
  - 包含所有数据库操作的完整实现
  - 支持 H5 和 App 两种环境
  - 使用数据库适配器 `databaseAdapter.js`

- **db_v2.backup.js** - 备份文件
  - 保存原始代码副本，用于参考

## 已实现的函数列表

### 基础操作
- `init()` - 初始化数据库
- `setupSchema()` - 设置数据库架构（仅 App）

### 单词查询
- `getWords()` - 获取所有单词
- `getAllWords()` - 别名，兼容旧代码
- `getWordById(id)` - 按 ID 获取单词
- `getWordByIdLight(id)` - 获取轻量信息（基础字段）
- `getWordByIdHeavy(id)` - 获取重型信息（examples/synonyms/antonyms）
- `getWordByEnglish(english)` - 按英文获取单词
- `getWordsForList(limit, offset, orderBy, orderDir, filters)` - 分页查询
- `getLastWord()` - 获取最后添加的单词

### 单词操作
- `addWord(word)` - 添加单词
- `updateWord(id, updates)` - 更新单词
- `deleteWord(id)` - 删除单词
- `clearAndInsertWords(words)` - 清空并批量插入（云端恢复）
- `incrementViewCount(id)` - 增加查看次数

### 复习相关
- `getReviewWords(params)` - 获取复习单词列表
- `updateErrorRate(id, isCorrect)` - 更新错误率
- `getRandomDistractors(excludeId, count)` - 获取随机干扰项
- `getWordsByTag(tag, excludeId)` - 获取同标签单词
- `getReviewInsight(word)` - 获取复习洞察（用于显示单词状态）
- `previewReviewState(word, isCorrect)` - 预览复习状态变化

### 已掌握单词
- `masterWord(id)` - 标记单词为已掌握
- `masterWordByEnglish(english)` - 按英文标记为已掌握
- `unmasterWord(id)` - 取消已掌握标记
- `getMasteredWords()` - 获取已掌握单词列表

### 工具方法
- `getMemoryStats()` - 获取内存使用情况

## 导入方式

所有文件都应该从 `db.js` 导入（兼容层）：

```javascript
import db from '../../src/utils/db';

// 使用示例
const words = await db.getWords();
await db.addWord({ english: 'hello', chinese: '你好' });
```

## 环境支持

### H5 环境
- 使用 `uni.getStorageSync()` / `uni.setStorageSync()` 存储数据
- 存储键：
  - `wordbook_h5_words` - 普通单词
  - `wordbook_h5_mastered_words` - 已掌握单词

### App 环境
- 使用 SQLite 数据库
- 数据库文件：`_doc/wordbook.db`
- 表：`words`, `mastered_words`
- 支持事务保护

## 关键特性

### 事务保护
以下操作使用事务保护，确保数据一致性：
- `masterWord()` - 移动单词到已掌握表
- `masterWordByEnglish()` - 按英文移动单词
- `clearAndInsertWords()` - 批量插入

### 错误处理
- 所有异步操作都有 try-catch 保护
- 错误会被记录到控制台
- 返回合理的默认值而不是抛出异常

### 性能优化
- H5 环境使用内存存储
- App 环境使用 SQLite 索引加速查询
- 支持分页查询避免一次加载过多数据

## 迁移完成

✅ 所有功能已从 `db.js` 迁移到 `db_v2.js`
✅ 保留 `db.js` 作为兼容层，无需修改现有导入
✅ 添加了缺失的函数：
  - `getWordByIdLight()` - 详情页首帧轻量加载
  - `getWordByIdHeavy()` - 详情页异步补全重型数据
  - `masterWordByEnglish()` - 按英文标记为已掌握
  - `clearAndInsertWords()` - 云端恢复时批量插入
  - `getAllWords()` - 获取所有单词别名
  - `getLastWord()` - 获取最后添加的单词
  - `incrementViewCount()` - 增加查看次数
  - `unmasterWord()` - 取消已掌握标记
  - `getReviewInsight()` - 获取复习洞察
  - `previewReviewState()` - 预览复习状态变化

## 下一步建议

1. 删除 `db_v2.backup.js`（如果确认不需要）
2. 考虑在 `db.js` 中添加注释说明这是兼容层
3. 新代码可以直接从 `db_v2.js` 导入（可选）
