# 新模块集成指南

本指南说明如何在现有项目中集成新的重构模块，保持向后兼容性，逐步迁移。

## 第一步：在 App.vue 中初始化应用

打开 `App.vue`，在 `onLoad` 和 `onUnload` 中添加初始化代码：

```javascript
<script setup>
import { onLoad, onUnload } from '@dcloudio/uni-app';
import { initializeApp, cleanupApp } from './src/utils/appInitializer.js';

onLoad(async () => {
  try {
    await initializeApp();
  } catch (error) {
    console.error('应用初始化失败:', error);
  }
});

onUnload(() => {
  cleanupApp();
});
</script>
```

## 第二步：在页面中使用新的数据库模块

**旧代码：**
```javascript
import db from '../../src/utils/db';
```

**新代码：**
```javascript
import db from '../../src/utils/db_v2';
```

使用方式完全相同，无需修改其他代码。

## 第三步：在页面中使用新的学习中心模块

**旧代码：**
```javascript
import * as learningCenter from '../../src/utils/learningCenter.js';
```

**新代码：**
```javascript
import * as learningCenter from '../../src/utils/learningCenter_v2.js';
```

## 第四步：添加错误处理

在关键页面中添加全局错误处理：

```javascript
import { logger } from '../../src/utils/errorHandler.js';

try {
  // 你的代码
} catch (error) {
  logger.error('YourComponent', '操作失败', error);
}
```

## 第五步：使用缓存清理

在页面卸载时调用缓存清理：

```javascript
import { onUnload } from '@dcloudio/uni-app';
import { cleanupExpiredCaches } from '../../src/utils/learningCenter_v2.js';

onUnload(() => {
  cleanupExpiredCaches();
});
```

## 迁移检查清单

- [ ] 在 App.vue 中调用 initializeApp()
- [ ] 更新关键页面的导入语句
- [ ] 添加错误处理
- [ ] 测试基本功能
- [ ] 验证数据一致性
- [ ] 检查性能指标
- [ ] 收集用户反馈

## 常见问题

### Q: 新旧模块可以混用吗？
A: 可以，但不推荐。建议逐步迁移，最后删除旧模块。

### Q: 如何回滚到旧版本？
A: 只需改回导入语句即可，数据完全兼容。

### Q: 性能会提升多少？
A: 预期提升 15-25%，主要来自缓存优化。

### Q: 如何监控性能？
A: 使用 errorHandler 中的性能监控功能，可以导出性能指标。
