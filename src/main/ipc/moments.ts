// src/main/ipc/moments.ts
// 朋友圈 IPC 处理器

import { ipcMain } from 'electron'
import { MomentsManager, type Moment } from '../social/MomentsManager'
import { MomentsGenerator } from '../social/MomentsGenerator'
import { logger } from '../utils/logger'

const managers: Map<string, MomentsManager> = new Map()
const generator = new MomentsGenerator()

const getManager = (characterId: string): MomentsManager => {
  if (!managers.has(characterId)) {
    managers.set(characterId, new MomentsManager(characterId))
  }
  return managers.get(characterId)!
}

export const registerMomentsIPC = (): void => {
  // 获取朋友圈列表
  ipcMain.handle('moments:list', (_event, params: { characterId: string }) => {
    return getManager(params.characterId).getAll()
  })

  // 发布朋友圈
  ipcMain.handle(
    'moments:publish',
    (_event, params: { characterId: string; content: string; images?: string[]; mood?: string }) => {
      try {
        return getManager(params.characterId).publish(
          params.content,
          params.images,
          params.mood
        )
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : '未知错误'
        logger.error(`朋友圈发布失败: ${errMsg}`)
        return { error: errMsg }
      }
    }
  )

  // 点赞
  ipcMain.handle(
    'moments:like',
    (_event, params: { characterId: string; momentId: string; userId: string }) => {
      getManager(params.characterId).like(params.momentId, params.userId)
      return { success: true }
    }
  )

  // 取消点赞
  ipcMain.handle(
    'moments:unlike',
    (_event, params: { characterId: string; momentId: string; userId: string }) => {
      getManager(params.characterId).unlike(params.momentId, params.userId)
      return { success: true }
    }
  )

  // 评论
  ipcMain.handle(
    'moments:comment',
    (_event, params: { characterId: string; momentId: string; author: string; content: string }) => {
      try {
        return getManager(params.characterId).comment(
          params.momentId,
          params.author,
          params.content
        )
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : '未知错误'
        return { error: errMsg }
      }
    }
  )

  // AI 生成朋友圈
  ipcMain.handle(
    'moments:generate',
    (_event, params: { characterId: string; type?: 'daily' | 'emotional'; emotion?: string }) => {
      if (params.type === 'emotional' && params.emotion) {
        return generator.generateEmotional(params.emotion)
      }
      return generator.generateDaily()
    }
  )

  // 删除朋友圈
  ipcMain.handle(
    'moments:delete',
    (_event, params: { characterId: string; momentId: string }) => {
      getManager(params.characterId).delete(params.momentId)
      return { success: true }
    }
  )
}
