# 错误处理和日志记录指南

本文档说明如何在项目中统一使用错误处理和日志记录。

## 快速开始

### 导入日志器

```javascript
import { logger, errorHandler } from '../../src/utils/errorHandler.js';
```

### 基本用法

```javascript
// 记录不同级别的日志
logger.debug('ComponentName', '调试信息', { data: 'value' });
logger.info('ComponentName', '信息', { data: 'value' });
logger.warn('ComponentName', '警告', { data: 'value' });
logger.error('ComponentName', '错误', { data: 'value' });

// 处理错误
try {
  // 你的代码
} catch (error) {
  errorHandler.handle(error, { component: 'ComponentName', action: 'someAction' });
}
```

## 日志级别

| 级别 | 值 | 用途 | 示例 |
|------|-----|------|------|
| DEBUG | 0 | 调试信息 | 函数入口、变量值 |
| INFO | 1 | 一般信息 | 操作成功、状态变化 |
| WARN | 2 | 警告信息 | 性能问题、不推荐用法 |
| ERROR | 3 | 错误信息 | 异常、失败操作 |

## 使用场景

### 1. 页面组件中的错误处理

```javascript
<script setup>
import { ref } from 'vue';
import { onShow, onUnload } from '@dcloudio/uni-app';
import { logger } from '../../src/utils/errorHandler.js';

const loadData = async () => {
  try {
    logger.info('MyPage', '开始加载数据');
    const data = await fetchData();
    logger.info('MyPage', '数据加载成功', { count: data.length });
    return data;
  } catch (error) {
    logger.error('MyPage', '数据加载失败', error);
    uni.showToast({ title: '加载失败', icon: 'none' });
  }
};

onShow(() => {
  loadData();
});

onUnload(() => {
  logger.debug('MyPage', '页面卸载');
});
</script>
```

### 2. 工具函数中的错误处理

```javascript
// src/utils/myUtil.js
import { logger, errorHandler } from './errorHandler.js';

export async function processData(data) {
  const startTime = Date.now();
  try {
    logger.debug('processData', '开始处理数据', { size: data.length });

    // 处理逻辑
    const result = await doSomething(data);

    const duration = Date.now() - startTime;
    logger.info('processData', `处理完成 (${duration}ms)`, { resultSize: result.length });
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('processData', `处理失败 (${duration}ms)`, error);
    throw error;
  }
}
```

### 3. 数据库操作中的错误处理

```javascript
import { logger, globalErrorManager } from './errorHandler.js';

export async function saveWord(word) {
  const startTime = Date.now();
  try {
    logger.debug('Database', '保存单词', { english: word.english });

    const result = await db.save(word);

    const duration = Date.now() - startTime;
    globalErrorManager.logDatabaseOperation('saveWord', duration, true);
    logger.info('Database', '单词保存成功', { id: result.id });

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    globalErrorManager.logDatabaseOperation('saveWord', duration, false, error);
    throw error;
  }
}
```

### 4. 使用错误处理包装器

```javascript
import { withErrorHandling, withPerformanceMonitoring } from './errorHandler.js';

// 异步函数包装
const fetchUserData = withErrorHandling(async (userId) => {
  const response = await api.getUser(userId);
  return response.data;
}, 'fetchUserData');

// 性能监控包装
const processLargeData = withPerformanceMonitoring(async (data) => {
  return await heavyComputation(data);
}, 'processLargeData');
```

## 最佳实践

### ✅ 推荐做法

1. **使用有意义的 tag**
   ```javascript
   logger.info('WordDetail', '单词详情加载成功');  // ✅ 好
   logger.info('tag', '加载成功');                 // ❌ 不好
   ```

2. **包含上下文信息**
   ```javascript
   logger.error('Review', '复习失败', {
     wordId: word.id,
     reason: error.message
   });  // ✅ 好
   ```

3. **记录性能指标**
   ```javascript
   const start = Date.now();
   // 操作
   const duration = Date.now() - start;
   logger.info('Operation', `完成 (${duration}ms)`);  // ✅ 好
   ```

4. **在关键路径上记录日志**
   ```javascript
   logger.info('Review', '开始复习');
   logger.info('Review', '用户答题');
   logger.info('Review', '复习完成');  // ✅ 好
   ```

### ❌ 避免做法

1. **不要使用 console.log**
   ```javascript
   console.log('data:', data);  // ❌ 不好
   logger.info('Component', '数据', data);  // ✅ 好
   ```

2. **不要记录敏感信息**
   ```javascript
   logger.info('Login', '用户密码', { password: pwd });  // ❌ 不好
   logger.info('Login', '登录成功', { userId: uid });    // ✅ 好
   ```

3. **不要过度记录**
   ```javascript
   // ❌ 不好 - 每次循环都记录
   for (let i = 0; i < 1000; i++) {
     logger.debug('Loop', `迭代 ${i}`);
   }

   // ✅ 好 - 只记录关键点
   logger.debug('Loop', `开始处理 ${items.length} 项`);
   // ... 处理
   logger.info('Loop', `处理完成`);
   ```

4. **不要忽略错误**
   ```javascript
   try {
     await operation();
   } catch (e) {
     // ❌ 不好 - 忽略错误
   }

   try {
     await operation();
   } catch (e) {
     logger.error('Component', '操作失败', e);  // ✅ 好
   }
   ```

## 日志导出

### 导出为 JSON

```javascript
import { logger } from './errorHandler.js';

const jsonLogs = logger.exportAsJson();
// 保存或上传 jsonLogs
```

### 导出为 CSV

```javascript
const csvLogs = logger.exportAsCsv();
// 保存或上传 csvLogs
```

### 获取诊断信息

```javascript
import { globalErrorManager } from './errorHandler.js';

const diagnostics = globalErrorManager.getDiagnostics();
console.log(diagnostics);
// {
//   timestamp: '2026-03-20T...',
//   logs: [...],
//   logCount: 150,
//   memoryUsage: {...}
// }
```

## 迁移现有代码

### 从 console.log 迁移

**旧代码：**
```javascript
console.log('加载数据');
console.error('加载失败:', error);
```

**新代码：**
```javascript
import { logger } from './errorHandler.js';

logger.info('Component', '加载数据');
logger.error('Component', '加载失败', error);
```

### 从 try-catch 迁移

**旧代码：**
```javascript
try {
  await operation();
} catch (e) {
  console.error('操作失败:', e);
  throw e;
}
```

**新代码：**
```javascript
import { logger, errorHandler } from './errorHandler.js';

try {
  await operation();
} catch (e) {
  logger.error('Component', '操作失败', e);
  throw e;
}
```

## 常见问题

### Q: 如何禁用某个 tag 的日志？
A: 目前没有 tag 级别的过滤，但可以通过日志级别过滤。如需要，可以扩展 Logger 类。

### Q: 日志会占用多少内存？
A: 默认保留最后 500 条日志，每条日志约 200-500 字节，总计约 100-250KB。

### Q: 如何在生产环境中禁用 DEBUG 日志？
A: 在 appInitializer.js 中修改日志级别：
```javascript
logger.minLevel = LogLevel.INFO;  // 只记录 INFO 及以上
```

### Q: 如何添加自定义错误处理器？
A: 使用 errorHandler.addHandler()：
```javascript
errorHandler.addHandler((errorInfo) => {
  // 上报到服务器
  api.reportError(errorInfo);
});
```
