// src/main/index.ts
// Electron 主进程入口

import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { IPC_CHANNELS } from '../shared/ipc-channels'
import { registerChatIPC, getChatEngine } from './ipc/chat'
import { registerCharacterIPC } from './ipc/character'
import { registerMomentsIPC } from './ipc/moments'
import { registerSettingsIPC } from './ipc/settings'
import { registerAvatarIPC } from './ipc/avatar'
import { registerKnowledgeIPC } from './ipc/knowledge'
import { registerBannedWordsIPC } from './ipc/bannedWords'
import { registerLxMusicIPC } from './music/lxMusicIpc'
import { MusicState } from './music/MusicState'
import { MusicInfoService } from './music/MusicInfoService'
import { MusicContextInjector } from './music/MusicContextInjector'
import { registerMusicIPC } from './music/ipc'
import { MusicSourceManager } from './music/MusicSourceManager'
import { registerSourceIPC, registerAudioProxy } from './music/sourceIpc'
import { MusicWindow } from './music/MusicWindow'
import { NeteaseDetector } from './music/NeteaseDetector'
import { Scheduler } from './proactive/Scheduler'
import { PluginManager } from './plugins/PluginManager'
import { registerPluginIPC } from './plugins/ipc'
import { AutoBackup } from './backup/AutoBackup'
import { CrashRecovery } from './backup/CrashRecovery'
import { TTSService } from './tts/TTSService'
import { TTSState } from './tts/TTSState'
import { registerTTSIPC } from './tts/ipc'
import { PATHS } from './utils/dataPath'
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
let musicState: MusicState | null = null
let musicInfoService: MusicInfoService | null = null
let musicContextInjector: MusicContextInjector | null = null
let musicSourceManager: MusicSourceManager | null = null
let musicWindow: MusicWindow | null = null
let neteaseDetector: NeteaseDetector | null = null
let pluginManager: PluginManager | null = null
let autoBackup: AutoBackup | null = null
let crashRecovery: CrashRecovery | null = null
let ttsService: TTSService | null = null
let ttsState: TTSState | null = null

const isDev = !app.isPackaged

// 禁用 GPU 加速（解决 BrowserView 白屏问题）
app.commandLine.appendSwitch('disable-gpu')
app.commandLine.appendSwitch('disable-gpu-compositing')

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
      nodeIntegration: false,
      webviewTag: true
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

  // 打开外部链接
  ipcMain.on('shell:open', (_event, url: string) => {
    import('electron').then(({ shell }) => {
      shell.openExternal(url)
    })
  })
}

