#!/usr/bin/env node

/**
 * 替换所有 console 调用为 logger 的脚本
 */

const fs = require('fs');
const path = require('path');

// 需要处理的文件列表
const files = [
  'pages/my/my.vue',
  'pages/mastered-words/mastered-words.vue',
  'pages/login/login.vue',
  'pages/quick-add/quick-add.vue',
  'pages/review/review.vue',
  'pages/debug/debug.vue',
  'pages/mistakes/mistakes.vue',
  'pages/stats/stats.vue',
  'pages/word-detail/word-detail.vue'
];

// 替换规则
const replacements = [
  // console.log 替换为 logger.debug 或 logger.info
  {
    pattern: /console\.log\('([^']+)',\s*([^)]+)\);/g,
    replacement: (match, msg, data) => {
      const component = path.basename(path.dirname(process.argv[2]));
      return `logger.debug('${component}', '${msg}', ${data});`;
    }
  },
  // console.error 替换为 logger.error
  {
    pattern: /console\.error\('([^']+)',\s*([^)]+)\);/g,
    replacement: (match, msg, data) => {
      const component = path.basename(path.dirname(process.argv[2]));
      return `logger.error('${component}', '${msg}', ${data});`;
    }
  },
  // console.warn 替换为 logger.warn
  {
    pattern: /console\.warn\('([^']+)',\s*([^)]+)\);/g,
    replacement: (match, msg, data) => {
      const component = path.basename(path.dirname(process.argv[2]));
      return `logger.warn('${component}', '${msg}', ${data});`;
    }
  }
];

console.log('开始替换 console 调用...');
console.log('');

files.forEach(file => {
  const filePath = path.join(process.cwd(), file);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  文件不存在: ${file}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf-8');
  const originalContent = content;

  // 检查是否已导入 logger
  if (!content.includes("import { logger")) {
    console.log(`⚠️  ${file} 未导入 logger，跳过`);
    return;
  }

  // 计数
  let count = 0;
  const consoleMatches = content.match(/console\./g) || [];
  count = consoleMatches.length;

  if (count === 0) {
    console.log(`✅ ${file}: 无 console 调用`);
    return;
  }

  // 简单替换（保留原始格式）
  content = content.replace(/console\.log\(/g, 'logger.debug(');
  content = content.replace(/console\.error\(/g, 'logger.error(');
  content = content.replace(/console\.warn\(/g, 'logger.warn(');
  content = content.replace(/console\.info\(/g, 'logger.info(');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✅ ${file}: 替换 ${count} 处 console 调用`);
  }
});

console.log('');
console.log('替换完成！');
