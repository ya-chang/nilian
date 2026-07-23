// src/main/music/MusicState.ts
// 音乐播放状态管理

import { logger } from '../utils/logger'

export interface SongDetail {
  id: string
  name: string
  artist: string
  album: string
  albumCover: string
  duration: number
  releaseDate: string
}

export interface LyricLine {
  time: number
  text: string
  translation?: string
}

export interface HotComment {
  user: string
  content: string
  likedCount: number
}

export interface FullSongInfo {
  detail: SongDetail
  lyrics: LyricLine[]
  hotComments: HotComment[]
}

export interface MusicStateData {
  isPlaying: boolean
  currentSongId: string | null
  currentTime: number
  songInfo: FullSongInfo | null
  lastUpdated: number
}

export class MusicState {
  private state: MusicStateData = {
    isPlaying: false,
    currentSongId: null,
    currentTime: 0,
    songInfo: null,
    lastUpdated: Date.now()
  }

  private stateListeners: Set<(state: MusicStateData) => void> = new Set()

  async onSongChange(songId: string, infoService: { getFullInfo(id: string): Promise<FullSongInfo> }): Promise<void> {
    this.state.currentSongId = songId
    this.state.isPlaying = true
    this.state.currentTime = 0
    this.state.lastUpdated = Date.now()

    try {
      this.state.songInfo = await infoService.getFullInfo(songId)
    } catch (err) {
      logger.error('获取歌曲信息失败', err)
    }

    this.notify()
  }

  onPause(): void {
    this.state.isPlaying = false
    this.notify()
  }

  updateProgress(currentTimeMs: number): void {
    this.state.currentTime = currentTimeMs
    this.state.lastUpdated = Date.now()
  }

  onStateChange(callback: (state: MusicStateData) => void): void {
    this.stateListeners.add(callback)
  }

  getState(): MusicStateData {
    return { ...this.state }
  }

  private notify(): void {
    this.stateListeners.forEach((cb) => cb(this.state))
  }
}
