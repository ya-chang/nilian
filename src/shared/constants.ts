// src/shared/constants.ts
// 全局常量

// 应用信息
export const APP_NAME = '微信AI恋人'
export const APP_VERSION = '1.4.0'

// 窗口尺寸
export const WINDOW_WIDTH = 1200
export const WINDOW_HEIGHT = 800
export const MIN_WINDOW_WIDTH = 900
export const MIN_WINDOW_HEIGHT = 600

// 布局尺寸 (微信PC端比例)
export const SIDE_NAV_WIDTH = 54
export const CHAT_LIST_WIDTH = 260
export const CHAT_WINDOW_MIN_WIDTH = 400

// 聊天参数
export const MAX_MESSAGE_HISTORY = 20
export const MAX_MEMORY_RETRIEVE = 5
export const MAX_LEARNING_TOKENS = 300

// 记忆相关
export const MEMORY_WINDOW_OPTIONS = ['1month', '3months', '6months'] as const
export const MEMORY_WINDOW_DEFAULT = '3months'

// 行为策略
export const HUMANIZER_CONFIG = {
  emojiOnlyChance: 0.05,
  longDelayChance: 0.08,
  longDelayRange: [30, 120] as [number, number],
  recallChance: 0.02,
  typoChance: 0.03,
  memoryErrorChance: 0.05
}

// 回复节奏
export const REPLY_RHYTHM = {
  firstDelay: [0.5, 1.5] as [number, number],
  midDelay: [1, 4] as [number, number],
  lastDelay: [1, 6] as [number, number],
  emotionalMultiplier: 0.6,
  seriousMultiplier: 1.5
}

// 碎片化输出
export const SPLIT_CONFIG = {
  minChunkLength: 8,
  maxChunkLength: 50,
  mergeShort: true,
  preserveEmoji: true
}

// Provider 配置（统一定义，避免多处重复）
export interface ProviderConfig {
  name: string
  baseUrl: string
  defaultModel: string
  models: string[]
}

export const PROVIDERS: Record<string, ProviderConfig> = {
  deepseek: {
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
    models: ['deepseek-v4-flash', 'deepseek-v4-pro', 'deepseek-chat', 'deepseek-reasoner']
  },
  siliconflow: {
    name: '硅基流动 SiliconFlow',
    baseUrl: 'https://api.siliconflow.cn/v1',
    defaultModel: 'deepseek-ai/DeepSeek-V4-Flash',
    models: [
      'deepseek-ai/DeepSeek-V4-Flash', 'deepseek-ai/DeepSeek-V3.2', 'Pro/deepseek-ai/DeepSeek-V3.2',
      'deepseek-ai/DeepSeek-R1', 'Pro/deepseek-ai/DeepSeek-R1',
      'Qwen/Qwen3-8B', 'Qwen/Qwen3-14B', 'Qwen/Qwen3-32B', 'Qwen/Qwen3-30B-A3B',
      'Qwen/Qwen3.5-9B', 'Qwen/Qwen3.5-27B', 'Qwen/Qwen3.5-122B-A10B', 'Qwen/Qwen3.5-397B-A17B',
      'Qwen/Qwen2.5-7B-Instruct', 'Qwen/Qwen2.5-72B-Instruct',
      'THUDM/glm-4-9b-chat', '01-ai/Yi-1.5-9B-Chat-16K',
      'meta-llama/Meta-Llama-3.1-8B-Instruct', 'meta-llama/Meta-Llama-3.1-70B-Instruct'
    ]
  },
  mimo: {
    name: 'MiMo（小米）',
    baseUrl: 'https://api.xiaomimimo.com/v1',
    defaultModel: 'mimo-v2.5',
    models: ['mimo-v2.5-pro', 'mimo-v2.5']
  },
  zhipu: {
    name: '智谱AI（GLM）',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    defaultModel: 'glm-4.7',
    models: ['glm-5.2', 'glm-5.1', 'glm-5', 'glm-5-turbo', 'glm-4.7', 'glm-4.6', 'glm-4.5', 'glm-4.7-flash']
  },
  openai: {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'o1-preview', 'o1-mini']
  },
  ollama: {
    name: 'Ollama（本地部署）',
    baseUrl: 'http://localhost:11434/v1',
    defaultModel: 'qwen2.5',
    models: ['qwen2.5', 'llama3', 'mistral', 'codellama']
  }
}
