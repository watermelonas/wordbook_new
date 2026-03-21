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
  // 用于调用 DeepSeek API 生成例句、近义词等
  // 修改此处即可全局生效
  // 生产环境应使用环境变量：process.env.DEEPSEEK_API_KEY
  deepseekApiKey: 'sk-c8ae8c792aa04c15960a0f5c7a38442c',  // 请替换为你的新 API Key

  // 是否启用 AI 服务
  // 设为 false 时关闭所有 AI 请求（仅用于测试，避免误触发 API）
  // 当禁用时，AI 相关功能会返回模拟数据
  aiServiceEnabled: true,
};
