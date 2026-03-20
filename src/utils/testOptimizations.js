/**
 * 日志系统测试
 * 验证日志系统是否正确工作
 */

import { logger, LogLevel } from './errorHandler.js';

/**
 * 测试日志系统
 */
export function testLoggingSystem() {
  console.log('=== 日志系统测试开始 ===\n');

  // 测试 1：检查环境检测
  console.log('测试 1：环境检测');
  console.log('当前日志级别:', logger.getLevel());
  console.log('预期：开发环境 = 0 (DEBUG)，生产环境 = 1 (INFO)\n');

  // 测试 2：测试不同级别的日志
  console.log('测试 2：不同级别的日志输出');
  logger.debug('Test', '这是 DEBUG 日志（开发环境显示，生产环境不显示）');
  logger.info('Test', '这是 INFO 日志（所有环境显示）');
  logger.warn('Test', '这是 WARN 日志（所有环境显示）');
  logger.error('Test', '这是 ERROR 日志（所有环境显示）');
  console.log('');

  // 测试 3：测试日志数据
  console.log('测试 3：日志数据记录');
  logger.info('Test', '带数据的日志', { userId: 123, action: 'login' });
  console.log('');

  // 测试 4：获取日志
  console.log('测试 4：获取记录的日志');
  const allLogs = logger.getLogs();
  console.log('总日志数:', allLogs.length);
  console.log('最后一条日志:', allLogs[allLogs.length - 1]);
  console.log('');

  // 测试 5：动态调整日志级别
  console.log('测试 5：动态调整日志级别');
  console.log('原日志级别:', logger.getLevel());
  logger.setLevel(LogLevel.WARN);
  console.log('修改后日志级别:', logger.getLevel());
  logger.debug('Test', '这条 DEBUG 日志不会显示');
  logger.warn('Test', '这条 WARN 日志会显示');
  logger.setLevel(LogLevel.DEBUG); // 恢复
  console.log('');

  // 测试 6：导出日志
  console.log('测试 6：导出日志');
  const jsonLogs = logger.exportAsJson();
  console.log('JSON 导出长度:', jsonLogs.length, '字符');
  const csvLogs = logger.exportAsCsv();
  console.log('CSV 导出长度:', csvLogs.length, '字符');
  console.log('');

  console.log('=== 日志系统测试完成 ===\n');
}

/**
 * 测试虚拟滚动
 */
export function testVirtualScroller() {
  console.log('=== 虚拟滚动测试开始 ===\n');

  // 模拟虚拟滚动逻辑
  const items = Array.from({ length: 1000 }, (_, i) => ({
    id: i,
    english: `word_${i}`,
    chinese: `单词_${i}`
  }));

  const itemHeight = 80;
  const containerHeight = 600;
  const bufferSize = 5;

  // 计算可见范围
  const scrollTop = 500;
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const visibleStart = Math.max(0, Math.floor(scrollTop / itemHeight) - bufferSize);
  const visibleEnd = Math.min(items.length, visibleStart + visibleCount + bufferSize * 2);

  console.log('测试参数：');
  console.log('- 总项数:', items.length);
  console.log('- 项高度:', itemHeight, 'px');
  console.log('- 容器高度:', containerHeight, 'px');
  console.log('- 缓冲区大小:', bufferSize);
  console.log('- 滚动位置:', scrollTop, 'px\n');

  console.log('计算结果：');
  console.log('- 可见项数:', visibleCount);
  console.log('- 可见范围:', visibleStart, '-', visibleEnd);
  console.log('- 实际渲染项数:', visibleEnd - visibleStart);
  console.log('- 性能提升:', Math.round((1 - (visibleEnd - visibleStart) / items.length) * 100), '%\n');

  console.log('=== 虚拟滚动测试完成 ===\n');
}

/**
 * 运行所有测试
 */
export function runAllTests() {
  testLoggingSystem();
  testVirtualScroller();
}
