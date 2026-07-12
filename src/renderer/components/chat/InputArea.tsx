// src/renderer/components/chat/InputArea.tsx
// 聊天输入区域 — 表情选择 + 引用回复

import React, { useState, useRef } from 'react'
import { useChat } from '../../hooks/useChat'
import { EmojiPicker } from './EmojiPicker'
import './InputArea.css'

interface InputAreaProps {
  quoteMessage?: { id: string; content: string } | null
  onClearQuote?: () => void
  disabled?: boolean
}

export function InputArea({ quoteMessage, onClearQuote, disabled }: InputAreaProps): React.JSX.Element {
  const [message, setMessage] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)
  const { sendMessage, isLoading } = useChat()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const isDisabled = disabled || isLoading

  const handleSend = (): void => {
    if (message.trim() && !isLoading) {
      sendMessage(message.trim(), quoteMessage?.id)
      setMessage('')
      onClearQuote?.()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleEmojiSelect = (emoji: string): void => {
    setMessage((prev) => prev + emoji)
    textareaRef.current?.focus()
  }

  return (
    <div className="input-area">
      {/* 引用提示栏 */}
      {quoteMessage && (
        <div className="input-area__quote-bar">
          <span className="input-area__quote-text">
            引用: {quoteMessage.content.length > 30
              ? quoteMessage.content.slice(0, 30) + '...'
              : quoteMessage.content}
          </span>
          <button className="input-area__quote-close" onClick={onClearQuote}>×</button>
        </div>
      )}

      {/* 工具栏 */}
      <div className="input-area__toolbar">
        <div className="input-area__toolbar-left">
          <div className="input-area__emoji-wrapper">
            <button
              className="input-area__tool-btn"
              title="表情"
              onClick={() => setShowEmoji(!showEmoji)}
            >
              <span>😊</span>
            </button>
            {showEmoji && (
              <EmojiPicker
                onSelect={handleEmojiSelect}
                onClose={() => setShowEmoji(false)}
              />
            )}
          </div>
          <button className="input-area__tool-btn" title="截图">
            <span>📷</span>
          </button>
          <button className="input-area__tool-btn" title="文件">
            <span>📁</span>
          </button>
          <button className="input-area__tool-btn" title="聊天记录">
            <span>📋</span>
          </button>
        </div>
      </div>

      {/* 输入框 */}
      <div className="input-area__editor">
        <textarea
          ref={textareaRef}
          className="input-area__textarea"
          placeholder="输入消息..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={isDisabled}
        />
      </div>

      {/* 底部按钮 */}
      <div className="input-area__footer">
        <div className="input-area__footer-hint">
          按 Enter 发送，Shift + Enter 换行
        </div>
        <button
          className={`input-area__send-btn ${message.trim() && !isLoading ? 'input-area__send-btn--active' : ''}`}
          onClick={handleSend}
          disabled={!message.trim() || isLoading}
        >
          {isLoading ? '发送中...' : '发送(S)'}
        </button>
      </div>
    </div>
  )
}
