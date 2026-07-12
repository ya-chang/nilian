// src/shared/constants.ts
// 全局常量

// 应用信息
export const APP_NAME = '微信AI恋人'
export const APP_VERSION = '0.1.0'

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
