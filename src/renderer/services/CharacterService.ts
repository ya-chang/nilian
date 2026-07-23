// src/renderer/services/CharacterService.ts
// 角色服务 — 替代 CharacterManager IPC

import { StorageService } from './StorageService'

export interface CharacterConfig {
  id: string
  name: string
  avatar: string
  persona: string
  traits: string[]
  catchphrase?: string
  provider: string
  model: string
  apiKey?: string
  baseUrl?: string
  temperature: number
  maxTokens: number
  proactiveEnabled: boolean
  ttsEnabled: boolean
  ttsVoice: string
  ttsVoiceName: string
  ttsModel?: 'preset' | 'voicedesign' | 'voiceclone'
  ttsVoiceDesignPrompt?: string
  createdAt: string
  updatedAt: string
}

let activeCharacterId: string | null = null

export const CharacterService = {
  getAll(): CharacterConfig[] {
    return StorageService.getCharacterList() as CharacterConfig[]
  },

  get(id: string): CharacterConfig | undefined {
    return this.getAll().find(c => c.id === id)
  },

  getActive(): CharacterConfig | undefined {
    if (!activeCharacterId) {
      const list = this.getAll()
      if (list.length > 0) activeCharacterId = list[0].id
    }
    return activeCharacterId ? this.get(activeCharacterId) : undefined
  },

  getActiveId(): string | null {
    return activeCharacterId
  },

  setActive(id: string): void {
    activeCharacterId = id
  },

  create(params: {
    name: string
    avatar: string
    persona?: string
    traits?: string[]
    provider?: string
    model?: string
    apiKey?: string
    baseUrl?: string
    ttsEnabled?: boolean
    ttsVoice?: string
    ttsVoiceName?: string
    ttsModel?: 'preset' | 'voicedesign' | 'voiceclone'
  }): CharacterConfig {
    const id = `char_${Date.now()}`
    const now = new Date().toISOString()
    const character: CharacterConfig = {
      id,
      name: params.name,
      avatar: params.avatar,
      persona: params.persona ?? '',
      traits: params.traits ?? [],
      provider: params.provider ?? 'deepseek',
      model: params.model ?? 'deepseek-chat',
      apiKey: params.apiKey,
      baseUrl: params.baseUrl,
      temperature: 0.85,
      maxTokens: 1024,
      proactiveEnabled: true,
      ttsEnabled: params.ttsEnabled ?? false,
      ttsVoice: params.ttsVoice ?? '茉莉',
      ttsVoiceName: params.ttsVoiceName ?? '茉莉',
      ttsModel: params.ttsModel ?? 'preset',
      createdAt: now,
      updatedAt: now
    }
    const list = this.getAll()
    list.push(character)
    StorageService.saveCharacterList(list)
    return character
  },

  update(id: string, updates: Partial<CharacterConfig>): CharacterConfig | null {
    const list = this.getAll()
    const idx = list.findIndex(c => c.id === id)
    if (idx === -1) return null
    list[idx] = { ...list[idx], ...updates, updatedAt: new Date().toISOString() }
    StorageService.saveCharacterList(list)
    return list[idx]
  },

  delete(id: string): boolean {
    const list = this.getAll()
    const filtered = list.filter(c => c.id !== id)
    if (filtered.length === list.length) return false
    StorageService.saveCharacterList(filtered)
    StorageService.remove(`messages_${id}`)
    if (activeCharacterId === id) activeCharacterId = null
    return true
  }
}
