// src/main/plugins/PluginAPI.ts
// 插件API — 暴露给插件的能力入口

import { BrowserWindow, dialog } from 'electron'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { PluginEventBus } from './PluginEventBus'
import { PluginDataShare } from './PluginDataShare'
import { pluginPromptStore } from './PluginPromptStore'
import { logger } from '../utils/logger'

export interface PluginAPI {
  currentPluginId: string
  chat: ChatAPI
  ai: AiAPI
  ui: UiAPI
  data: DataAPI
  file: FileAPI
  net: NetAPI
  events: PluginEventBus
  share: DataShareAPI
  actions: ActionsAPI
  config: ConfigAPI
  sensor: SensorAPI
  setCurrentPlugin(id: string): void
}

interface ActionsAPI {
  register(name: string, handler: (...args: unknown[]) => unknown): void
  unregister(name: string): void
  execute(name: string, ...args: unknown[]): unknown
}

interface DataShareAPI {
  publish(key: string, value: unknown): void
  read(producerPluginId: string, key: string): unknown
  subscribe(key: string, callback: (value: unknown) => void): void
  unsubscribe(key: string): void
  listByPlugin(pluginId: string): Array<{ key: string; value: unknown; timestamp: number }>
  listAllKeys(): Array<{ pluginId: string; key: string; timestamp: number }>
}

// ─── 子API类型 ───

interface ChatAPI {
  sendMessage(characterId: string, message: { content: string; type?: string; metadata?: Record<string, unknown> }): void
  onMessage(callback: (characterId: string, message: { sender: string; content: string; type: string }) => void): void
  getHistory(characterId: string, options?: { limit?: number; before?: string }): Promise<Array<Record<string, unknown>>>
  sendCustomMessage(characterId: string, data: { type: string; data: Record<string, unknown> }): void
  removeMessageListener(callback: Function): void
}

interface AiAPI {
  addPromptSection(characterId: string, section: string): void
  addGlobalPromptSection(section: string): void
  addBehavior(characterId: string, behavior: { name: string; trigger: string; action: (context: unknown) => Promise<string> }): void
  onBeforeReply(callback: (characterId: string, response: string) => string): void
  removeBeforeReplyListener(callback: Function): void
}

interface UiAPI {
  addNavItem(item: { id: string; icon: string; label: string; render: (container: HTMLElement) => void }): void
  registerMessageType(type: { type: string; render: (message: Record<string, unknown>, container: HTMLElement) => void }): void
  injectCSS(css: string): void
  injectHTML(html: string): void
  setTheme(css: string): void
  toast(message: string): void
  modal(options: { title: string; content: string; buttons: string[] }): Promise<number>
  openPluginSettings(pluginId: string): void
}

interface DataAPI {
  getCharacter(characterId: string): Promise<Record<string, unknown> | null>
  getMemory(characterId: string, key: string): Promise<unknown>
  setMemory(characterId: string, key: string, value: unknown): Promise<void>
  getEmotion(characterId: string): Promise<Record<string, unknown> | null>
  getLearningData(characterId: string): Promise<Record<string, unknown> | null>
  pluginSet(pluginId: string, key: string, value: unknown, characterId?: string): void
  pluginGet(pluginId: string, key: string, characterId?: string): unknown
}

interface FileAPI {
  read(path: string): string
  write(path: string, content: string): void
  exists(path: string): boolean
}

interface NetAPI {
  fetch(url: string, options?: RequestInit): Promise<Response>
}

interface ConfigAPI {
  get(): Record<string, unknown>
  getKey(key: string): unknown
}

interface SensorAPI {
  pushEvent(event: { type: string; data: Record<string, unknown>; visible?: boolean }): void
  registerEventType(type: { type: string; label: string; icon: string }): void
}

// ─── 实现 ───

