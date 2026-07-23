// src/main/music/MusicInfoService.ts
// 歌曲信息服务 — 从网易云API获取详情/歌词/评论

import { logger } from '../utils/logger'
import * as https from 'https'
import * as http from 'http'
import type { SongDetail, LyricLine, HotComment, FullSongInfo } from './MusicState'

export class MusicInfoService {
  private cache: Map<string, FullSongInfo> = new Map()

  async getFullInfo(songId: string): Promise<FullSongInfo> {
    if (this.cache.has(songId)) {
      return this.cache.get(songId)!
    }

    logger.info(`获取歌曲信息: ${songId}`)

    const [detail, lyrics, hotComments] = await Promise.all([
      this.fetchDetail(songId),
      this.fetchLyrics(songId),
      this.fetchHotComments(songId, 5)
    ])

    logger.info(`歌曲信息获取完成: ${detail.name}, 歌词${lyrics.length}行, 评论${hotComments.length}条`)

    const result: FullSongInfo = { detail, lyrics, hotComments }
    this.cache.set(songId, result)
    return result
  }

  private async fetchDetail(songId: string): Promise<SongDetail> {
    try {
      const data = await httpGetJSON(
        `https://music.163.com/api/song/detail?ids=[${songId}]`,
        { 'Referer': 'https://music.163.com' }
      ) as { songs?: Array<{ id: number; name: string; artists: Array<{ name: string }>; album: { name: string; picUrl: string; publishTime?: number }; duration: number }> }

      const song = data.songs?.[0]
      if (!song) {
        return { id: songId, name: '未知歌曲', artist: '未知', album: '', albumCover: '', duration: 0, releaseDate: '' }
      }

      return {
        id: songId,
        name: song.name,
        artist: song.artists.map((a) => a.name).join(' / '),
        album: song.album.name,
        albumCover: song.album.picUrl,
        duration: song.duration,
        releaseDate: song.album.publishTime ? new Date(song.album.publishTime).getFullYear().toString() : ''
      }
    } catch (error) {
      logger.error('获取歌曲详情失败:', error)
      return { id: songId, name: '未知歌曲', artist: '未知', album: '', albumCover: '', duration: 0, releaseDate: '' }
    }
  }

  private async fetchLyrics(songId: string): Promise<LyricLine[]> {
    try {
      const data = await httpGetJSON(
        `https://music.163.com/api/song/lyric?os=linux&id=${songId}&lv=1&tv=1`,
        { 'Referer': 'https://music.163.com' }
      ) as { lrc?: { lyric?: string }; tlyric?: { lyric?: string } }

      const lrc: string = data.lrc?.lyric || ''
      const trans: string = data.tlyric?.lyric || ''

      // 解析翻译歌词
      const transMap = new Map<string, string>()
      trans.split('\n').forEach((line) => {
        const match = line.match(/\[(\d+:\d+\.\d+)\](.*)/)
        if (match && match[2].trim()) {
          transMap.set(match[1], match[2].trim())
        }
      })

      // 解析原文歌词
      const lines: LyricLine[] = []
      lrc.split('\n').forEach((line) => {
        const match = line.match(/\[(\d+:\d+\.\d+)\](.*)/)
        if (match && match[2].trim()) {
          const [min, sec] = match[1].split(':')
          const time = parseInt(min) * 60 * 1000 + parseFloat(sec) * 1000
          lines.push({
            time,
            text: match[2].trim(),
            translation: transMap.get(match[1])
          })
        }
      })

      return lines.sort((a, b) => a.time - b.time)
    } catch (error) {
      logger.error('获取歌词失败:', error)
      return []
    }
  }

  private async fetchHotComments(songId: string, limit: number): Promise<HotComment[]> {
    try {
      const data = await httpGetJSON(
        `https://music.163.com/api/v1/resource/comments/R_SO_4_${songId}?limit=${limit}&offset=0`,
        { 'Referer': 'https://music.163.com' }
      ) as { hotComments?: Array<{ user: { nickname: string }; content: string; likedCount: number }> }

      return (data.hotComments || []).map((c) => ({
        user: c.user.nickname,
        content: c.content,
        likedCount: c.likedCount
      }))
    } catch (error) {
      logger.error('获取热门评论失败:', error)
      return []
    }
  }

  clearCache(): void {
    this.cache.clear()
  }
}

function httpGetJSON(url: string, headers?: Record<string, string>): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http
    const req = client.get(url, {
      headers: headers || {},
      timeout: 15000
    }, (res) => {
      let data = ''
      res.on('data', (chunk: Buffer) => { data += chunk.toString() })
      res.on('end', () => {
        try {
          resolve(JSON.parse(data))
        } catch {
          reject(new Error('Invalid JSON'))
        }
      })
    })
    req.on('error', reject)
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')) })
  })
}
