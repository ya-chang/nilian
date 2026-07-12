// src/main/ipc/settings.ts
// 设置 IPC 处理器 — 主题切换 + 数据导出导入

import { ipcMain, dialog, BrowserWindow } from 'electron'
import { IPC_CHANNELS } from '../../shared/ipc-channels'
import { ThemeManager } from '../utils/theme'
import { DataExporter } from '../utils/dataExport'
import { logger } from '../utils/logger'

const themeManager = new ThemeManager()
const dataExporter = new DataExporter()

export const registerSettingsIPC = (): void => {
  // 获取当前主题
  ipcMain.handle('theme:get', () => {
    return {
      name: themeManager.getTheme(),
      variables: themeManager.getThemeVariables()
    }
  })

  // 设置主题
  ipcMain.handle('theme:set', (_event, params: { name: string }) => {
    try {
      themeManager.setTheme(params.name as 'default' | 'dark' | 'pink')
      return { success: true }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : '未知错误'
      return { success: false, error: errMsg }
    }
  })

  // 获取可用主题列表
  ipcMain.handle('theme:list', () => {
    return themeManager.getAvailableThemes()
  })

  // 导出数据
  ipcMain.handle('data:export', async (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    const result = await dialog.showSaveDialog(window!, {
      title: '导出数据',
      defaultPath: `wechat-ai-lover-backup-${new Date().toISOString().split('T')[0]}.json`,
      filters: [{ name: 'JSON', extensions: ['json'] }]
    })

    if (!result.canceled && result.filePath) {
      try {
        dataExporter.exportToFile(result.filePath)
        return { success: true, path: result.filePath }
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : '未知错误'
        logger.error(`数据导出失败: ${errMsg}`)
        return { success: false, error: errMsg }
      }
    }
    return { success: false, error: '用户取消' }
  })

  // 导入数据
  ipcMain.handle('data:import', async (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    const result = await dialog.showOpenDialog(window!, {
      title: '导入数据',
      filters: [{ name: 'JSON', extensions: ['json'] }],
      properties: ['openFile']
    })

    if (!result.canceled && result.filePaths.length > 0) {
      try {
        dataExporter.importFromFile(result.filePaths[0])
        return { success: true }
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : '未知错误'
        logger.error(`数据导入失败: ${errMsg}`)
        return { success: false, error: errMsg }
      }
    }
    return { success: false, error: '用户取消' }
  })

  // 选择数据目录
  ipcMain.handle('data:chooseDir', async (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    const result = await dialog.showOpenDialog(window!, {
      title: '选择数据存放目录',
      properties: ['openDirectory', 'createDirectory']
    })

    if (!result.canceled && result.filePaths.length > 0) {
      return { success: true, path: result.filePaths[0] }
    }
    return { success: false, error: '用户取消' }
  })
}