export class PluginAPIFactory {
  static create(
    mainWindow: BrowserWindow,
    dataDir: string,
    getManager: () => { setCurrentPlugin(id: string): void },
    eventBus: PluginEventBus,
    dataShare: PluginDataShare
  ): PluginAPI {
    const pluginDir = join(dataDir, 'plugins')
    const pluginDataDir = join(pluginDir, 'plugin-data')

    // 插件消息监听器
    const messageListeners: Array<{ pluginId: string; callback: Function }> = []
    const beforeReplyListeners: Array<{ pluginId: string; callback: Function }> = []
    const navItems: Array<{ pluginId: string; item: { id: string; icon: string; label: string; render: (container: HTMLElement) => void } }> = []
    const messageTypes: Array<{ pluginId: string; type: { type: string; render: (message: Record<string, unknown>, container: HTMLElement) => void } }> = []
    const injectedCSS: Array<{ pluginId: string; css: string }> = []
    const promptSections: Array<{ pluginId: string; characterId: string; section: string }> = []
    const globalPromptSections: Array<{ pluginId: string; section: string }> = []
    const behaviors: Array<{ pluginId: string; characterId: string; behavior: { name: string; trigger: string; action: (context: unknown) => Promise<string> } }> = []
    const sensorEvents: Array<{ type: string; label: string; icon: string }> = []
    const actions = new Map<string, { pluginId: string; handler: (...args: unknown[]) => unknown }>()

    let currentPluginId = ''

    const api: PluginAPI = {
      currentPluginId: '',

      setCurrentPlugin(id: string) {
        currentPluginId = id
        api.currentPluginId = id
      },

      // ─── 聊天 ───
      chat: {
        sendMessage(characterId: string, message: { content: string; type?: string; metadata?: Record<string, unknown> }) {
          mainWindow.webContents.send('plugin:chat-send', {
            pluginId: currentPluginId,
            characterId,
            message
          })
        },

        onMessage(callback: (characterId: string, message: { sender: string; content: string; type: string }) => void) {
          messageListeners.push({ pluginId: currentPluginId, callback })
        },

        removeMessageListener(callback: Function) {
          const idx = messageListeners.findIndex(l => l.callback === callback)
          if (idx >= 0) messageListeners.splice(idx, 1)
        },

        async getHistory(characterId: string, options?: { limit?: number; before?: string }) {
          // 从文件系统读取消息（不经过 renderer）
          const messagesDir = join(dataDir, 'messages')
          const filePath = join(messagesDir, `${characterId}.json`)
          if (!existsSync(filePath)) return []
          try {
            const allMessages = JSON.parse(readFileSync(filePath, 'utf-8')) as Array<Record<string, unknown>>
            let messages = allMessages
            if (options?.before) {
              const idx = messages.findIndex(m => m.id === options.before)
              if (idx > 0) messages = messages.slice(0, idx)
            }
            if (options?.limit) messages = messages.slice(-options.limit)
            return messages
          } catch {
            return []
          }
        },

        sendCustomMessage(characterId: string, data: { type: string; data: Record<string, unknown> }) {
          mainWindow.webContents.send('plugin:custom-message', {
            pluginId: currentPluginId,
            characterId,
            ...data
          })
        }
      },

      // ─── AI ───
      ai: {
        addPromptSection(characterId: string, section: string) {
          pluginPromptStore.addCharacter(currentPluginId, characterId, section)
          logger.debug(`[插件] 添加Prompt: ${currentPluginId} → ${characterId}`)
        },

        addGlobalPromptSection(section: string) {
          pluginPromptStore.addGlobal(currentPluginId, section)
          logger.debug(`[插件] 添加全局Prompt: ${currentPluginId}`)
        },

        addBehavior(characterId: string, behavior: { name: string; trigger: string; action: (context: unknown) => Promise<string> }) {
          behaviors.push({ pluginId: currentPluginId, characterId, behavior })
          logger.debug(`[插件] 添加行为: ${behavior.name} → ${characterId}`)
        },

        onBeforeReply(callback: (characterId: string, response: string) => string) {
          beforeReplyListeners.push({ pluginId: currentPluginId, callback })
        },

        removeBeforeReplyListener(callback: Function) {
          const idx = beforeReplyListeners.findIndex(l => l.callback === callback)
          if (idx >= 0) beforeReplyListeners.splice(idx, 1)
        }
      },

      // ─── UI ───
      ui: {
        addNavItem(item: { id: string; icon: string; label: string; render: (container: HTMLElement) => void }) {
          navItems.push({ pluginId: currentPluginId, item })
          mainWindow.webContents.send('plugin:add-nav', {
            pluginId: currentPluginId,
            item: { id: item.id, icon: item.icon, label: item.label }
          })
        },

        registerMessageType(type: { type: string; render: (message: Record<string, unknown>, container: HTMLElement) => void }) {
          messageTypes.push({ pluginId: currentPluginId, type })
        },

        injectCSS(css: string) {
          // 移除该插件之前注入的CSS
          const idx = injectedCSS.findIndex(c => c.pluginId === currentPluginId)
          if (idx >= 0) injectedCSS.splice(idx, 1)

          if (css) {
            injectedCSS.push({ pluginId: currentPluginId, css })
          }

          // 合并所有插件的CSS
          const allCSS = injectedCSS.map(c => c.css).join('\n')
          mainWindow.webContents.send('plugin:inject-css', allCSS)
        },

        injectHTML(html: string) {
          mainWindow.webContents.send('plugin:inject-html', {
            pluginId: currentPluginId,
            html
          })
        },

        setTheme(css: string) {
          api.ui.injectCSS(css)
        },

        toast(message: string) {
          mainWindow.webContents.send('plugin:toast', {
            pluginId: currentPluginId,
            message
          })
        },

        async modal(options: { title: string; content: string; buttons: string[] }): Promise<number> {
          const result = await dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: options.title,
            message: options.content,
            buttons: options.buttons,
            defaultId: 0,
            cancelId: options.buttons.length - 1
          })
          return result.response
        },

        openPluginSettings(pluginId: string) {
          mainWindow.webContents.send('plugin:open-settings', { pluginId })
        }
      },

