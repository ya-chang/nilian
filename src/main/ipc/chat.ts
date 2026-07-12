// src/main/ipc/chat.ts
// 聊天 IPC 处理器 — 流式输出 + 消息持久化到文件

import { ipcMain, BrowserWindow } from 'electron'
import { IPC_CHANNELS } from '../../shared/ipc-channels'
import { ChatEngine } from '../engine/ChatEngine'
import { ResponseSplitter } from '../engine/ResponseSplitter'
import { IntentClassifier } from '../engine/IntentClassifier'
import { Humanizer } from '../engine/Humanizer'
import { logger } from '../utils/logger'
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, unlinkSync } from 'fs'
import { join } from 'path'
import { app } from 'electron'

interface IpcMessage {
  content: string
  characterId: string
  history: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
  persona?: string
  provider?: string
  model?: string
  apiKey?: string
  baseUrl?: string
  quoteContent?: string
  userName?: string
  currentSong?: {
    name: string
    artist: string
    album: string
    lyricsSnippet: string
    description: string
  }
}

// 消息存储目录
const getMessagesDir = (): string => {
  const base = app.isPackaged ? app.getPath('userData') : join(process.cwd(), 'data')
  const dir = join(base, 'messages')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  return dir
}

// 保存消息到文件
const saveMessagesToFile = (characterId: string, messages: unknown[]): void => {
  const dir = getMessagesDir()
  const filePath = join(dir, `${characterId}.json`)
  writeFileSync(filePath, JSON.stringify(messages, null, 2), 'utf-8')
}

// 从文件加载消息
const loadMessagesFromFile = (characterId: string): unknown[] => {
  const dir = getMessagesDir()
  const filePath = join(dir, `${characterId}.json`)
  if (!existsSync(filePath)) return []
  try {
    return JSON.parse(readFileSync(filePath, 'utf-8'))
  } catch {
    return []
  }
}

const engine = new ChatEngine()
const splitter = new ResponseSplitter()
const intentClassifier = new IntentClassifier()
const humanizer = new Humanizer()

export const registerChatIPC = (): void => {
  // 加载消息
  ipcMain.handle('chat:loadMessages', (_event, params: { characterId: string }) => {
    try {
      const messages = loadMessagesFromFile(params.characterId)
      return { success: true, data: messages }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : '未知错误'
      return { success: false, error: errMsg }
    }
  })

  // 保存消息
  ipcMain.handle('chat:saveMessages', (_event, params: { characterId: string; messages: unknown[] }) => {
    try {
      saveMessagesToFile(params.characterId, params.messages)
      return { success: true }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : '未知错误'
      return { success: false, error: errMsg }
    }
  })

  // 删除角色的所有消息
  ipcMain.handle('chat:deleteMessages', (_event, params: { characterId: string }) => {
    try {
      const dir = getMessagesDir()
      const filePath = join(dir, `${params.characterId}.json`)
      if (existsSync(filePath)) unlinkSync(filePath)
      return { success: true }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : '未知错误'
      return { success: false, error: errMsg }
    }
  })
  ipcMain.handle(
    IPC_CHANNELS.CHAT_SEND,
    async (event, params: IpcMessage) => {
      const msgId = `msg_${Date.now()}`
      const senderWindow = BrowserWindow.fromWebContents(event.sender)

      logger.info(`收到消息: id=${msgId}`)

      try {
        // 意图预判
        const intent = intentClassifier.classify(params.content)

        if (intent.action === 'skip') {
          return { success: true, data: { id: msgId, content: '', chunks: [] } }
        }

        if (intent.action === 'template_reply' && intent.template) {
          await deliverChunks(senderWindow, msgId, params.characterId, splitter.split(intent.template))
          return {
            success: true,
            data: { id: msgId, content: intent.template, chunks: [intent.template] }
          }
        }

        // 流式调用模型 — 逐字推送到前端
        const fullContent = await streamToChunks(
          senderWindow, msgId, params.characterId, params, engine
        )

        // 人味儿处理
        const humanized = humanizer.process(fullContent)

        // 人味儿修改了内容时推送更新
        if (humanized.content !== fullContent) {
          senderWindow?.webContents.send(IPC_CHANNELS.CHAT_CHUNK, {
            chunkId: msgId,
            content: humanized.content,
            index: 0,
            total: 1,
            isLast: true,
            replace: true
          })
        }

        logger.info(`流式输出完成`)
        return {
          success: true,
          data: { id: msgId, content: humanized.content, chunks: [humanized.content] }
        }
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : '未知错误'
        logger.error(`消息处理失败: id=${msgId}`, errMsg)
        return { success: false, error: errMsg }
      }
    }
  )
}

