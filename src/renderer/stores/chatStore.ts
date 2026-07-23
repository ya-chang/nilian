// src/renderer/stores/chatStore.ts
// 聊天状态管理 — 按角色隔离消息 + localStorage 持久化

import { create } from 'zustand'
import { ChatService, type Message } from '../services/ChatService'

export type { Message }

type AddMessageInput = Omit<Message, 'id' | 'timestamp' | 'status' | 'characterId'> & {
  type?: Message['type']
  metadata?: Record<string, unknown>
}

// 延迟保存 — 避免每条消息都写 storage
let saveTimer: ReturnType<typeof setTimeout> | null = null
let pendingSave: { characterId: string; messages: Message[] } | null = null

const debouncedSave = (characterId: string, messages: Message[]): void => {
  pendingSave = { characterId, messages }
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    if (pendingSave) {
      ChatService.saveMessages(pendingSave.characterId, pendingSave.messages)
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
  loadCharacterMessages: (characterId: string) => void
  addMessage: (msg: AddMessageInput) => string
  updateMessage: (id: string, updates: Partial<Message>, targetCharacterId?: string) => void
  setLoading: (loading: boolean) => void
  clearMessages: () => void
  clearCharacterMessages: (characterId: string) => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  messagesByCharacter: {},
  messages: [],
  currentCharacterId: null,
  isLoading: false,

  setCurrentCharacter: (characterId: string) => {
    const state = get()
    if (state.messagesByCharacter[characterId]) {
      set({ currentCharacterId: characterId, messages: state.messagesByCharacter[characterId] })
      return
    }
    set({ currentCharacterId: characterId, messages: [] })
    get().loadCharacterMessages(characterId)
  },

  loadCharacterMessages: (characterId: string) => {
    const data = ChatService.loadMessages(characterId) as Message[]
    set((state) => ({
      messagesByCharacter: { ...state.messagesByCharacter, [characterId]: data },
      messages: state.currentCharacterId === characterId ? data : state.messages
    }))
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

    debouncedSave(characterId, updatedMessages)
    return id
  },

  updateMessage: (id, updates, targetCharacterId?) => {
    const state = get()
    const characterId = targetCharacterId || state.currentCharacterId || 'default'

    const characterMessages = state.messagesByCharacter[characterId] || []
    const updatedMessages = characterMessages.map((m) =>
      m.id === id ? { ...m, ...updates } : m
    )
    const newData = {
      ...state.messagesByCharacter,
      [characterId]: updatedMessages
    }

    const shouldUpdateMessages = characterId === state.currentCharacterId

    set({
      messagesByCharacter: newData,
      ...(shouldUpdateMessages ? { messages: updatedMessages } : {})
    })

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

    ChatService.saveMessages(characterId, [])
  }
}))
