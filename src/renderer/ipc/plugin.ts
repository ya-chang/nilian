// src/renderer/ipc/plugin.ts
// 渲染进程插件 IPC — 调用主进程处理插件操作

import { IPC_CHANNELS } from '@shared/ipc-channels'

// ─── 类型定义 ───

export interface InstalledPlugin {
  id: string
  file: string
  name: string
  version: string
  scope: 'global' | 'character'
  type: 'normal' | 'sensor'
  enabled: boolean
  installedAt: string
  permissions: string[]
  targetCharacters?: string[]
  priority: number
}

export interface PluginInfo {
  meta: {
    id: string
    name: string
    version: string
    author?: string
    description?: string
    type?: string
    scope?: string
    priority?: number
    permissions?: string[]
    configSchema?: Array<{
      key: string
      label: string
      type: string
      default?: unknown
      placeholder?: string
      options?: Array<{ label: string; value: unknown }>
    }>
  }
  registry: InstalledPlugin
}

export interface InstallResult {
  success: boolean
  meta?: { id: string; name: string; version: string }
  error?: string
  canceled?: boolean
}

// ─── IPC 调用 ───

const invoke = <T>(channel: string, ...args: unknown[]): Promise<T> => {
  return window.electronAPI!.invoke(channel, ...args) as Promise<T>
}

/** 打开文件选择框，返回选中的文件路径 */
export const openPluginFileDialog = async (): Promise<{ success: boolean; filePath?: string; canceled?: boolean }> => {
  return invoke(IPC_CHANNELS.PLUGIN_OPEN_FILE_DIALOG)
}

/** 安装插件 */
export const installPlugin = async (filePath: string): Promise<InstallResult> => {
  return invoke(IPC_CHANNELS.PLUGIN_INSTALL, { filePath })
}

/** 卸载插件 */
export const uninstallPlugin = async (pluginId: string): Promise<{ success: boolean; error?: string }> => {
  return invoke(IPC_CHANNELS.PLUGIN_UNINSTALL, { pluginId })
}

/** 启用插件 */
export const enablePlugin = async (pluginId: string, characterId?: string): Promise<{ success: boolean; error?: string }> => {
  return invoke(IPC_CHANNELS.PLUGIN_ENABLE, { pluginId, characterId })
}

/** 禁用插件 */
export const disablePlugin = async (pluginId: string): Promise<{ success: boolean; error?: string }> => {
  return invoke(IPC_CHANNELS.PLUGIN_DISABLE, { pluginId })
}

/** 切换目标角色 */
export const switchPluginTarget = async (pluginId: string, characterId: string): Promise<{ success: boolean; error?: string }> => {
  return invoke(IPC_CHANNELS.PLUGIN_SWITCH_TARGET, { pluginId, characterId })
}

/** 获取已安装插件列表 */
export const getInstalledPlugins = async (): Promise<InstalledPlugin[]> => {
  const result = await invoke<InstalledPlugin[]>(IPC_CHANNELS.PLUGIN_GET_INSTALLED)
  return Array.isArray(result) ? result : []
}

/** 获取插件详细信息 */
export const getPluginInfo = async (pluginId: string): Promise<PluginInfo | null> => {
  const result = await invoke<PluginInfo | null>(IPC_CHANNELS.PLUGIN_GET_PERMISSIONS, { pluginId })
  return result || null
}

/** 获取插件配置schema */
export const getPluginConfigSchema = async (pluginId: string): Promise<unknown[]> => {
  const result = await invoke<unknown[]>('plugin:get-config', { pluginId })
  return Array.isArray(result) ? result : []
}

/** 保存插件配置 */
export const setPluginConfig = async (pluginId: string, config: Record<string, unknown>): Promise<{ success: boolean }> => {
  return invoke('plugin:set-config', { pluginId, config })
}

/** 获取插件合并后的配置（Schema默认值 + 用户保存值） */
export const getMergedConfig = async (pluginId: string): Promise<Record<string, unknown>> => {
  const result = await invoke<Record<string, unknown>>('plugin:get-merged-config', { pluginId })
  return result || {}
}

/** 获取插件权限状态 */
export interface PluginPermission {
  permission: string
  granted: boolean
  info: { label: string; risk: string; description: string }
}

