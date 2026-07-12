// src/main/ipc/music.ts
// 音乐搜索 IPC — 通过网易云音乐 API 获取歌曲信息

import { ipcMain } from 'electron'
import { logger } from '../utils/logger'

interface SongInfo {
  name: string
  artist: string
  album: string
  duration: string
  lyricsSnippet: string
  genre: string
  year: string
  description: string
}

/**
 * 搜索歌曲信息 — 使用网易云音乐 API
 * 如果 API 不可用，返回基础信息
 */
const searchSong = async (query: string): Promise<SongInfo> => {
  try {
    // 1. 搜索歌曲 ID
    const searchUrl = `https://music.163.com/api/search/get?s=${encodeURIComponent(query)}&type=1&limit=5`
    const searchRes = await fetch(searchUrl, {
      headers: { 'Referer': 'https://music.163.com' }
    })
    const searchData = await searchRes.json() as { result?: { songs?: Array<{ id: number; name: string; artists: Array<{ name: string }>; album: { name: string }; duration: number }> } }

    const songs = searchData?.result?.songs
    if (!songs || songs.length === 0) {
      // 搜索失败，返回基础信息
      return {
        name: query,
        artist: '未知歌手',
        album: '未知专辑',
        duration: '',
        lyricsSnippet: '',
        genre: '',
        year: '',
        description: `用户正在听"${query}"，但未能获取到详细信息。`
      }
    }

    const song = songs[0]

    // 2. 获取歌词
    let lyricsSnippet = ''
    try {
      const lyricsUrl = `https://music.163.com/api/song/lyric?id=${song.id}&lv=1`
      const lyricsRes = await fetch(lyricsUrl, {
        headers: { 'Referer': 'https://music.163.com' }
      })
      const lyricsData = await lyricsRes.json() as { lrc?: { lyric?: string } }
      const lrc = lyricsData?.lrc?.lyric || ''
      if (lrc) {
        // 提取前 10 行歌词
        const lines = lrc.split('\n')
          .filter((l: string) => l.trim() && !l.startsWith('['))
          .slice(0, 10)
        lyricsSnippet = lines.join('\n')
      }
    } catch {
      // 歌词获取失败，忽略
    }

    // 3. 获取歌曲详情
    let description = ''
    try {
      const detailUrl = `https://music.163.com/api/song/detail?id=${song.id}&ids=[${song.id}]`
      const detailRes = await fetch(detailUrl, {
        headers: { 'Referer': 'https://music.163.com' }
      })
      const detailData = await detailRes.json() as { songs?: Array<{ hMusic?: { bitrate?: number }; publishTime?: number }> }
      const detail = detailData?.songs?.[0]
      if (detail?.publishTime) {
        const year = new Date(detail.publishTime).getFullYear()
        description = `${song.name} 是 ${song.artists.map((a: { name: string }) => a.name).join('/')} 的歌曲，收录于专辑《${song.album.name}》，发行于 ${year} 年。`
      }
    } catch {
      description = `${song.name} 是 ${song.artists.map((a: { name: string }) => a.name).join('/')} 的歌曲，收录于专辑《${song.album.name}》。`
    }

    const durationMin = Math.floor(song.duration / 60000)
    const durationSec = Math.floor((song.duration % 60000) / 1000)

    return {
      name: song.name,
      artist: song.artists.map((a: { name: string }) => a.name).join('/'),
      album: song.album.name,
      duration: `${durationMin}:${durationSec.toString().padStart(2, '0')}`,
      lyricsSnippet,
      genre: '',
      year: description.match(/\d{4}/)?.[0] || '',
      description
    }
  } catch (error) {
    logger.error('音乐搜索失败', error)
    // 降级：返回用户输入的基本信息
    return {
      name: query,
      artist: '未知',
      album: '未知',
      duration: '',
      lyricsSnippet: '',
      genre: '',
      year: '',
      description: `用户正在听"${query}"。`
    }
  }
}

export const registerMusicIPC = (): void => {
  ipcMain.handle('music:search', async (_event, params: { query: string }) => {
    try {
      const songInfo = await searchSong(params.query)
      logger.info(`音乐搜索成功: ${songInfo.name} - ${songInfo.artist}`)
      return { success: true, data: songInfo }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : '未知错误'
      logger.error('音乐搜索失败', errMsg)
      return { success: false, error: errMsg }
    }
  })
}
