// src/main/plugins/ipc.ts
// 插件系统 IPC 通信

import { ipcMain, dialog, BrowserWindow } from 'electron'
import { PluginManager } from './PluginManager'
import { IPC_CHANNELS } from '../../shared/ipc-channels'
import { logger } from '../utils/logger'

let pluginManager: PluginManager | null = null

export const registerPluginIPC = (manager: PluginManager): void => {
  pluginManager = manager

  // 安装插件 — 弹出文件选择框
  ipcMain.handle(IPC_CHANNELS.PLUGIN_OPEN_FILE_DIALOG, async () => {
    const result = await dialog.showOpenDialog({
      title: '选择插件文件',
      filters: [{ name: '插件文件', extensions: ['js'] }],
      properties: ['openFile']
    })

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, canceled: true }
    }

    return { success: true, filePath: result.filePaths[0] }
  })

  // 安装插件
  ipcMain.handle(IPC_CHANNELS.PLUGIN_INSTALL, async (_event, params: { filePath: string }) => {
    try {
      return await pluginManager!.install(params.filePath)
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : '安装失败'
      logger.error('插件安装异常', errMsg)
      return { success: false, error: errMsg }
    }
  })

  // 卸载插件
  ipcMain.handle(IPC_CHANNELS.PLUGIN_UNINSTALL, (_event, params: { pluginId: string }) => {
    try {
      pluginManager!.uninstall(params.pluginId)
      return { success: true }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : '卸载失败'
      logger.error('插件卸载异常', errMsg)
      return { success: false, error: errMsg }
    }
  })

  // 启用插件
  ipcMain.handle(IPC_CHANNELS.PLUGIN_ENABLE, async (_event, params: { pluginId: string; characterId?: string }) => {
    try {
      await pluginManager!.enable(params.pluginId, params.characterId)
      return { success: true }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : '启用失败'
      logger.error('插件启用异常', errMsg)
      return { success: false, error: errMsg }
    }
  })

  // 禁用插件
  ipcMain.handle(IPC_CHANNELS.PLUGIN_DISABLE, (_event, params: { pluginId: string }) => {
    try {
      pluginManager!.disable(params.pluginId)
      return { success: true }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : '禁用失败'
      logger.error('插件禁用异常', errMsg)
      return { success: false, error: errMsg }
    }
  })

  // 切换目标角色
  ipcMain.handle(IPC_CHANNELS.PLUGIN_SWITCH_TARGET, (_event, params: { pluginId: string; characterId: string }) => {
    try {
      pluginManager!.switchTarget(params.pluginId, params.characterId)
      return { success: true }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : '切换失败'
      return { success: false, error: errMsg }
    }
  })

  // 获取已安装插件列表
  ipcMain.handle(IPC_CHANNELS.PLUGIN_GET_INSTALLED, () => {
    return pluginManager!.getInstalled()
  })

  // 获取插件信息（含 meta + registry）+ 权限状态
  ipcMain.handle(IPC_CHANNELS.PLUGIN_GET_PERMISSIONS, (_event, params: { pluginId: string }) => {
    try {
      if (!pluginManager) {
        logger.error('[插件] pluginManager 未初始化')
        return null
      }
      const info = pluginManager.getPluginInfo(params.pluginId)
      const permissions = pluginManager.getPluginPermissions(params.pluginId)
      logger.info(`[插件] getPluginInfo(${params.pluginId}) = ${info ? 'found' : 'null'}, registries.size=${pluginManager.getInstalled().length}`)
      return { ...info, permissions }
    } catch (err) {
      logger.error('获取插件信息失败', err)
      return null
    }
  })

  // 设置插件权限
  ipcMain.handle('plugin:set-permission', (_event, params: { pluginId: string; permission: string; granted: boolean }) => {
    pluginManager!.setPluginPermission(params.pluginId, params.permission, params.granted)
    return { success: true }
  })

  // 获取插件配置Schema
  ipcMain.handle('plugin:get-config', (_event, params: { pluginId: string }) => {
    const info = pluginManager!.getPluginInfo(params.pluginId)
    if (!info) return []
    return info.meta?.configSchema || []
  })

  // 获取插件合并后的配置（Schema默认值 + 用户保存值）
  ipcMain.handle('plugin:get-merged-config', (_event, params: { pluginId: string }) => {
    const info = pluginManager!.getPluginInfo(params.pluginId)
    const schema = info?.meta?.configSchema || []
    return pluginManager!.getConfig().getConfig(params.pluginId, schema)
  })

  // 设置插件配置
  ipcMain.handle('plugin:set-config', (_event, params: { pluginId: string; config: Record<string, unknown> }) => {
    pluginManager!.getConfig().setConfig(params.pluginId, params.config)
    // 重新加载插件
    pluginManager!.reload(params.pluginId)
    return { success: true }
  })

  // 检查插件是否对指定角色生效
  ipcMain.handle('plugin:is-active', (_event, params: { pluginId: string; characterId: string }) => {
    return pluginManager!.isActiveForCharacter(params.pluginId, params.characterId)
  })

  // 获取插件作用范围信息
  ipcMain.handle('plugin:get-scope', (_event, params: { pluginId: string }) => {
    return pluginManager!.getScopeInfo(params.pluginId)
  })

  // 获取对指定角色生效的插件列表
  ipcMain.handle('plugin:get-active-for-character', (_event, params: { characterId: string }) => {
    return pluginManager!.getActivePluginsForCharacter(params.characterId)
  })

  // 获取插件错误统计
  ipcMain.handle('plugin:get-error-stats', (_event, params: { pluginId: string }) => {
    return pluginManager!.getErrorHandler().getStats(params.pluginId)
  })

  // 获取所有有错误的插件
  ipcMain.handle('plugin:get-errors', () => {
    return pluginManager!.getErrorHandler().getPluginsWithErrors()
  })

  // 清除插件错误记录
  ipcMain.handle('plugin:clear-errors', (_event, params: { pluginId: string }) => {
    pluginManager!.getErrorHandler().clearErrors(params.pluginId)
    return { success: true }
  })

  // 获取插件健康状态
  ipcMain.handle('plugin:get-health', (_event, params: { pluginId: string }) => {
    return pluginManager!.getHealthCheck().getStatus(params.pluginId)
  })

  // 获取所有插件健康状态
  ipcMain.handle('plugin:get-health-all', () => {
    return pluginManager!.getHealthCheck().getAllStatuses()
  })

  // 获取事件总线信息
  ipcMain.handle('plugin:get-event-listeners', (_event, params: { event: string }) => {
    return pluginManager!.getEventBus().getListeners(params.event)
  })

  ipcMain.handle('plugin:get-event-names', () => {
    return pluginManager!.getEventBus().getEventNames()
  })

  // 获取共享数据
  ipcMain.handle('plugin:share-list-keys', () => {
    return pluginManager!.getDataShare().listAllKeys()
  })

  ipcMain.handle('plugin:share-list-by-plugin', (_event, params: { pluginId: string }) => {
    return pluginManager!.getDataShare().listByPlugin(params.pluginId)
  })

  logger.info('插件IPC已注册')
}
