// src/main/index.ts
// Electron 主进程入口

import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { IPC_CHANNELS } from '../shared/ipc-channels'
import { registerChatIPC } from './ipc/chat'
import { registerCharacterIPC } from './ipc/character'
import { registerMomentsIPC } from './ipc/moments'
import { registerSettingsIPC } from './ipc/settings'
import { registerAvatarIPC } from './ipc/avatar'
import { registerKnowledgeIPC } from './ipc/knowledge'
import { registerMusicIPC } from './ipc/music'
import { Scheduler } from './proactive/Scheduler'
import { logger } from './utils/logger'

// 全局错误捕获 — 防止进程崩溃
process.on('uncaughtException', (error) => {
  logger.error('未捕获异常', error.message, error.stack)
})

process.on('unhandledRejection', (reason) => {
  logger.error('未处理的 Promise 拒绝', String(reason))
})

let mainWindow: BrowserWindow | null = null
let scheduler: Scheduler | null = null
let schedulerInterval: ReturnType<typeof setInterval> | null = null

const isDev = !app.isPackaged

const createWindow = (): void => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    frame: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// 注册窗口控制IPC
const registerWindowControls = (): void => {
  ipcMain.on(IPC_CHANNELS.WINDOW_MINIMIZE, () => {
    mainWindow?.minimize()
  })

  ipcMain.on(IPC_CHANNELS.WINDOW_MAXIMIZE, () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow?.maximize()
    }
  })

  ipcMain.on(IPC_CHANNELS.WINDOW_CLOSE, () => {
    mainWindow?.close()
  })
}

// 启动主动消息调度
const startScheduler = (characterId: string): void => {
  if (schedulerInterval) {
    clearInterval(schedulerInterval)
  }

  scheduler = new Scheduler(characterId, (message) => {
    if (mainWindow) {
      mainWindow.webContents.send('proactive:message', {
        characterId,
        content: message
      })
    }
  })

  // 每分钟检查一次定时触发
  schedulerInterval = setInterval(() => {
    const scheduledMessage = scheduler?.checkScheduled()
    if (scheduledMessage && mainWindow) {
      mainWindow.webContents.send('proactive:message', {
        characterId,
        content: scheduledMessage
      })
    }
  }, 60 * 1000)

  logger.info(`主动消息调度器已启动: characterId=${characterId}`)
}

app.whenReady().then(() => {
  registerWindowControls()
  registerChatIPC()
  registerCharacterIPC()
  registerMomentsIPC()
  registerSettingsIPC()
  registerAvatarIPC()
  registerKnowledgeIPC()
  registerMusicIPC()
  createWindow()

  // 启动默认角色的主动消息
  startScheduler('default')

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (schedulerInterval) {
    clearInterval(schedulerInterval)
  }
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

export { mainWindow }