// 启动主动消息调度
const startScheduler = (characterId: string): void => {
  if (schedulerInterval) {
    clearInterval(schedulerInterval)
  }

  // 检查角色是否启用了主动消息
  try {
    const { CharacterManager } = require('./character/CharacterManager') as typeof import('./character/CharacterManager')
    const cm = new CharacterManager()
    const character = cm.get(characterId)
    if (character && !character.proactiveEnabled) {
      logger.info(`角色 ${characterId} 未启用主动消息，跳过调度`)
      return
    }
  } catch (err) { logger.debug('主动消息调度器检查角色配置失败', err) }

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
  registerBannedWordsIPC()
  registerLxMusicIPC()
  createWindow()

  // 初始化音乐系统
  if (mainWindow) {
    musicState = new MusicState()
    musicInfoService = new MusicInfoService()
    musicContextInjector = new MusicContextInjector()

    registerMusicIPC(musicState, mainWindow)

    // 初始化音源管理器
    musicSourceManager = new MusicSourceManager()
    registerSourceIPC(musicSourceManager)
    registerAudioProxy()

    // 初始化网易云WebView
    musicWindow = new MusicWindow()
    neteaseDetector = new NeteaseDetector()

    // 监听歌曲变化请求
    mainWindow.webContents.on('did-finish-load', () => {
      ipcMain.on('music:song-change-request', async (_event, songId: string) => {
        if (musicState && musicInfoService) {
          await musicState.onSongChange(songId, musicInfoService)
        }
      })
    })

    // 前端请求创建网易云WebView
    ipcMain.handle('music:create-webview', () => {
      logger.info('收到 create-webview 请求')
      if (!mainWindow) {
        logger.error('mainWindow 为空')
        return { success: false }
      }

      musicWindow!.create(mainWindow)

      // 设置歌曲变化回调（只设置一次）
      if (!musicWindow!.hasSongChangeCallback()) {
        musicWindow!.onSongChange(async (songId) => {
          logger.info(`检测到歌曲变化: ${songId}`)
          if (musicState && musicInfoService) {
            try {
              await musicState.onSongChange(songId, musicInfoService)
              const songInfo = musicState.getState().songInfo
              if (songInfo) {
                // 通知前端
                if (mainWindow) {
                  logger.info(`发送歌曲信息到前端: ${songInfo.detail.name}`)
                  mainWindow.webContents.send('music:song-changed', {
                    songId,
                    songInfo
                  })
                }
                // 注入到AI聊天上下文
                const chatEngine = getChatEngine()
                chatEngine.setCurrentSongInfo(songInfo)
                logger.info(`歌曲信息已注入AI上下文: ${songInfo.detail.name}`)
              }
            } catch (err) {
              logger.error('处理歌曲变化失败:', err)
            }
          }
        })
      }

      // 确保显示
      musicWindow!.show()

      return { success: true }
    })

    // 前端请求显示WebView
    ipcMain.handle('music:show-webview', () => {
      musicWindow?.show()
      return { success: true }
    })

    // 前端请求隐藏WebView
    ipcMain.handle('music:hide-webview', () => {
      musicWindow?.hide()
      return { success: true }
    })

    // 前端获取当前歌曲信息
    ipcMain.handle('music:get-current-song', () => {
      const state = musicState?.getState()
      return state?.songInfo || null
    })
  }

  // 初始化插件系统
  if (mainWindow) {
    pluginManager = new PluginManager(mainWindow)
    registerPluginIPC(pluginManager)
    pluginManager.loadAll()
    logger.info('插件系统已初始化')
  }

  // 初始化 TTS
  if (mainWindow) {
    ttsService = new TTSService(PATHS.base)
    ttsState = new TTSState()
    registerTTSIPC(ttsService, ttsState, mainWindow)

    // 将 TTS 注入 ChatEngine
    const chatEngine = getChatEngine()
    chatEngine.setTTS(ttsService, ttsState)

    logger.info('TTS系统已初始化')
  }

  // 初始化崩溃恢复 + 自动备份
  const dataDir = PATHS.base
  crashRecovery = new CrashRecovery(dataDir)
  crashRecovery.check()

  autoBackup = new AutoBackup(dataDir)
  autoBackup.start()

  // 备份 IPC
  ipcMain.handle(IPC_CHANNELS.BACKUP_NOW, () => {
    const date = autoBackup!.backup()
    return { success: !!date, date }
  })

  ipcMain.handle(IPC_CHANNELS.BACKUP_RESTORE, (_event, params: { date: string }) => {
    const ok = autoBackup!.restore(params.date)
    return { success: ok }
  })

  ipcMain.handle(IPC_CHANNELS.BACKUP_LIST, () => {
    return autoBackup!.listBackups()
  })

  ipcMain.handle(IPC_CHANNELS.BACKUP_CHECK_INTEGRITY, () => {
    return crashRecovery!.checkIntegrity()
  })

  ipcMain.handle(IPC_CHANNELS.BACKUP_GET_STATUS, () => {
    return {
      lastBackup: autoBackup!.getLastBackupDate(),
      lastCrash: crashRecovery!.getLastCrashTime()
    }
  })

  ipcMain.handle('backup:get-config', () => {
    return autoBackup!.getConfig()
  })

  ipcMain.handle('backup:set-config', (_event, params: Partial<{ maxBackups: number; backupHour: number; backupMinute: number }>) => {
    autoBackup!.setConfig(params)
    return { success: true }
  })

  logger.info('备份系统已初始化')

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
  // 清理崩溃恢复锁文件
  crashRecovery?.cleanup()
  autoBackup?.stop()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

export { mainWindow }
