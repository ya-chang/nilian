// src/renderer/components/layout/ChatWindow.tsx
// 右侧聊天窗口 — 自动滚到底部 + 引用 + 背景 + 正在输入

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { MessageBubble } from '../chat/MessageBubble'
import { InputArea } from '../chat/InputArea'
import { TitleBar } from './TitleBar'
import { useChatStore } from '../../stores/chatStore'
import { useChatSessionStore } from '../../stores/chatSessionStore'
import { useChatBgStore } from '../../stores/chatBgStore'
import { useChatListStore } from '../../stores/chatListStore'
import './ChatWindow.css'

interface QuoteTarget {
  id: string
  content: string
}

export function ChatWindow(): React.JSX.Element {
  const messages = useChatStore((s) => s.messages)
  const isLoading = useChatStore((s) => s.isLoading)
  const currentSession = useChatSessionStore((s) => s.currentSession)
  const chatBgStore = useChatBgStore()
  const [quoteMessage, setQuoteMessage] = useState<QuoteTarget | null>(null)
  const [patSuffix, setPatSuffixState] = useState('小脑袋')
  const [objectAvatar, setObjectAvatar] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // 切换角色时，加载该角色的拍一拍后缀
  useEffect(() => {
    const charId = currentSession?.id
    if (!charId) {
      setPatSuffixState('小脑袋')
      return
    }
    try {
      const saved = localStorage.getItem(`patSuffix-${charId}`)
      setPatSuffixState(saved || '小脑袋')
    } catch {
      setPatSuffixState('小脑袋')
    }
  }, [currentSession?.id])

  // 保存拍一拍后缀（按角色）
  const setPatSuffix = useCallback((suffix: string): void => {
    const charId = useChatSessionStore.getState().currentSession?.id
    if (charId) {
      localStorage.setItem(`patSuffix-${charId}`, suffix)
    }
    setPatSuffixState(suffix)
  }, [])

  // 切换角色时加载该角色的头像
  useEffect(() => {
    const charId = currentSession?.id
    if (!charId) {
      setObjectAvatar(null)
      return
    }
    try {
      const saved = localStorage.getItem(`char-avatar-${charId}`)
      setObjectAvatar(saved && saved.startsWith('data:image') ? saved : null)
    } catch {
      setObjectAvatar(null)
    }
  }, [currentSession?.id])

  const chatBg = currentSession?.id ? chatBgStore.getBg(currentSession.id) : '#FFFFFF'

  // 消息变化时自动滚到底部
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isLoading])

  // 切换角色时立即滚到底部（不带动画）
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'instant' })
    }
  }, [currentSession?.id])

  const handleQuote = useCallback((messageId: string): void => {
    const msg = messages.find((m) => m.id === messageId)
    if (msg) {
      setQuoteMessage({ id: msg.id, content: msg.content })
    }
  }, [messages])

  const handlePat = useCallback((_targetAvatar: string, suffix: string): void => {
    const charId = useChatStore.getState().currentCharacterId || 'default'
    const { addMessage } = useChatStore.getState()
    const targetName = currentSession?.name || '对方'
    const finalSuffix = suffix || patSuffix

    addMessage({
      role: 'system',
      content: `你拍了拍${targetName}的${finalSuffix}`,
      type: 'pat',
      metadata: { from: '我', to: targetName, suffix: finalSuffix }
    })

    const { updateLastMessage } = useChatListStore.getState()
    updateLastMessage(charId, `你拍了拍${targetName}的${finalSuffix}`)
  }, [currentSession?.name, patSuffix])

  const handlePatSuffixChange = useCallback((suffix: string): void => {
    setPatSuffix(suffix || '小脑袋')
  }, [])

  const handleAvatarChange = useCallback((dataUrl: string): void => {
    setObjectAvatar(dataUrl)
    const charId = useChatSessionStore.getState().currentSession?.id
    if (charId) {
      localStorage.setItem(`char-avatar-${charId}`, dataUrl)
      // 通知通讯录刷新头像
      useChatListStore.getState().bumpAvatarVersion(charId)
    }
  }, [])

  const handleDelete = useCallback(async (): Promise<void> => {
    if (!currentSession?.id) return

    try {
      // 1. 调后端删除
      await window.electronAPI?.invoke('character:delete', { id: currentSession.id })

      // 2. 清 localStorage
      try {
        localStorage.removeItem(`char-data-${currentSession.id}`)
        localStorage.removeItem(`char-avatar-${currentSession.id}`)
        localStorage.removeItem(`patSuffix-${currentSession.id}`)
        localStorage.removeItem(`chatBg-${currentSession.id}`)
      } catch { /* ignore */ }

      // 3. 清聊天数据
      useChatStore.getState().clearCharacterMessages(currentSession.id)

      // 4. 从聊天列表移除
      useChatListStore.setState((state) => ({
        sessions: state.sessions.filter((s) => s.id !== currentSession.id)
      }))

      // 5. 清空当前选中
      useChatSessionStore.getState().setCurrentSession(null)
    } catch (error) {
      console.error('删除角色失败:', error)
    }
  }, [currentSession])

  const handleClearQuote = useCallback((): void => {
    setQuoteMessage(null)
  }, [])

  const displayName = currentSession?.name || '选择一个聊天'
  const isOnline = currentSession?.online ?? false

  const displayAvatar = (objectAvatar && objectAvatar.startsWith('data:image'))
    ? objectAvatar
    : (currentSession?.avatar || '💬')

  const bgStyle: React.CSSProperties = chatBg.startsWith('data:') || chatBg.startsWith('http')
    ? { backgroundImage: `url(${chatBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { backgroundColor: chatBg }

  return (
    <div className="chat-window">
      <TitleBar
        name={displayName}
        avatar={objectAvatar || displayAvatar}
        online={isOnline}
        isTyping={isLoading}
        currentPatSuffix={patSuffix}
        onPatSuffixChange={handlePatSuffixChange}
        onAvatarChange={handleAvatarChange}
        onDelete={handleDelete}
        characterId={currentSession?.id}
      />

      <div className="chat-window__messages" ref={containerRef} style={bgStyle}>
        {!currentSession ? (
          <div className="chat-window__empty">
            <div className="chat-window__empty-icon">💬</div>
            <div className="chat-window__empty-title">选择一个聊天</div>
            <div className="chat-window__empty-subtitle">从左侧列表选择一个对话开始</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="chat-window__empty">
            <div className="chat-window__empty-icon">👋</div>
            <div className="chat-window__empty-title">开始聊天吧</div>
            <div className="chat-window__empty-subtitle">发送一条消息，和TA说说话</div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                id={msg.id}
                role={msg.role}
                content={msg.content}
                type={msg.type}
                time={new Date(msg.timestamp).toLocaleTimeString('zh-CN', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
                avatar={msg.role === 'assistant' ? displayAvatar : undefined}
                status={msg.status}
                metadata={msg.metadata}
                onQuote={handleQuote}
                onPat={handlePat}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <InputArea
        quoteMessage={quoteMessage}
        onClearQuote={handleClearQuote}
        disabled={isLoading}
      />
    </div>
  )
}
