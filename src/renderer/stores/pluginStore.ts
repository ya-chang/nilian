// src/renderer/stores/pluginStore.ts
// 插件状态管理 — 管理已安装插件列表 + 操作状态

import { create } from 'zustand'
import {
  getInstalledPlugins,
  installPlugin,
  uninstallPlugin,
  enablePlugin,
  disablePlugin,
  switchPluginTarget,
  openPluginFileDialog,
  type InstalledPlugin
} from '../ipc/plugin'

interface PluginState {
  plugins: InstalledPlugin[]
  isLoading: boolean
  error: string | null
  successMessage: string | null

  // 操作
  loadPlugins: () => Promise<void>
  install: () => Promise<{ success: boolean; error?: string }>
  uninstall: (pluginId: string) => Promise<boolean>
  toggleEnabled: (pluginId: string) => Promise<boolean>
  switchTarget: (pluginId: string, characterId: string) => Promise<boolean>
  clearError: () => void
  clearSuccess: () => void
}

export const usePluginStore = create<PluginState>((set, get) => ({
  plugins: [],
  isLoading: false,
  error: null,
  successMessage: null,

  loadPlugins: async () => {
    set({ isLoading: true, error: null })
    try {
      const plugins = await getInstalledPlugins()
      set({ plugins, isLoading: false })
    } catch (err) {
      set({ isLoading: false, error: '加载插件列表失败' })
    }
  },

  install: async () => {
    set({ error: null, successMessage: null })

    // 1. 打开文件选择框
    const fileResult = await openPluginFileDialog()
    if (!fileResult.success || !fileResult.filePath) {
      if (fileResult.canceled) return { success: false }
      return { success: false, error: '文件选择失败' }
    }

    // 2. 安装
    set({ isLoading: true })
    try {
      const result = await installPlugin(fileResult.filePath)
      if (result.success) {
        set({
          isLoading: false,
          successMessage: `插件 "${result.meta?.name}" 安装成功`
        })
        // 刷新列表
        await get().loadPlugins()
        return { success: true }
      } else {
        set({ isLoading: false, error: result.error || '安装失败' })
        return { success: false, error: result.error }
      }
    } catch (err) {
      set({ isLoading: false, error: '安装异常' })
      return { success: false, error: '安装异常' }
    }
  },

  uninstall: async (pluginId: string) => {
    set({ error: null, successMessage: null })
    set({ isLoading: true })
    try {
      const result = await uninstallPlugin(pluginId)
      if (result.success) {
        set({ isLoading: false, successMessage: '插件已卸载' })
        await get().loadPlugins()
        return true
      } else {
        set({ isLoading: false, error: result.error || '卸载失败' })
        return false
      }
    } catch (err) {
      set({ isLoading: false, error: '卸载异常' })
      return false
    }
  },

  toggleEnabled: async (pluginId: string) => {
    set({ error: null, successMessage: null })
    const plugin = get().plugins.find(p => p.id === pluginId)
    if (!plugin) return false

    try {
      if (plugin.enabled) {
        const result = await disablePlugin(pluginId)
        if (result.success) {
          set(state => ({
            plugins: state.plugins.map(p =>
              p.id === pluginId ? { ...p, enabled: false } : p
            )
          }))
          return true
        }
        set({ error: result.error || '禁用失败' })
        return false
      } else {
        const result = await enablePlugin(pluginId)
        if (result.success) {
          set(state => ({
            plugins: state.plugins.map(p =>
              p.id === pluginId ? { ...p, enabled: true } : p
            )
          }))
          return true
        }
        set({ error: result.error || '启用失败' })
        return false
      }
    } catch (err) {
      set({ error: '操作异常' })
      return false
    }
  },

  switchTarget: async (pluginId: string, characterId: string) => {
    set({ error: null, successMessage: null })
    try {
      const result = await switchPluginTarget(pluginId, characterId)
      if (result.success) {
        set(state => ({
          plugins: state.plugins.map(p =>
            p.id === pluginId ? { ...p, targetCharacters: [characterId] } : p
          ),
          successMessage: '角色已切换'
        }))
        return true
      }
      set({ error: result.error || '切换失败' })
      return false
    } catch (err) {
      set({ error: '切换异常' })
      return false
    }
  },

  clearError: () => set({ error: null }),
  clearSuccess: () => set({ successMessage: null })
}))
