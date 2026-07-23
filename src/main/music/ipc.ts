// src/main/music/ipc.ts
// 音乐IPC通信注册

import { ipcMain, BrowserWindow } from 'electron'
import { MusicState } from './MusicState'
import { logger } from '../utils/logger'

export function registerMusicIPC(
  musicState: MusicState,
  mainWindow: BrowserWindow
): void {
  ipcMain.on('music:song-changed', async (_event, songId: string) => {
    logger.info(`歌曲变化: ${songId}`)
    mainWindow.webContents.send('music:song-change-request', songId)
  })

  ipcMain.on('music:paused', () => {
    musicState.onPause()
    mainWindow.webContents.send('music:state-changed', {
      isPlaying: false,
      currentSongId: musicState.getState().currentSongId,
      songInfo: musicState.getState().songInfo,
      currentTime: musicState.getState().currentTime
    })
  })

  ipcMain.on('music:progress', (_event, currentTimeMs: number) => {
    musicState.updateProgress(currentTimeMs)
  })

  ipcMain.handle('music:get-state', () => {
    return musicState.getState()
  })

  ipcMain.handle('music:get-song-info', () => {
    const state = musicState.getState()
    return state.songInfo
  })

  ipcMain.handle('music:set-visible', (_event, visible: boolean) => {
    mainWindow.webContents.send('music:set-visible', visible)
  })

  musicState.onStateChange((state) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('music:state-changed', {
        isPlaying: state.isPlaying,
        currentSongId: state.currentSongId,
        songInfo: state.songInfo,
        currentTime: state.currentTime
      })
    }
  })
}
