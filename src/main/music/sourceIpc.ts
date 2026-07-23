// src/main/music/sourceIpc.ts
// 音源 IPC 通信注册

import { ipcMain, shell, BrowserWindow } from 'electron'
import { MusicSourceManager } from './MusicSourceManager'
import { getSongUrl, getLyric, getSongDetail } from './NeteaseMusicApi'
import { logger } from '../utils/logger'
import * as https from 'https'
import * as http from 'http'

const SOURCE_URL_KEY = 'musicSourceUrl'

export function registerSourceIPC(manager: MusicSourceManager): void {
  // 加载音源
  ipcMain.handle('music:loadSource', async (_event, url?: string) => {
    try {
      const sourceUrl = url || process.env.LX_MUSIC_SOURCE_URL || ''
      if (!sourceUrl) {
        return { success: false, error: '请先输入音源URL' }
      }

      logger.info(`开始加载音源: ${sourceUrl}`)
      const success = await manager.loadSource(sourceUrl)
      if (success) {
        // 保存URL到环境变量（持久化）
        process.env[SOURCE_URL_KEY] = sourceUrl
        logger.info(`音源加载成功`)
        return {
          success: true,
          data: manager.getSourceInfo(),
          sources: manager.getSupportedSources()
        }
      }
      return {
        success: false,
        error: '音源脚本执行失败。可能原因：1)脚本格式不兼容 2)网络无法访问音源API服务器 3)脚本初始化超时'
      }
    } catch (error) {
      logger.error('加载音源异常', error)
      return { success: false, error: String(error) }
    }
  })

  // 从缓存加载音源
  ipcMain.handle('music:loadSourceFromCache', async () => {
    try {
      const savedUrl = process.env[SOURCE_URL_KEY] || ''
      if (!savedUrl) {
        return { success: false, error: '未配置音源URL' }
      }
      const success = await manager.loadSource(savedUrl)
      return { success }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  // 获取音乐播放URL
  ipcMain.handle('music:getMusicUrl', async (_event, params: {
    songmid: string
    name: string
    source?: string
  }) => {
    try {
      const url = await manager.getMusicUrl(params.songmid, params.name, params.source)
      return { success: true, url }
    } catch (error) {
      logger.error('获取音乐URL失败', error)
      return { success: false, error: String(error) }
    }
  })

  // 获取歌词
  ipcMain.handle('music:getSourceLyric', async (_event, params: {
    songmid: string
    name: string
  }) => {
    try {
      const lyric = await manager.getLyric(params.songmid, params.name)
      return { success: true, lyric }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  // 获取封面
  ipcMain.handle('music:getSourcePic', async (_event, params: {
    songmid: string
    name: string
  }) => {
    try {
      const pic = await manager.getPic(params.songmid, params.name)
      return { success: true, pic }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  // 检查音源状态
  ipcMain.handle('music:sourceStatus', () => {
    return {
      loaded: manager.isLoaded(),
      info: manager.getSourceInfo(),
      sources: manager.getSupportedSources()
    }
  })

  // 搜索歌曲（通过主进程调用，避免CORS问题）
  ipcMain.handle('music:search', async (_event, params: { keyword: string; limit?: number }) => {
    try {
      const { keyword, limit = 10 } = params
      if (!keyword.trim()) return { success: true, songs: [] }

      const url = `https://music.163.com/api/search/get?s=${encodeURIComponent(keyword)}&type=1&limit=${limit}`
      const data = await httpGetJSON(url, { 'Referer': 'https://music.163.com' })
      const songs = (data as { result?: { songs?: unknown[] } })?.result?.songs || []
      return { success: true, songs }
    } catch (error) {
      logger.error('搜索歌曲失败', error)
      return { success: false, error: String(error) }
    }
  })

  // 通过 LX Music Scheme URL 播放歌曲
  ipcMain.handle('music:playViaLxMusic', async (_event, params: {
    name: string
    singer: string
    source?: string
    songmid: string
    interval?: string
  }) => {
    try {
      const { name, singer, source = 'wy', songmid, interval } = params
      const schemeData = {
        name,
        singer: singer || '',
        source,
        songmid,
        types: [{ type: '320k' }],
        ...(interval ? { interval } : {})
      }
      const schemeUrl = `lxmusic://music/play?data=${encodeURIComponent(JSON.stringify(schemeData))}`
      logger.info(`打开 LX Music: ${schemeUrl}`)
      await shell.openExternal(schemeUrl)
      return { success: true }
    } catch (error) {
      logger.error('打开 LX Music 失败', error)
      return { success: false, error: String(error) }
    }
  })

  // 直接通过网易云API获取歌曲播放链接
  ipcMain.handle('music:getSongUrlDirect', async (_event, params: {
    songId: string
    quality?: string
  }) => {
    try {
      const { songId, quality = 'exhigh' } = params
      logger.info(`直接获取歌曲链接: songId=${songId}, quality=${quality}`)
      const url = await getSongUrl(songId, quality)
      if (url) {
        return { success: true, url }
      }
      return { success: false, error: '无法获取播放链接（可能需要VIP或地区限制）' }
    } catch (error) {
      logger.error('获取歌曲链接失败', error)
      return { success: false, error: String(error) }
    }
  })

  // 获取歌词
  ipcMain.handle('music:getLyric', async (_event, params: { songId: string }) => {
    try {
      const lyric = await getLyric(params.songId)
      return { success: true, lyric }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  // 获取歌曲详情（封面等）
  ipcMain.handle('music:getSongDetail', async (_event, params: { songId: string }) => {
    try {
      const detail = await getSongDetail(params.songId)
      return { success: true, ...detail }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })
}

// 音频代理 — 通过主进程获取音频流，避免CORS和请求头问题
export function registerAudioProxy(): void {
  ipcMain.handle('music:fetchAudio', async (_event, url: string) => {
    if (!url) return { success: false, error: '无URL' }

    try {
      logger.info(`获取音频: ${url.substring(0, 100)}`)
      const client = url.startsWith('https') ? https : http

      return new Promise((resolve) => {
        const req = client.get(url, {
          headers: {
            'Referer': 'https://music.163.com',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          timeout: 30000
        }, (res) => {
          // 处理重定向
          if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            logger.info(`音频重定向: ${res.headers.location.substring(0, 100)}`)
            // 递归获取重定向后的音频
            ipcMain.emit('music:fetchAudio', _event, res.headers.location)
            return
          }

          if (res.statusCode !== 200) {
            logger.error(`音频获取失败: HTTP ${res.statusCode}`)
            resolve({ success: false, error: `HTTP ${res.statusCode}` })
            return
          }

          const contentType = res.headers['content-type'] || 'audio/mpeg'
          const chunks: Buffer[] = []

          res.on('data', (chunk: Buffer) => {
            chunks.push(chunk)
          })

          res.on('end', () => {
            const buffer = Buffer.concat(chunks)
            const base64 = buffer.toString('base64')
            logger.info(`音频获取成功: ${buffer.length} bytes, type=${contentType}`)
            resolve({ success: true, base64, contentType })
          })

          res.on('error', (err) => {
            logger.error('音频流错误:', err)
            resolve({ success: false, error: err.message })
          })
        })

        req.on('error', (err) => {
          logger.error('音频请求错误:', err)
          resolve({ success: false, error: err.message })
        })

        req.on('timeout', () => {
          req.destroy()
          resolve({ success: false, error: '请求超时' })
        })
      })
    } catch (error) {
      logger.error('获取音频失败:', error)
      return { success: false, error: String(error) }
    }
  })
}

// HTTP GET 并返回 JSON
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
          reject(new Error('Invalid JSON response'))
        }
      })
    })
    req.on('error', reject)
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')) })
  })
}
