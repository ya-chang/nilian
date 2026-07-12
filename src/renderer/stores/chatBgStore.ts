// src/renderer/stores/chatBgStore.ts
// 聊天背景状态 — 设置面板和 ChatWindow 之间同步

import { create } from 'zustand'

interface ChatBgState {
  // key: characterId, value: background
  backgrounds: Record<string, string>
  getBg: (characterId: string) => string
  setBg: (characterId: string, bg: string) => void
}

export const useChatBgStore = create<ChatBgState>((set, get) => ({
  backgrounds: {},

  getBg: (characterId: string) => {
    return get().backgrounds[characterId] || '#FFFFFF'
  },

  setBg: (characterId: string, bg: string) => {
    // 保存到 localStorage
    localStorage.setItem(`chatBg-${characterId}`, bg)
    // 更新内存状态
    set((state) => ({
      backgrounds: { ...state.backgrounds, [characterId]: bg }
    }))
  }
}))
