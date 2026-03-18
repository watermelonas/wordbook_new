/**
 * 全局唯一 API Key 配置
 * 前端 App、Python 脚本（refine/batch 等）均从此处读取
 * 只需在此修改一次，全项目生效
 */
export default {
  // DeepSeek API Key，修改此处即可全局生效
  deepseekApiKey: 'sk-c8ae8c792aa04c15960a0f5c7a38442c',  // 请替换为你的新 API Key
  // 设为 false 时关闭所有 AI 请求（仅用于测试，避免误触发 API）
  aiServiceEnabled: true,
};
