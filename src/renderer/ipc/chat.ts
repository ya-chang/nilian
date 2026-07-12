// src/renderer/ipc/chat.ts
// 渲染进程聊天 IPC — 调用主进程处理消息

import { IPC_CHANNELS } from '@shared/ipc-channels'
import type { Message } from '@shared/types'

interface SendMessageParams {
  content: string
  characterId: string
  history: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
}

interface SendResponse {
  success: boolean
  data?: {
    id: string
    content: string
    model: string
    usage: {
      promptTokens: number
      completionTokens: number
      totalTokens: number
    }
  }
  error?: string
}

export const sendMessage = async (
  params: SendMessageParams
): Promise<SendResponse> => {
  if (!window.electronAPI) {
    return { success: false, error: 'Electron API 不可用' }
  }

  try {
    const result = await window.electronAPI.invoke(
      IPC_CHANNELS.CHAT_SEND,
      params
    )
    return result as SendResponse
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error)
    return { success: false, error: errMsg }
  }
}