export const getPluginPermissions = async (pluginId: string): Promise<PluginPermission[]> => {
  const result = await invoke<PluginPermission[]>('plugin:get-permissions', { pluginId })
  return Array.isArray(result) ? result : []
}

/** 设置插件权限 */
export const setPluginPermission = async (pluginId: string, permission: string, granted: boolean): Promise<{ success: boolean }> => {
  return invoke('plugin:set-permission', { pluginId, permission, granted })
}

/** 检查插件是否对指定角色生效 */
export const isPluginActiveForCharacter = async (pluginId: string, characterId: string): Promise<boolean> => {
  const result = await invoke<boolean>('plugin:is-active', { pluginId, characterId })
  return !!result
}

/** 获取插件作用范围信息 */
export const getPluginScope = async (pluginId: string): Promise<{ scope: string; targetCharacters: string[] } | null> => {
  const result = await invoke<{ scope: string; targetCharacters: string[] } | null>('plugin:get-scope', { pluginId })
  return result || null
}

/** 获取对指定角色生效的插件列表 */
export const getActivePluginsForCharacter = async (characterId: string): Promise<InstalledPlugin[]> => {
  const result = await invoke<InstalledPlugin[]>('plugin:get-active-for-character', { characterId })
  return Array.isArray(result) ? result : []
}

/** 获取插件错误统计 */
export interface PluginErrorStats {
  total: number
  recent: number
  lastError: { pluginId: string; phase: string; message: string; timestamp: number } | null
}

export const getPluginErrorStats = async (pluginId: string): Promise<PluginErrorStats> => {
  const result = await invoke<PluginErrorStats>('plugin:get-error-stats', { pluginId })
  return result || { total: 0, recent: 0, lastError: null }
}

/** 获取所有有错误的插件 */
export const getPluginsWithErrors = async (): Promise<Array<{ pluginId: string; errorCount: number; lastError: unknown }>> => {
  const result = await invoke<Array<{ pluginId: string; errorCount: number; lastError: unknown }>>('plugin:get-errors')
  return Array.isArray(result) ? result : []
}

/** 清除插件错误记录 */
export const clearPluginErrors = async (pluginId: string): Promise<{ success: boolean }> => {
  return invoke('plugin:clear-errors', { pluginId })
}

/** 获取插件健康状态 */
export interface PluginHealthStatus {
  pluginId: string
  alive: boolean
  lastHeartbeat: number
  lastCheck: number
  consecutiveFailures: number
}

export const getPluginHealth = async (pluginId: string): Promise<PluginHealthStatus | null> => {
  const result = await invoke<PluginHealthStatus | null>('plugin:get-health', { pluginId })
  return result || null
}

/** 获取所有插件健康状态 */
export const getAllPluginHealth = async (): Promise<PluginHealthStatus[]> => {
  const result = await invoke<PluginHealthStatus[]>('plugin:get-health-all')
  return Array.isArray(result) ? result : []
}

/** 获取事件监听器列表 */
export const getEventListeners = async (event: string): Promise<Array<{ pluginId: string; priority: number }>> => {
  const result = await invoke<Array<{ pluginId: string; priority: number }>>('plugin:get-event-listeners', { event })
  return Array.isArray(result) ? result : []
}

/** 获取所有已注册的事件名 */
export const getEventNames = async (): Promise<string[]> => {
  const result = await invoke<string[]>('plugin:get-event-names')
  return Array.isArray(result) ? result : []
}

/** 获取所有共享数据 key */
export const getShareKeys = async (): Promise<Array<{ pluginId: string; key: string; timestamp: number }>> => {
  const result = await invoke<Array<{ pluginId: string; key: string; timestamp: number }>>('plugin:share-list-keys')
  return Array.isArray(result) ? result : []
}

/** 获取指定插件发布的共享数据 */
export const getShareByPlugin = async (pluginId: string): Promise<Array<{ key: string; value: unknown; timestamp: number }>> => {
  const result = await invoke<Array<{ key: string; value: unknown; timestamp: number }>>('plugin:share-list-by-plugin', { pluginId })
  return Array.isArray(result) ? result : []
}