      // ─── 数据 ───
      data: {
        async getCharacter(characterId: string) {
          const charDir = join(dataDir, 'characters', characterId)
          const configPath = join(charDir, 'config.yaml')
          if (!existsSync(configPath)) return null
          try {
            const { parse: yamlParse } = require('yaml') as typeof import('yaml')
            return yamlParse(readFileSync(configPath, 'utf-8'))
          } catch {
            return null
          }
        },

        async getMemory(characterId: string, key: string) {
          const memoryDir = join(dataDir, 'memories', characterId)
          const filePath = join(memoryDir, `${key}.json`)
          if (!existsSync(filePath)) return null
          try {
            return JSON.parse(readFileSync(filePath, 'utf-8'))
          } catch {
            return null
          }
        },

        async setMemory(characterId: string, key: string, value: unknown) {
          const memoryDir = join(dataDir, 'memories', characterId)
          if (!existsSync(memoryDir)) mkdirSync(memoryDir, { recursive: true })
          const filePath = join(memoryDir, `${key}.json`)
          writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf-8')
        },

        async getEmotion(characterId: string) {
          const emotionPath = join(dataDir, 'emotions', `${characterId}.json`)
          if (!existsSync(emotionPath)) return null
          try {
            return JSON.parse(readFileSync(emotionPath, 'utf-8'))
          } catch {
            return null
          }
        },

        async getLearningData(characterId: string) {
          const learningDir = join(dataDir, 'characters', characterId, 'learning')
          if (!existsSync(learningDir)) return null
          try {
            const { readdirSync } = require('fs') as typeof import('fs')
            const files = readdirSync(learningDir).filter((f: string) => f.endsWith('.json'))
            const result: Record<string, unknown> = {}
            for (const file of files) {
              const content = readFileSync(join(learningDir, file), 'utf-8')
              result[file.replace('.json', '')] = JSON.parse(content)
            }
            return result
          } catch {
            return null
          }
        },

        pluginSet(pluginId: string, key: string, value: unknown, characterId?: string) {
          // scope-aware 数据路径：
          // global 插件: plugin-data/{pluginId}/{key}.json
          // character 插件 + characterId: plugin-data/{pluginId}/character/{characterId}/{key}.json
          // character 插件 + 无 characterId: plugin-data/{pluginId}/global/{key}.json
          let dir: string
          if (characterId) {
            dir = join(pluginDataDir, pluginId, 'character', characterId)
          } else {
            dir = join(pluginDataDir, pluginId)
          }
          if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
          const filePath = join(dir, `${key}.json`)
          writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf-8')
        },

        pluginGet(pluginId: string, key: string, characterId?: string): unknown {
          let filePath: string
          if (characterId) {
            filePath = join(pluginDataDir, pluginId, 'character', characterId, `${key}.json`)
          } else {
            filePath = join(pluginDataDir, pluginId, `${key}.json`)
          }
          if (!existsSync(filePath)) return null
          try {
            return JSON.parse(readFileSync(filePath, 'utf-8'))
          } catch {
            return null
          }
        }
      },

