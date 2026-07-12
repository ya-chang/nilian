// src/shared/types.ts
// 前后端共享的类型定义，只放数据结构，不放业务逻辑

export interface Message {
  id: string
  characterId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  type: 'text' | 'voice' | 'image' | 'emoji' | 'pat' | 'red_packet'
  emotion?: string
  quoteId?: string
  metadata?: Record<string, unknown>
  createdAt: string
}

// 引用消息的元数据
export interface QuoteMeta {
  quotedMessageId: string
  quotedContent: string
  quotedRole: 'user' | 'assistant'
}

// 拍一拍的元数据
export interface PatMeta {
  from: string
  to: string
  suffix: string
}

// 红包的元数据
export interface RedPacketMeta {
  amount: number
  message: string
  opened: boolean
}

export interface Character {
  id: string
  name: string
  avatar: string
  persona: string
  traits: string[]
  createdAt: string
  updatedAt: string
}

export interface ChatSession {
  id: string
  characterId: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  pinned: boolean
}

export interface UserProfile {
  name: string
  age?: number
  avatar: string
}

export interface EmotionState {
  characterId: string
  happiness: number
  sadness: number
  anger: number
  anxiety: number
  affection: number
  intimacy: number
  trust: number
  energy: number
  missLevel: number
  patience: number
  currentMood: string
  lastInteraction: string
  conversationStreak: number
}

export interface AppSettings {
  theme: 'default' | 'dark' | 'pink'
  fontSize: number
  windowWidth: number
  windowHeight: number
}

export interface ModelConfig {
  provider: string
  model: string
  apiKey: string
  baseUrl: string
  temperature: number
  maxTokens: number
  supportsCache: boolean
}
