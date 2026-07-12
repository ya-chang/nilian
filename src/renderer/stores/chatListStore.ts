// src/renderer/stores/chatListStore.ts
// 聊天列表状态 — 防止组件重挂载时数据重置 + 实时更新 lastMessage + 头像变更通知

import { create } from 'zustand'

export interface Session {
  id: string
  name: string
  avatar: string
  lastMessage: string
  time: string
  unread: number
  online: boolean
  pinned: boolean
  avatarVersion: number
}

interface ChatListState {
  sessions: Session[]
  addSession: (session: Session) => void
  markRead: (id: string) => void
  updateLastMessage: (id: string, message: string) => void
  addUnread: (id: string) => void
  getTotalUnread: () => number
  bumpAvatarVersion: (id: string) => void
}

export const useChatListStore = create<ChatListState>((set, get) => ({
  sessions: [],

  addSession: (session: Session) => {
    const exists = get().sessions.some((s) => s.id === session.id)
    if (!exists) {
      set((state) => ({
        sessions: [{ ...session, avatarVersion: 0 }, ...state.sessions]
      }))
    }
  },

  markRead: (id: string) => {
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === id ? { ...s, unread: 0 } : s
      )
    }))
  },

  updateLastMessage: (id: string, message: string) => {
    const now = new Date()
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === id ? { ...s, lastMessage: message, time } : s
      )
    }))
  },

  addUnread: (id: string) => {
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === id ? { ...s, unread: s.unread + 1 } : s
      )
    }))
  },

  getTotalUnread: () => {
    return get().sessions.reduce((sum, s) => sum + s.unread, 0)
  },

  bumpAvatarVersion: (id: string) => {
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === id ? { ...s, avatarVersion: (s.avatarVersion || 0) + 1 } : s
      )
    }))
  }
}))
