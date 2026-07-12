// src/renderer/hooks/useChat.ts
// 聊天 Hook — 支持碎片式交付 + 引用 + 实时更新列表

import { useEffect, useRef } from 'react'
import { useChatStore } from '../stores/chatStore'
import { useChatListStore } from '../stores/chatListStore'
import { useChatSessionStore } from '../stores/chatSessionStore'
import { useUserStore } from '../stores/userStore'
import { useMusicStore } from '../stores/musicStore'
import type { Message } from '../stores/chatStore'

// 默认角色配置 — DeepSeek 官方模型
const DEFAULT_CHAR = {
  id: 'default',
  provider: 'deepseek',
  model: 'deepseek-v4-flash'
}

export const useChat = (): {
  messages: Message[]
  isLoading: boolean
  sendMessage: (content: string, quoteMessageId?: string) => Promise<void>
  clearMessages: () => void
} => {
  const {
    messages,
    isLoading,
    addMessage,
    updateMessage,
    setLoading,
    clearMessages
  } = useChatStore()

  const { updateLastMessage } = useChatListStore()
  const assistantIdRef = useRef<string | null>(null)

  // 监听碎片事件
  useEffect(() => {
    if (!window.electronAPI) return

    const handleChunk = (...args: unknown[]): void => {
      const data = args[0] as {
        chunkId: string
        content: string
        index: number
        total: number
        isLast: boolean
      }
      const id = assistantIdRef.current
      if (!id) return

      const current = useChatStore.getState().messages.find((m) => m.id === id)
      const existingContent = current?.content ?? ''

      updateMessage(id, {
        content: existingContent + data.content,
        status: data.isLast ? 'sent' : 'sending'
      })

      // 最后一个碎片时，更新聊天列表的 lastMessage
      if (data.isLast) {
        const state = useChatStore.getState()
        const charId = state.currentCharacterId || 'default'
        const newContent = existingContent + data.content
        updateLastMessage(charId, newContent.length > 20 ? newContent.slice(0, 20) + '...' : newContent)
      }
    }

    window.electronAPI.on('chat:chunk', handleChunk)

    return () => {
      window.electronAPI?.off('chat:chunk', handleChunk)
    }
  }, [updateMessage, updateLastMessage])

  const sendMessage = async (content: string, quoteMessageId?: string): Promise<void> => {
    if (!content.trim() || isLoading) return

    const charId = useChatStore.getState().currentCharacterId || DEFAULT_CHAR.id

    // 从 localStorage 读取角色的 API 配置
    let provider = DEFAULT_CHAR.provider
    let model = DEFAULT_CHAR.model
    let apiKey = ''
    let baseUrl = ''

    // 优先从当前会话获取角色 ID
    const sessionId = useChatSessionStore.getState().currentSession?.id
    const actualCharId = sessionId || charId

    try {
      const charData = localStorage.getItem(`char-data-${actualCharId}`)
      if (charData) {
        const parsed = JSON.parse(charData)
        if (parsed.provider) provider = parsed.provider
        if (parsed.model) model = parsed.model
        if (parsed.apiKey) apiKey = parsed.apiKey
        if (parsed.baseUrl) baseUrl = parsed.baseUrl
      }
    } catch { /* ignore */ }

    // 更新聊天列表的 lastMessage 为用户消息
    updateLastMessage(charId, content.length > 20 ? content.slice(0, 20) + '...' : content)

    // 构建引用元数据 — 直接从 messagesByCharacter 查找，确保切换角色后也能找到
    const quoteMeta: Record<string, unknown> | undefined = quoteMessageId
      ? (() => {
          const state = useChatStore.getState()
          const charId = state.currentCharacterId || 'default'
          const charMessages = state.messagesByCharacter[charId] || []
          const quotedMsg = charMessages.find((m) => m.id === quoteMessageId)
          return quotedMsg && quotedMsg.content
            ? {
                quotedMessageId: quotedMsg.id,
                quotedContent: quotedMsg.content,
                quotedRole: quotedMsg.role
              }
            : undefined
        })()
      : undefined

    addMessage({
      role: 'user',
      content,
      type: 'text',
      metadata: quoteMeta
    })

    const assistantId = addMessage({
      role: 'assistant',
      content: '',
      type: 'text'
    })
    assistantIdRef.current = assistantId

    setLoading(true)

    try {
      const history = useChatStore.getState().messages.slice(-20).map((m) => ({
        role: m.role as 'system' | 'user' | 'assistant',
        content: m.content
      }))

      // 读取角色的人设
      let persona = ''
      try {
        const charData = localStorage.getItem(`char-data-${charId}`)
        if (charData) {
          const parsed = JSON.parse(charData)
          if (parsed.persona) persona = parsed.persona
        }
      } catch { /* ignore */ }

      const result = await window.electronAPI?.invoke('chat:send', {
        content,
        characterId: charId,
        provider,
        model,
        apiKey,
        baseUrl,
        history,
        persona,
        quoteContent: quoteMeta?.quotedContent as string | undefined,
        userName: useUserStore.getState().name || undefined,
        currentSong: useMusicStore.getState().currentSong || undefined
      })

      const response = result as {
        success: boolean
        data?: { content: string; model: string }
        error?: string
      }

      if (!response?.success) {
        updateMessage(assistantId, {
          content: '抱歉，消息发送失败，请重试',
          status: 'error',
          error: response?.error
        })
        updateLastMessage(charId, '消息发送失败')
      }
    } catch (error) {
      updateMessage(assistantId, {
        content: '网络连接异常，请检查网络后重试',
        status: 'error',
        error: error instanceof Error ? error.message : '未知错误'
      })
      updateLastMessage(charId, '网络连接异常')
    } finally {
      setLoading(false)
      assistantIdRef.current = null
    }
  }

  return { messages, isLoading, sendMessage, clearMessages }
}
