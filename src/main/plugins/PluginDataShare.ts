// src/main/plugins/PluginDataShare.ts
// 插件间数据共享 — 插件可以发布/订阅数据，其他插件可以读取

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { logger } from '../utils/logger'

interface SharedDataEntry {
  pluginId: string
  key: string
  value: unknown
  timestamp: number
}

interface DataSubscription {
  pluginId: string
  key: string
  callback: (value: unknown) => void
}

export class PluginDataShare {
  private dataDir: string
  private subscriptions: Map<string, DataSubscription[]> = new Map()
  private cache: Map<string, SharedDataEntry> = new Map()

  constructor(dataDir: string) {
    this.dataDir = join(dataDir, 'plugins', 'shared-data')
    if (!existsSync(this.dataDir)) {
      mkdirSync(this.dataDir, { recursive: true })
    }
  }

  /**
   * 发布数据（其他插件可以读取）
   */
  publish(pluginId: string, key: string, value: unknown): void {
    const entry: SharedDataEntry = {
      pluginId,
      key,
      value,
      timestamp: Date.now()
    }

    // 写入缓存
    this.cache.set(this.getCacheKey(pluginId, key), entry)

    // 持久化到文件
    const filePath = this.getFilePath(pluginId, key)
    const dir = join(this.dataDir, pluginId)
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    writeFileSync(filePath, JSON.stringify(entry, null, 2), 'utf-8')

    // 通知订阅者
    const subscriptions = this.subscriptions.get(key) || []
    for (const sub of subscriptions) {
      if (sub.pluginId !== pluginId) {
        try {
          sub.callback(value)
        } catch (err) {
          logger.error(`[数据共享] 订阅者 ${sub.pluginId} 回调失败: ${key}`, err)
        }
      }
    }

    logger.debug(`[数据共享] ${pluginId} 发布: ${key}`)
  }

  /**
   * 读取其他插件发布的数据
   */
  read(producerPluginId: string, key: string): unknown {
    // 先查缓存
    const cacheKey = this.getCacheKey(producerPluginId, key)
    const cached = this.cache.get(cacheKey)
    if (cached) return cached.value

    // 再查文件
    const filePath = this.getFilePath(producerPluginId, key)
    if (!existsSync(filePath)) return null
    try {
      const entry: SharedDataEntry = JSON.parse(readFileSync(filePath, 'utf-8'))
      this.cache.set(cacheKey, entry)
      return entry.value
    } catch {
      return null
    }
  }

  /**
   * 订阅数据变化（当其他插件发布同一 key 时触发）
   */
  subscribe(subscriberPluginId: string, key: string, callback: (value: unknown) => void): void {
    if (!this.subscriptions.has(key)) {
      this.subscriptions.set(key, [])
    }
    this.subscriptions.get(key)!.push({
      pluginId: subscriberPluginId,
      key,
      callback
    })
    logger.debug(`[数据共享] ${subscriberPluginId} 订阅: ${key}`)
  }

  /**
   * 取消订阅
   */
  unsubscribe(subscriberPluginId: string, key: string): void {
    const subs = this.subscriptions.get(key)
    if (subs) {
      this.subscriptions.set(key, subs.filter(s => s.pluginId !== subscriberPluginId))
    }
  }

  /**
   * 取消指定插件的所有订阅
   */
  unsubscribeAll(pluginId: string): void {
    for (const [key, subs] of this.subscriptions) {
      this.subscriptions.set(key, subs.filter(s => s.pluginId !== pluginId))
    }
  }

  /**
   * 列出指定插件发布的所有数据
   */
  listByPlugin(pluginId: string): Array<{ key: string; value: unknown; timestamp: number }> {
    const dir = join(this.dataDir, pluginId)
    if (!existsSync(dir)) return []

    const { readdirSync } = require('fs') as typeof import('fs')
    const files = readdirSync(dir).filter((f: string) => f.endsWith('.json'))
    const result: Array<{ key: string; value: unknown; timestamp: number }> = []

    for (const file of files) {
      try {
        const entry: SharedDataEntry = JSON.parse(readFileSync(join(dir, file), 'utf-8'))
        result.push({ key: entry.key, value: entry.value, timestamp: entry.timestamp })
      } catch {
        // skip
      }
    }

    return result
  }

  /**
   * 列出所有已发布的数据 key
   */
  listAllKeys(): Array<{ pluginId: string; key: string; timestamp: number }> {
    const result: Array<{ pluginId: string; key: string; timestamp: number }> = []
    const { readdirSync } = require('fs') as typeof import('fs')

    if (!existsSync(this.dataDir)) return result

    const pluginDirs = readdirSync(this.dataDir, { withFileTypes: true })
      .filter((d: { isDirectory: () => boolean }) => d.isDirectory())
      .map((d: { name: string }) => d.name)

    for (const pluginId of pluginDirs) {
      const dir = join(this.dataDir, pluginId)
      const files = readdirSync(dir).filter((f: string) => f.endsWith('.json'))
      for (const file of files) {
        try {
          const entry: SharedDataEntry = JSON.parse(readFileSync(join(dir, file), 'utf-8'))
          result.push({ pluginId: entry.pluginId, key: entry.key, timestamp: entry.timestamp })
        } catch {
          // skip
        }
      }
    }

    return result
  }

  /**
   * 清除指定插件的所有共享数据
   */
  clearPlugin(pluginId: string): void {
    const dir = join(this.dataDir, pluginId)
    if (existsSync(dir)) {
      const { rmSync } = require('fs') as typeof import('fs')
      rmSync(dir, { recursive: true, force: true })
    }
    this.unsubscribeAll(pluginId)
  }

  private getCacheKey(pluginId: string, key: string): string {
    return `${pluginId}:${key}`
  }

  private getFilePath(pluginId: string, key: string): string {
    return join(this.dataDir, pluginId, `${key}.json`)
  }
}
