#!/bin/bash

# 获取所有 utils 文件
files=(
  "aiService.js"
  "algorithmConfig.js"
  "appConfig.js"
  "appInitializer.js"
  "cacheManager.js"
  "config.example.js"
  "config.js"
  "dataRepair.js"
  "dataTransformer.js"
  "databaseAdapter.js"
  "db_v2.js"
  "errorHandler.js"
  "globalComponents.js"
  "importExport.js"
  "learningCenter_v2.js"
  "localWordSnapshot.js"
  "masterDb.js"
  "masteredWordbookWords.js"
  "pregenVocab.js"
  "reviewAlgo.js"
  "reviewDataSyncManager.js"
  "reviewPriorityCache.js"
  "reviewUtils.js"
  "sqlHelper.js"
  "testOptimizations.js"
  "uni-app-compat.js"
  "uniLifecyclePlugin.js"
  "uniPolyfill.js"
  "validators.js"
  "wordStats.js"
  "wordbookSource.js"
)

echo "=== 检查未被引用的文件 ==="
for file in "${files[@]}"; do
  # 搜索导入该文件的地方
  count=$(grep -r "from.*$file\|require.*$file" --include="*.js" --include="*.vue" --exclude-dir=node_modules --exclude-dir=unpackage . 2>/dev/null | grep -v "src/utils/$file:" | wc -l)
  if [ $count -eq 0 ]; then
    echo "❌ $file - 未被引用"
  fi
done