// 流式输出 — 逐字/逐句推送到前端
const streamToChunks = async (
  senderWindow: BrowserWindow | null,
  msgId: string,
  characterId: string,
  params: IpcMessage,
  chatEngine: ChatEngine
): Promise<string> => {
  let fullContent = ''
  let sentenceBuffer = ''

  senderWindow?.webContents.send(IPC_CHANNELS.CHAT_TYPING, {
    characterId,
    typing: true
  })

  try {
    for await (const chunk of chatEngine.sendMessageStream({
      content: params.content,
      characterId: params.characterId,
      history: params.history,
      persona: params.persona,
      provider: params.provider,
      model: params.model,
      apiKey: params.apiKey,
      baseUrl: params.baseUrl,
      quoteContent: params.quoteContent,
      userName: params.userName,
      currentSong: params.currentSong
    })) {
      fullContent += chunk
      sentenceBuffer += chunk

      // 按标点自然断句推送
      const splitPoint = findSplitPoint(sentenceBuffer)
      if (splitPoint > 0) {
        const toSend = sentenceBuffer.slice(0, splitPoint)
        sentenceBuffer = sentenceBuffer.slice(splitPoint)

        senderWindow?.webContents.send(IPC_CHANNELS.CHAT_CHUNK, {
          chunkId: msgId,
          content: toSend,
          index: 0,
          total: 1,
          isLast: false
        })

        // 句子间延迟 100-300ms
        await sleep(100 + Math.random() * 200)
      }
    }

    // 推送剩余内容
    if (sentenceBuffer) {
      senderWindow?.webContents.send(IPC_CHANNELS.CHAT_CHUNK, {
        chunkId: msgId,
        content: sentenceBuffer,
        index: 0,
        total: 1,
        isLast: true
      })
    }
  } finally {
    senderWindow?.webContents.send(IPC_CHANNELS.CHAT_TYPING, {
      characterId,
      typing: false
    })
  }

  return fullContent
}

const findSplitPoint = (text: string): number => {
  const splitChars = ['。', '！', '？', '!', '?', '，', ',', '、', '\n']
  for (const char of splitChars) {
    const idx = text.lastIndexOf(char)
    if (idx > 0 && idx < text.length - 1) {
      return idx + 1
    }
  }
  // 超过30字也拆
  if (text.length > 30) return 30
  return 0
}

const deliverChunks = async (
  senderWindow: BrowserWindow | null,
  msgId: string,
  characterId: string,
  chunks: string[]
): Promise<void> => {
  for (let i = 0; i < chunks.length; i++) {
    senderWindow?.webContents.send(IPC_CHANNELS.CHAT_TYPING, {
      characterId,
      typing: true
    })

    await sleep(100 + Math.random() * 200)

    senderWindow?.webContents.send(IPC_CHANNELS.CHAT_CHUNK, {
      chunkId: `${msgId}_${i}`,
      content: chunks[i],
      index: i,
      total: chunks.length,
      isLast: i === chunks.length - 1
    })
  }

  senderWindow?.webContents.send(IPC_CHANNELS.CHAT_TYPING, {
    characterId,
    typing: false
  })
}

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms))
