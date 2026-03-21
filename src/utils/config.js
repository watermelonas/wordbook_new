/**
 * 全局配置模块 (config.js)
 *
 * 功能：
 * - 管理 API Key 和全局配置
 * - 控制 AI 服务的启用/禁用
 * - 提供统一的配置入口
 *
 * 配置项：
 * - deepseekApiKey：DeepSeek API 密钥
 * - aiServiceEnabled：是否启用 AI 服务
 *
 * 使用场景：
 * - 前端 App 调用 AI 服务
 * - Python 脚本调用 AI 服务
 * - 测试时禁用 AI 服务
 *
 * 注意：
 * - 修改此处的配置会全局生效
 * - 不要将真实的 API Key 提交到版本控制
 * - 生产环境应使用环境变量
 */

export default {
  // DeepSeek API Key
  // 从环境变量读取，本地开发时从 .env.local 读取
  // 优先级：环境变量 > .env.local > 空字符串
  deepseekApiKey: import.meta.env.VITE_DEEPSEEK_API_KEY || '',

  // 是否启用 AI 服务
  // 设为 false 时关闭所有 AI 请求（仅用于测试，避免误触发 API）
  // 当禁用时，AI 相关功能会返回模拟数据
  aiServiceEnabled: import.meta.env.VITE_AI_SERVICE_ENABLED !== 'false',
};
