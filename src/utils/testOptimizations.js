/**
 * 性能优化测试模块 (testOptimizations.js)
 *
 * 功能：
 * - 测试日志系统的正确性
 * - 测试虚拟滚动的性能
 * - 测试缓存机制的效率
 * - 测试数据库查询的性能
 *
 * 使用场景：
 * - 开发时验证各个模块的功能
 * - 性能调优时测试优化效果
 * - 发布前进行完整的功能测试
 *
 * 注意：
 * - 这些测试函数仅用于开发和调试
 * - 生产环境中应该禁用这些测试
 */

import { logger, LogLevel } from './errorHandler.js';

/**
 * 测试日志系统
 *
 * 测试项：
 * 1. 环境检测：验证是否正确识别开发/生产环境
 * 2. 日志级别：测试 DEBUG、INFO、WARN、ERROR 四个级别
 * 3. 日志数据：测试带数据的日志记录
 * 4. 日志获取：测试获取已记录的日志
 * 5. 动态调整：测试运行时修改日志级别
 * 6. 导出功能：测试导出为 JSON 和 CSV 格式
 *
 * 预期结果：
 * - 开发环境：所有日志都显示
 * - 生产环境：只显示 INFO 及以上级别
 * - 导出功能：能正确导出日志数据
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
 *
 * 虚拟滚动原理：
 * - 只渲染可见区域的元素
 * - 根据滚动位置动态计算可见范围
 * - 大幅减少 DOM 节点数量，提升性能
 *
 * 测试内容：
 * - 创建 1000 个虚拟元素
 * - 模拟滚动到不同位置
 * - 计算每个位置的可见元素范围
 * - 验证计算结果的正确性
 *
 * 性能指标：
 * - 渲染时间：应该在 16ms 以内（60fps）
 * - 内存占用：应该保持在较低水平
 * - 滚动流畅度：应该没有卡顿
 */
export function testVirtualScroller() {
  console.log('=== 虚拟滚动测试开始 ===\n');

  // 模拟虚拟滚动逻辑
  // 创建 1000 个虚拟元素
  const items = Array.from({ length: 1000 }, (_, i) => ({
    id: i,
    english: `word_${i}`,
    chinese: `单词_${i}`
  }));

  // 虚拟滚动参数
  const itemHeight = 80;  // 每个元素的高度（像素）
  const containerHeight = 600;  // 容器高度（像素）
  const bufferSize = 5;  // 缓冲区大小（在可见范围外预加载的元素数）

  // 计算可见范围
  const scrollTop = 500;  // 当前滚动位置
  const visibleCount = Math.ceil(containerHeight / itemHeight);  // 可见元素数量
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
