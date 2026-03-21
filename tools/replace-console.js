#!/usr/bin/env node

/**
 * 批量替换 console 调用为 logger 的脚本
 * 使用方法：node replace-console.js
 */

const fs = require('fs');
const path = require('path');

// 需要处理的文件列表
const filesToProcess = [
  'src/utils/db_v2.js',
  'src/utils/appInitializer.js',
  'src/utils/databaseAdapter.js',
  'src/utils/masterDb.js',
  'src/utils/aiService.js',
  'src/utils/importExport.js',
  'src/utils/pregenVocab.js',
  'src/utils/masteredWordbookWords.js',
  'src/utils/learningCenter_v2.js',
  'src/utils/wordbookSource.js',
  'src/utils/uniPolyfill.js',
  'src/utils/uni-app-compat.js',
];

const projectRoot = 'e:\\vocal\\wordbook_new';

function extractTag(line) {
  // 从 console.log('[tag] message') 中提取 tag
  const match = line.match(/console\.\w+\(\s*['"`]\[([^\]]+)\]/);
  return match ? match[1] : 'App';
}

function replaceConsoleInFile(filePath) {
  const fullPath = path.join(projectRoot, filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  文件不存在: ${filePath}`);
    return 0;
  }

  let content = fs.readFileSync(fullPath, 'utf-8');
  const originalContent = content;
  let count = 0;

  // 检查是否已有 logger 导入
  const hasLoggerImport = content.includes("import { logger }") ||
                          content.includes("import { logger,") ||
                          content.includes("from './errorHandler.js'");

  // 替换 console.error('[tag] message', error)
  content = content.replace(
    /console\.error\(\s*['"`]\[([^\]]+)\]\s*['"`]\s*,\s*([^)]+)\)/g,
    (match, tag, error) => {
      count++;
      return `logger.error('${tag}', '${tag}', ${error})`;
    }
  );

  // 替换 console.warn('[tag] message')
  content = content.replace(
    /console\.warn\(\s*['"`]\[([^\]]+)\]\s*['"`]\s*,?\s*([^)]*)\)/g,
    (match, tag, rest) => {
      count++;
      if (rest.trim()) {
        return `logger.warn('${tag}', '${tag}', ${rest})`;
      }
      return `logger.warn('${tag}', '${tag}')`;
    }
  );

  // 替换 console.log('[tag] message', data)
  content = content.replace(
    /console\.log\(\s*['"`]\[([^\]]+)\]\s*['"`]\s*,?\s*([^)]*)\)/g,
    (match, tag, rest) => {
      count++;
      if (rest.trim()) {
        return `logger.debug('${tag}', '${tag}', ${rest})`;
      }
      return `logger.debug('${tag}', '${tag}')`;
    }
  );

  // 添加 logger 导入（如果没有）
  if (!hasLoggerImport && count > 0) {
    const importLine = "import { logger } from './errorHandler.js';\n";

    // 在其他导入之后添加
    if (content.includes('import ')) {
      content = content.replace(
        /(import\s+[^;]+;)\n/,
        `$1\n${importLine}`
      );
    } else {
      // 在文件开头添加
      content = importLine + content;
    }
  }

  // 只有在有改动时才写入
  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content, 'utf-8');
    console.log(`✅ ${filePath}: 替换 ${count} 处`);
    return count;
  }

  return 0;
}

// 主程序
console.log('🚀 开始批量替换 console 调用...\n');

let totalCount = 0;
let processedFiles = 0;

for (const file of filesToProcess) {
  const count = replaceConsoleInFile(file);
  if (count > 0) {
    totalCount += count;
    processedFiles++;
  }
}

console.log(`\n✨ 完成！`);
console.log(`📊 统计：`);
console.log(`   - 处理文件数: ${processedFiles}`);
console.log(`   - 替换总数: ${totalCount}`);
