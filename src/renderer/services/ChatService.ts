// src/renderer/services/ChatService.ts
// 聊天服务 — 替代 chat IPC

import { StorageService } from './StorageService'

export interface Message {
  id: string
  characterId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  type?: string
  timestamp: number
  status?: 'sending' | 'sent' | 'error'
  metadata?: Record<string, unknown>
}

export const ChatService = {
  loadMessages(characterId: string): Message[] {
    return StorageService.getMessages(characterId) as Message[]
  },

  saveMessages(characterId: string, messages: Message[]): void {
    StorageService.saveMessages(characterId, messages)
  },

  addMessage(characterId: string, message: Message): void {
    const messages = this.loadMessages(characterId)
    messages.push(message)
    this.saveMessages(characterId, messages)
  },

  updateMessage(characterId: string, messageId: string, updates: Partial<Message>): void {
    const messages = this.loadMessages(characterId)
    const idx = messages.findIndex(m => m.id === messageId)
    if (idx !== -1) {
      messages[idx] = { ...messages[idx], ...updates }
      this.saveMessages(characterId, messages)
    }
  },

  deleteMessages(characterId: string, messageIds: string[]): void {
    const messages = this.loadMessages(characterId)
    const filtered = messages.filter(m => !messageIds.includes(m.id))
    this.saveMessages(characterId, filtered)
  }
}
