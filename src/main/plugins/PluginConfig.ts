// src/main/plugins/PluginConfig.ts
// 插件配置管理 — 读写插件配置，合并 Schema 默认值

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { logger } from '../utils/logger'

interface ConfigField {
  key: string
  label: string
  type: string
  default?: unknown
  placeholder?: string
  options?: Array<{ label: string; value: unknown }>
  min?: number
  max?: number
}

export class PluginConfig {
  private pluginDataDir: string

  constructor(dataDir: string) {
    this.pluginDataDir = join(dataDir, 'plugins', 'plugin-data')
  }

  /**
   * 获取插件配置（已合并默认值）
   */
  getConfig(pluginId: string, schema: ConfigField[] = []): Record<string, unknown> {
    const saved = this.getRawConfig(pluginId)
    const merged: Record<string, unknown> = {}
    for (const field of schema) {
      merged[field.key] = saved[field.key] ?? field.default ?? ''
    }
    return merged
  }

  /**
   * 获取原始配置（未合并默认值）
   */
  getRawConfig(pluginId: string): Record<string, unknown> {
    const configPath = this.getConfigPath(pluginId)
    if (!existsSync(configPath)) return {}
    try {
      return JSON.parse(readFileSync(configPath, 'utf-8'))
    } catch {
      return {}
    }
  }

  /**
   * 保存插件配置
   */
  setConfig(pluginId: string, config: Record<string, unknown>): void {
    const dir = this.getPluginDataDir(pluginId)
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    writeFileSync(this.getConfigPath(pluginId), JSON.stringify(config, null, 2), 'utf-8')
    logger.info(`插件配置已保存: ${pluginId}`)
  }

  /**
   * 获取单个配置项
   */
  getKey(pluginId: string, key: string, schema: ConfigField[] = []): unknown {
    const config = this.getConfig(pluginId, schema)
    return config[key]
  }

  /**
   * 清除插件配置
   */
  clearConfig(pluginId: string): void {
    const configPath = this.getConfigPath(pluginId)
    if (existsSync(configPath)) {
      writeFileSync(configPath, '{}', 'utf-8')
    }
  }

  private getConfigPath(pluginId: string): string {
    return join(this.pluginDataDir, pluginId, 'config.json')
  }

  private getPluginDataDir(pluginId: string): string {
    return join(this.pluginDataDir, pluginId)
  }
}
