// src/main/music/LxMusicApi.ts
// 连接 LX Music 本地 API 获取播放状态

import { logger } from '../utils/logger'
import * as http from 'http'

const LX_API_BASE = 'http://127.0.0.1:23330'

/**
 * LX Music 播放状态
 */
export interface LxPlayerStatus {
  status: 'playing' | 'paused' | 'error' | 'stoped'
  name: string
  singer: string
  albumName: string
  duration: number
  progress: number
  playbackRate: number
  picUrl: string
  lyricLineText: string
}

/**
 * 检查 LX Music 是否运行
 */
export async function checkLxMusic(): Promise<boolean> {
  try {
    const data = await httpGet(`${LX_API_BASE}/status`) as Record<string, unknown>
    return !!data?.status
  } catch {
    return false
  }
}

/**
 * 获取当前播放状态
 */
export async function getPlayerStatus(): Promise<LxPlayerStatus | null> {
  try {
    const data = await httpGet(`${LX_API_BASE}/status`) as Record<string, unknown>
    if (!data?.status) return null
    return data as unknown as LxPlayerStatus
  } catch {
    return null
  }
}

/**
 * 获取当前歌词
 */
export async function getLyric(): Promise<string> {
  try {
    return await httpGet(`${LX_API_BASE}/lyric`) as string
  } catch {
    return ''
  }
}

/**
 * 播放
 */
export async function play(): Promise<void> {
  try {
    await httpGet(`${LX_API_BASE}/play`)
  } catch { /* ignore */ }
}

/**
 * 暂停
 */
export async function pause(): Promise<void> {
  try {
    await httpGet(`${LX_API_BASE}/pause`)
  } catch { /* ignore */ }
}

/**
 * 下一曲
 */
export async function skipNext(): Promise<void> {
  try {
    await httpGet(`${LX_API_BASE}/skip-next`)
  } catch { /* ignore */ }
}

/**
 * 上一曲
 */
export async function skipPrev(): Promise<void> {
  try {
    await httpGet(`${LX_API_BASE}/skip-prev`)
  } catch { /* ignore */ }
}

/**
 * HTTP GET 请求
 */
function httpGet(url: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const req = http.get(url, { timeout: 3000 }, (res) => {
      let data = ''
      res.on('data', (chunk: Buffer) => { data += chunk.toString() })
      res.on('end', () => {
        try {
          resolve(JSON.parse(data))
        } catch {
          resolve(data)
        }
      })
    })
    req.on('error', reject)
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')) })
  })
}
