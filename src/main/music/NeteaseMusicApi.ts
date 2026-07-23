// src/main/music/NeteaseMusicApi.ts
// 网易云音乐 API — 获取歌曲播放链接

import { logger } from '../utils/logger'
import * as https from 'https'
import * as http from 'http'

// 网易云音乐 API 基础 URL（本地或公共）
const NETEASE_API_BASE = 'https://music.163.com'

/**
 * 获取歌曲播放链接
 */
export async function getSongUrl(songId: string, quality: string = 'exhigh'): Promise<string | null> {
  try {
    // 使用网易云音乐 API 获取歌曲链接
    // br 参数: standard=128k, higher=192k, exhigh=320k, lossless=FLAC
    const brMap: Record<string, number> = {
      '128k': 128000,
      '192k': 192000,
      '320k': 320000,
      'flac': 999000
    }
    const br = brMap[quality] || 320000

    const url = `${NETEASE_API_BASE}/api/song/enhance/player/url?id=${songId}&ids=[${songId}]&br=${br}`
    const data = await httpGetJSON(url, {
      'Referer': 'https://music.163.com',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }) as { data?: Array<{ url?: string; type?: string }> }

    const songData = data?.data?.[0]
    if (songData?.url) {
      logger.info(`获取歌曲链接成功: ${songId}, type=${songData.type}`)
      return songData.url
    }

    logger.warn(`获取歌曲链接失败: ${songId}, 无可用链接`)
    return null
  } catch (error) {
    logger.error('获取歌曲链接失败:', error)
    return null
  }
}

/**
 * 获取歌词
 */
export async function getLyric(songId: string): Promise<string> {
  try {
    const url = `${NETEASE_API_BASE}/api/song/lyric?id=${songId}&lv=1`
    const data = await httpGetJSON(url, {
      'Referer': 'https://music.163.com'
    }) as { lrc?: { lyric?: string } }
    return data?.lrc?.lyric || ''
  } catch {
    return ''
  }
}

/**
 * 获取歌曲详情（包含封面图片）
 */
export async function getSongDetail(songId: string): Promise<{ picUrl?: string; album?: string } | null> {
  try {
    const url = `${NETEASE_API_BASE}/api/song/detail?ids=[${songId}]`
    const data = await httpGetJSON(url, {
      'Referer': 'https://music.163.com'
    }) as { songs?: Array<{ al?: { picUrl?: string; name?: string } }> }
    const song = data?.songs?.[0]
    if (song?.al) {
      return {
        picUrl: song.al.picUrl,
        album: song.al.name
      }
    }
    return null
  } catch {
    return null
  }
}

// HTTP GET 并返回 JSON
function httpGetJSON(url: string, headers?: Record<string, string>): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http
    const req = client.get(url, {
      headers: headers || {},
      timeout: 15000
    }, (res) => {
      // 处理重定向
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return httpGetJSON(res.headers.location, headers).then(resolve).catch(reject)
      }
      let data = ''
      res.on('data', (chunk: Buffer) => { data += chunk.toString() })
      res.on('end', () => {
        try {
          resolve(JSON.parse(data))
        } catch {
          reject(new Error('Invalid JSON response'))
        }
      })
    })
    req.on('error', reject)
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')) })
  })
}
