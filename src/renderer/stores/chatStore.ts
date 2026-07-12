// src/renderer/stores/chatStore.ts
// 聊天状态管理 — 按角色隔离消息 + 文件系统持久化

import { create } from 'zustand'

export interface Message {
  id: string
  characterId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  type: 'text' | 'pat' | 'red_packet' | 'emoji'
  timestamp: number
  status: 'sending' | 'sent' | 'error'
  error?: string
  metadata?: Record<string, unknown>
}

type AddMessageInput = Omit<Message, 'id' | 'timestamp' | 'status' | 'characterId'> & {
  type?: Message['type']
  metadata?: Record<string, unknown>
}

// 延迟保存 — 避免每条消息都写文件
let saveTimer: ReturnType<typeof setTimeout> | null = null
let pendingSave: { characterId: string; messages: Message[] } | null = null

const debouncedSave = (characterId: string, messages: Message[]): void => {
  pendingSave = { characterId, messages }
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    if (pendingSave) {
      window.electronAPI?.invoke('chat:saveMessages', {
        characterId: pendingSave.characterId,
        messages: pendingSave.messages
      })
      pendingSave = null
    }
  }, 500)
}

interface ChatState {
  messagesByCharacter: Record<string, Message[]>
  messages: Message[]
  currentCharacterId: string | null
  isLoading: boolean

  setCurrentCharacter: (characterId: string) => void
  loadCharacterMessages: (characterId: string) => Promise<void>
  addMessage: (msg: AddMessageInput) => string
  updateMessage: (id: string, updates: Partial<Message>) => void
  setLoading: (loading: boolean) => void
  clearMessages: () => void
  clearCharacterMessages: (characterId: string) => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  messagesByCharacter: {},
  messages: [],
  currentCharacterId: null,
  isLoading: false,

  // 切换角色 — 从文件加载该角色的消息
  setCurrentCharacter: (characterId: string) => {
    const state = get()
    // 如果已有缓存，直接切换
    if (state.messagesByCharacter[characterId]) {
      set({ currentCharacterId: characterId, messages: state.messagesByCharacter[characterId] })
      return
    }
    // 否则异步加载
    set({ currentCharacterId: characterId, messages: [] })
    get().loadCharacterMessages(characterId)
  },

  // 从文件系统加载消息
  loadCharacterMessages: async (characterId: string) => {
    try {
      const result = await window.electronAPI?.invoke('chat:loadMessages', { characterId }) as {
        success: boolean
        data?: Message[]
      }
      if (result?.success && result.data) {
        set((state) => ({
          messagesByCharacter: { ...state.messagesByCharacter, [characterId]: result.data! },
          messages: state.currentCharacterId === characterId ? result.data! : state.messages
        }))
      }
    } catch {
      // 加载失败，使用空消息
    }
  },

  addMessage: (msg) => {
    const state = get()
    const characterId = state.currentCharacterId || 'default'

    const id = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    const message: Message = {
      ...msg,
      id,
      characterId,
      timestamp: Date.now(),
      status: 'sending'
    }

    const characterMessages = state.messagesByCharacter[characterId] || []
    const updatedMessages = [...characterMessages, message]
    const newData = {
      ...state.messagesByCharacter,
      [characterId]: updatedMessages
    }

    set({
      messagesByCharacter: newData,
      messages: updatedMessages
    })

    // 延迟保存到文件
    debouncedSave(characterId, updatedMessages)

    return id
  },

  updateMessage: (id, updates) => {
    const state = get()
    const characterId = state.currentCharacterId || 'default'

    const characterMessages = state.messagesByCharacter[characterId] || []
    const updatedMessages = characterMessages.map((m) =>
      m.id === id ? { ...m, ...updates } : m
    )
    const newData = {
      ...state.messagesByCharacter,
      [characterId]: updatedMessages
    }

    set({
      messagesByCharacter: newData,
      messages: updatedMessages
    })

    // 延迟保存到文件
    debouncedSave(characterId, updatedMessages)
  },

  setLoading: (loading) => set({ isLoading: loading }),

  clearMessages: () => {
    const state = get()
    const characterId = state.currentCharacterId || 'default'
    const newData = {
      ...state.messagesByCharacter,
      [characterId]: []
    }

    set({
      messagesByCharacter: newData,
      messages: []
    })

    debouncedSave(characterId, [])
  },

  clearCharacterMessages: (characterId: string) => {
    const state = get()
    const newData = { ...state.messagesByCharacter }
    delete newData[characterId]

    set({
      messagesByCharacter: newData,
      messages: state.currentCharacterId === characterId ? [] : state.messages
    })

    // 删除文件
    window.electronAPI?.invoke('chat:deleteMessages', { characterId })
  }
}))
