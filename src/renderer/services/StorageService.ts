// src/renderer/services/StorageService.ts
// 本地存储服务 — 替代 Electron 的文件系统操作

const PREFIX = 'nilian_'

export const StorageService = {
  get<T>(key: string, defaultValue: T): T {
    try {
      const raw = localStorage.getItem(PREFIX + key)
      return raw ? JSON.parse(raw) : defaultValue
    } catch {
      return defaultValue
    }
  },

  set(key: string, value: unknown): void {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  },

  remove(key: string): void {
    localStorage.removeItem(PREFIX + key)
  },

  getCharacterList(): Array<Record<string, unknown>> {
    return this.get('characters', [])
  },

  saveCharacterList(chars: Array<Record<string, unknown>>): void {
    this.set('characters', chars)
  },

  getMessages(characterId: string): Array<Record<string, unknown>> {
    return this.get(`messages_${characterId}`, [])
  },

  saveMessages(characterId: string, messages: Array<Record<string, unknown>>): void {
    this.set(`messages_${characterId}`, messages)
  },

  getSettings(): Record<string, unknown> {
    return this.get('settings', {})
  },

  saveSettings(settings: Record<string, unknown>): void {
    this.set('settings', settings)
  }
}
