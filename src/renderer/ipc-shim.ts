// src/renderer/ipc-shim.ts
// IPC 模拟层 — 将 window.electronAPI 调用路由到前端 Service

import { CharacterService } from './services/CharacterService'
import { ChatService } from './services/ChatService'
import { AIService } from './services/AIService'
import { TTSService } from './services/TTSService'
import { StorageService } from './services/StorageService'

// IPC handler 映射表
const handlers: Record<string, (...args: unknown[]) => unknown> = {
  // Character
  'character:list': () => CharacterService.getAll(),
  'character:active': () => CharacterService.getActive(),
  'character:switch': (params: { characterId: string }) => {
    CharacterService.setActive(params.characterId)
    return { success: true }
  },
  'character:create': (params: {
    templateId?: string
    name: string
    avatar: string
    persona?: string
    traits?: string[]
    provider?: string
    model?: string
    apiKey?: string
    baseUrl?: string
    proactiveEnabled?: boolean
  }) => {
    return CharacterService.create({
      name: params.name,
      avatar: params.avatar,
      persona: params.persona,
      traits: params.traits,
      provider: params.provider,
      model: params.model,
      apiKey: params.apiKey,
      baseUrl: params.baseUrl
    })
  },
  'character:update': (params: { id: string; updates: Record<string, unknown> }) => {
    return CharacterService.update(params.id, params.updates)
  },
  'character:delete': (params: { id: string }) => {
    return CharacterService.delete(params.id)
  },

  // Chat
  'chat:loadMessages': (params: { characterId: string }) => {
    return { success: true, data: ChatService.loadMessages(params.characterId) }
  },
  'chat:saveMessages': (params: { characterId: string; messages: unknown[] }) => {
    ChatService.saveMessages(params.characterId, params.messages as never[])
    return { success: true }
  },
  'chat:deleteMessages': (params: { characterId: string }) => {
    ChatService.saveMessages(params.characterId, [])
    return { success: true }
  },
  'chat:send': async (params: {
    content: string
    characterId: string
    provider: string
    model: string
    apiKey?: string
    baseUrl?: string
    history: Array<{ role: string; content: string }>
    persona?: string
    userName?: string
    quoteContent?: string
  }) => {
    return AIService.chat({
      provider: params.provider,
      model: params.model,
      apiKey: params.apiKey,
      baseUrl: params.baseUrl,
      messages: params.history,
      persona: params.persona,
      userName: params.userName,
      quoteContent: params.quoteContent
    })
  },

  // TTS
  'tts:init': (params: { apiKey: string }) => {
    TTSService.init(params.apiKey)
    return { success: true }
  },
  'tts:get-state': () => {
    return { enabled: false, currentVoice: '茉莉', currentVoiceName: '茉莉' }
  },
  'tts:get-voices': () => TTSService.getPresetVoices(),
  'tts:get-models': () => TTSService.getAvailableModels(),
  'tts:synthesize': async (params: {
    text: string
    voiceId: string
    stylePrompt?: string
    modelType?: string
  }) => {
    const audio = await TTSService.synthesize(
      params.text,
      params.voiceId,
      params.stylePrompt,
      params.modelType as 'preset' | 'voicedesign' | 'voiceclone'
    )
    if (audio) return { success: true, audio }
    return { success: false, error: '合成失败' }
  },
  'tts:toggle': () => {},
  'tts:set-voice': () => {},
  'tts:get-cache-size': () => 0,
  'tts:clear-cache': () => {},

  // Settings
  'settings:get': () => StorageService.getSettings(),
  'settings:update': (params: Record<string, unknown>) => {
    const current = StorageService.getSettings()
    StorageService.saveSettings({ ...current, ...params })
    return { success: true }
  },

  // Plugins (stub)
  'plugin:get-installed': () => [],
  'plugin:install': () => ({ success: false, error: '移动端暂不支持插件' }),
  'plugin:enable': () => ({ success: false }),
  'plugin:disable': () => ({ success: false }),

  // Backup (stub)
  'backup:get-config': () => ({ maxBackups: 7, backupHour: 3, backupMinute: 0 }),
  'backup:list': () => [],
  'backup:get-status': () => ({ lastBackup: null }),
  'backup:now': () => ({ success: false, error: '移动端暂不支持备份' }),
  'backup:restore': () => ({ success: false, error: '移动端暂不支持恢复' }),
  'backup:set-config': () => ({ success: true }),
  'backup:check-integrity': () => ({ valid: true }),

  // Knowledge (stub)
  'knowledge:getPersona': () => '',
  'knowledge:setPersona': () => ({ success: true }),
  'knowledge:getAll': () => ({}),

  // Banned words (use localStorage)
  'bannedWords:list': () => {
    return StorageService.get('bannedWords', { words: [] })
  },
  'bannedWords:add': (params: { word: string }) => {
    const data = StorageService.get<{ words: string[] }>('bannedWords', { words: [] })
    if (!data.words.includes(params.word)) data.words.push(params.word)
    StorageService.set('bannedWords', data)
    return { success: true }
  },
  'bannedWords:remove': (params: { word: string }) => {
    const data = StorageService.get<{ words: string[] }>('bannedWords', { words: [] })
    data.words = data.words.filter(w => w !== params.word)
    StorageService.set('bannedWords', data)
    return { success: true }
  },

  // Data (stub)
  'data:export': () => ({ success: false, error: '移动端暂不支持导出' }),
  'data:chooseDir': () => ({ success: false }),
  'data:import': () => ({ success: false, error: '移动端暂不支持导入' })
}

// 事件监听器
const listeners: Record<string, Set<(...args: unknown[]) => void>> = {}

// 创建 shim
export function installIPCShim(): void {
  if (typeof window === 'undefined') return

  window.electronAPI = {
    invoke: async (channel: string, ...args: unknown[]) => {
      const handler = handlers[channel]
      if (handler) {
        return handler(...args)
      }
      console.warn(`[IPC Shim] 未处理的通道: ${channel}`)
      return null
    },

    send: (channel: string, ...args: unknown[]) => {
      // 触发监听器
      const channelListeners = listeners[channel]
      if (channelListeners) {
        channelListeners.forEach(fn => fn(...args))
      }
    },

    on: (channel: string, callback: (...args: unknown[]) => void) => {
      if (!listeners[channel]) listeners[channel] = new Set()
      listeners[channel].add(callback)
    },

    off: (channel: string, callback: (...args: unknown[]) => void) => {
      listeners[channel]?.delete(callback)
    },

    minimize: () => {},
    maximize: () => {},
    close: () => {}
  }

  console.log('[IPC Shim] 已安装')
}