      // ─── 文件 ───
      file: {
        read(path: string): string {
          if (!existsSync(path)) return ''
          return readFileSync(path, 'utf-8')
        },

        write(path: string, content: string) {
          const dir = join(path, '..')
          if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
          writeFileSync(path, content, 'utf-8')
        },

        exists(path: string): boolean {
          return existsSync(path)
        }
      },

      // ─── 网络 ───
      net: {
        async fetch(url: string, options?: RequestInit) {
          return fetch(url, options)
        }
      },

      // ─── 事件（优先级事件总线） ───
      events: eventBus,

      // ─── 数据共享 ───
      share: {
        publish(key: string, value: unknown) {
          dataShare.publish(currentPluginId, key, value)
        },
        read(producerPluginId: string, key: string) {
          return dataShare.read(producerPluginId, key)
        },
        subscribe(key: string, callback: (value: unknown) => void) {
          dataShare.subscribe(currentPluginId, key, callback)
        },
        unsubscribe(key: string) {
          dataShare.unsubscribe(currentPluginId, key)
        },
        listByPlugin(pluginId: string) {
          return dataShare.listByPlugin(pluginId)
        },
        listAllKeys() {
          return dataShare.listAllKeys()
        }
      },

      // ─── 动作注册 ───
      actions: {
        register(name: string, handler: (...args: unknown[]) => unknown) {
          actions.set(`${currentPluginId}:${name}`, { pluginId: currentPluginId, handler })
          logger.debug(`[插件] 注册动作: ${currentPluginId}:${name}`)
        },
        unregister(name: string) {
          actions.delete(`${currentPluginId}:${name}`)
        },
        execute(name: string, ...args: unknown[]) {
          // 先找当前插件的，再找全局的
          const entry = actions.get(`${currentPluginId}:${name}`) || actions.get(`global:${name}`)
          if (!entry) {
            logger.warn(`[插件] 动作不存在: ${name}`)
            return null
          }
          try {
            return entry.handler(...args)
          } catch (err) {
            logger.error(`[插件] 动作执行失败: ${name}`, err)
            return null
          }
        }
      },

      // ─── 配置 ───
      config: {
        get(): Record<string, unknown> {
          const configPath = join(pluginDataDir, currentPluginId, 'config.json')
          if (!existsSync(configPath)) return {}
          try {
            return JSON.parse(readFileSync(configPath, 'utf-8'))
          } catch {
            return {}
          }
        },

        getKey(key: string): unknown {
          const config = api.config.get()
          return config[key]
        }
      },

      // ─── 感知 ───
      sensor: {
        pushEvent(event: { type: string; data: Record<string, unknown>; visible?: boolean }) {
          mainWindow.webContents.send('plugin:sensor-event', {
            pluginId: currentPluginId,
            ...event,
            timestamp: Date.now()
          })
        },

        registerEventType(type: { type: string; label: string; icon: string }) {
          sensorEvents.push(type)
          mainWindow.webContents.send('plugin:sensor-register', type)
        }
      }
    }

    return api
  }
}

// ─── 导出便捷构造函数 ───

export function createPluginAPI(
  mainWindow: BrowserWindow,
  dataDir: string,
  getManager: () => { setCurrentPlugin(id: string): void },
  eventBus: PluginEventBus,
  dataShare: PluginDataShare
): PluginAPI {
  return PluginAPIFactory.create(mainWindow, dataDir, getManager, eventBus, dataShare)
}
