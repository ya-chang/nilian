// src/renderer/stores/chatSessionStore.ts
// 聊天会话状态 — 管理当前选中的聊天（持久化到 localStorage）

import { create } from 'zustand'

const STORAGE_KEY = 'wechat-ai-active-session'

export interface ChatSession {
  id: string
  name: string
  avatar: string
  online: boolean
  userAvatar?: string
}

interface ChatSessionState {
  currentSession: ChatSession | null
  setCurrentSession: (session: ChatSession | null) => void
}

// 从 localStorage 恢复
const loadSession = (): ChatSession | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // ignore
  }
  return null
}

export const useChatSessionStore = create<ChatSessionState>((set) => ({
  currentSession: loadSession(),
  setCurrentSession: (session) => {
    // 持久化到 localStorage
    if (session) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
    set({ currentSession: session })
  }
}))
