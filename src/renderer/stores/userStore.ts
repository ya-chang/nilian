// src/renderer/stores/userStore.ts
// 用户状态 — 头像 + 名字持久化到 localStorage

import { create } from 'zustand'

interface UserState {
  avatar: string
  name: string
  setAvatar: (avatar: string) => void
  setName: (name: string) => void
  loadAvatar: () => void
  loadAll: () => void
}

const AVATAR_KEY = 'user-avatar'
const NAME_KEY = 'user-name'

const loadAvatar = (): string => {
  try {
    return localStorage.getItem(AVATAR_KEY) || '👤'
  } catch {
    return '👤'
  }
}

const loadName = (): string => {
  try {
    return localStorage.getItem(NAME_KEY) || ''
  } catch {
    return ''
  }
}

export const useUserStore = create<UserState>((set) => ({
  avatar: loadAvatar(),
  name: loadName(),

  setAvatar: (avatar) => {
    set({ avatar })
    try {
      localStorage.setItem(AVATAR_KEY, avatar)
    } catch { /* ignore */ }
  },

  setName: (name) => {
    set({ name })
    try {
      localStorage.setItem(NAME_KEY, name)
    } catch { /* ignore */ }
  },

  loadAvatar: () => {
    set({ avatar: loadAvatar() })
  },

  loadAll: () => {
    set({ avatar: loadAvatar(), name: loadName() })
  }
}))
