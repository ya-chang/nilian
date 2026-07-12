// src/main/ipc/knowledge.ts
// 知识库 IPC 处理器 — 人设编辑 + 知识文件读取

import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '../../shared/ipc-channels'
import { KnowledgeManager } from '../knowledge/KnowledgeManager'
import { logger } from '../utils/logger'

const managers = new Map<string, KnowledgeManager>()

const getManager = (characterId: string): KnowledgeManager => {
  if (!managers.has(characterId)) {
    managers.set(characterId, new KnowledgeManager(characterId))
  }
  return managers.get(characterId)!
}

export const registerKnowledgeIPC = (): void => {
  // 读取人设档案
  ipcMain.handle(
    IPC_CHANNELS.KNOWLEDGE_GET_PERSONA,
    (_event, params: { characterId: string }) => {
      try {
        const manager = getManager(params.characterId)
        return { success: true, data: manager.readPersona() }
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : '未知错误'
        return { success: false, error: errMsg }
      }
    }
  )

  // 保存人设档案（用户手动编辑）
  ipcMain.handle(
    IPC_CHANNELS.KNOWLEDGE_SET_PERSONA,
    (_event, params: { characterId: string; content: string }) => {
      try {
        const manager = getManager(params.characterId)
        manager.writePersona(params.content)
        manager.invalidateCache()
        logger.info(`人设档案已保存: ${params.characterId}`)
        return { success: true }
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : '未知错误'
        return { success: false, error: errMsg }
      }
    }
  )

  // 读取全部知识文件
  ipcMain.handle(
    IPC_CHANNELS.KNOWLEDGE_GET_ALL,
    (_event, params: { characterId: string }) => {
      try {
        const manager = getManager(params.characterId)
        const data = manager.readAll()
        return { success: true, data }
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : '未知错误'
        return { success: false, error: errMsg }
      }
    }
  )
}
