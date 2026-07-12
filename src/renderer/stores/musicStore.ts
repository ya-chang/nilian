// src/renderer/stores/musicStore.ts
// 音乐状态 — 存储当前正在听的歌曲信息

import { create } from 'zustand'

export interface SongInfo {
  name: string
  artist: string
  album: string
  duration: string
  lyricsSnippet: string
  genre: string
  year: string
  description: string
}

interface MusicState {
  currentSong: SongInfo | null
  isListening: boolean
  setCurrentSong: (song: SongInfo | null) => void
  clearSong: () => void
}

// 从 localStorage 恢复
const loadSong = (): SongInfo | null => {
  try {
    const raw = localStorage.getItem('current-song')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export const useMusicStore = create<MusicState>((set) => ({
  currentSong: loadSong(),
  isListening: !!loadSong(),

  setCurrentSong: (song) => {
    set({ currentSong: song, isListening: !!song })
    if (song) {
      localStorage.setItem('current-song', JSON.stringify(song))
    } else {
      localStorage.removeItem('current-song')
    }
  },

  clearSong: () => {
    set({ currentSong: null, isListening: false })
    localStorage.removeItem('current-song')
  }
}))
