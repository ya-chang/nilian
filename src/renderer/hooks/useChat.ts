// src/renderer/hooks/useChat.ts
// 聊天 Hook — 直接调用 AI API

import { useRef } from 'react'
import { useChatStore } from '../stores/chatStore'
import { useChatListStore } from '../stores/chatListStore'
import { useChatSessionStore } from '../stores/chatSessionStore'
import { useUserStore } from '../stores/userStore'
import { CharacterService } from '../services/CharacterService'
import { AIService } from '../services/AIService'
import type { Message } from '../stores/chatStore'

const deduplicateText = (text: string): string => {
  if (!text || text.length < 4) return text
  let result = text
  result = result.replace(/(.{2,80}?)\s+\1/g, '$1')
  result = result.replace(/(.{2,80}?)([。！？.!?\~～…，,、；;：:"""''「」『』【】《》〈〉（）()〔〕\[\]{}])\1\2/g, '$1$2')
  result = result.replace(/(.{2,40}?)\1+/g, '$1')
  if (result.length < text.length) return deduplicateText(result)
  return result
}

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

  const sendMessage = async (content: string, quoteMessageId?: string): Promise<void> => {
    if (!content.trim() || isLoading) return

    const charId = useChatSessionStore.getState().currentSession?.id || useChatStore.getState().currentCharacterId || DEFAULT_CHAR.id

    // 获取角色配置
    const charConfig = CharacterService.get(charId)
    const provider = charConfig?.provider || DEFAULT_CHAR.provider
    const model = charConfig?.model || DEFAULT_CHAR.model
    const apiKey = charConfig?.apiKey || ''
    const baseUrl = charConfig?.baseUrl || ''
    const persona = charConfig?.persona || ''

    updateLastMessage(charId, content.length > 20 ? content.slice(0, 20) + '...' : content)

    // 构建引用
    const quoteMeta: Record<string, unknown> | undefined = quoteMessageId
      ? (() => {
          const state = useChatStore.getState()
          const charMessages = state.messagesByCharacter[charId] || []
          const quotedMsg = charMessages.find((m) => m.id === quoteMessageId)
          return quotedMsg && quotedMsg.content
            ? { quotedMessageId: quotedMsg.id, quotedContent: quotedMsg.content, quotedRole: quotedMsg.role }
            : undefined
        })()
      : undefined

    const rawHistory = useChatStore.getState().messages.slice(-20)
    const history = rawHistory.map((m) => ({
      role: m.role as 'system' | 'user' | 'assistant',
      content: m.role === 'assistant' ? deduplicateText(m.content) : m.content
    }))

    addMessage({ role: 'user', content, type: 'text', metadata: quoteMeta })

    const assistantId = addMessage({ role: 'assistant', content: '', type: 'text' })
    assistantIdRef.current = assistantId
    setLoading(true)

    try {
      const response = await AIService.chat({
        provider,
        model,
        apiKey,
        baseUrl,
        messages: history,
        persona,
        userName: useUserStore.getState().name || undefined,
        quoteContent: quoteMeta?.quotedContent as string | undefined,
        temperature: charConfig?.temperature,
        maxTokens: charConfig?.maxTokens
      })

      if (response.success && response.data) {
        const reply = deduplicateText(response.data.content)
        updateMessage(assistantId, { content: reply, status: 'sent' })
        updateLastMessage(charId, reply.length > 20 ? reply.slice(0, 20) + '...' : reply)
      } else {
        updateMessage(assistantId, {
          content: '抱歉，消息发送失败，请重试',
          status: 'error',
          error: response.error
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
