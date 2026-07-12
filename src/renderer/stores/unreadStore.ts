// src/renderer/stores/unreadStore.ts
// 未读数状态 — 全局管理未读消息数

import { create } from 'zustand'

interface UnreadState {
  totalUnread: number
  setTotalUnread: (count: number) => void
}

export const useUnreadStore = create<UnreadState>((set) => ({
  totalUnread: 0,
  setTotalUnread: (count) => set({ totalUnread: count })
}))
