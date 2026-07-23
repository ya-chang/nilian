// src/main/music/lxMusicIpc.ts
// LX Music 本地 API IPC

import { ipcMain } from 'electron'
import { checkLxMusic, getPlayerStatus, getLyric, play, pause, skipNext, skipPrev } from './LxMusicApi'
import { logger } from '../utils/logger'

export const registerLxMusicIPC = (): void => {
  ipcMain.handle('music:checkLxMusic', async () => {
    try {
      const connected = await checkLxMusic()
      return { success: true, connected }
    } catch (error) {
      logger.error('检测 LX Music 失败', error)
      return { success: false, connected: false }
    }
  })

  ipcMain.handle('music:getPlayerStatus', async () => {
    try {
      const status = await getPlayerStatus()
      return { success: true, data: status }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('music:lxPlay', async () => {
    await play()
    return { success: true }
  })

  ipcMain.handle('music:lxPause', async () => {
    await pause()
    return { success: true }
  })

  ipcMain.handle('music:lxNext', async () => {
    await skipNext()
    return { success: true }
  })

  ipcMain.handle('music:lxPrev', async () => {
    await skipPrev()
    return { success: true }
  })
}
