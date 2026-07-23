// src/renderer/components/chat/InputArea.tsx
// 聊天输入区域 — 表情选择 + 引用回复

import { useState, useRef } from 'react'
import { useChat } from '../../hooks/useChat'
import { EmojiPicker } from './EmojiPicker'
import './InputArea.css'

interface InputAreaProps {
  quoteMessage?: { id: string; content: string } | null
  onClearQuote?: () => void
  disabled?: boolean
}

export function InputArea({ quoteMessage, onClearQuote, disabled }: InputAreaProps): React.JSX.Element {
  const [inputValue, setInputValue] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const { sendMessage } = useChat()

  const handleSend = (): void => {
    const text = inputValue.trim()
    if (!text) return
    sendMessage(text)
    setInputValue('')
    setShowEmoji(false)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleEmojiSelect = (emoji: string): void => {
    setInputValue(prev => prev + emoji)
    setShowEmoji(false)
    inputRef.current?.focus()
  }

  return (
    <div className="input-area">
      {quoteMessage && (
        <div className="input-area__quote">
          <span className="input-area__quote-content">{quoteMessage.content}</span>
          <button className="input-area__quote-close" onClick={onClearQuote}>×</button>
        </div>
      )}

      {/* 工具栏（输入框上方） */}
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
      <textarea
        ref={inputRef}
        className="input-area__textarea"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={disabled ? '请先选择一个角色' : '输入消息...'}
        disabled={disabled}
        rows={1}
      />

      {/* 底部：发送按钮 */}
      <div className="input-area__footer">
        <span className="input-area__footer-hint">Enter 发送，Shift+Enter 换行</span>
        <button
          className={`input-area__send-btn ${inputValue.trim() ? 'input-area__send-btn--active' : ''}`}
          onClick={handleSend}
          disabled={!inputValue.trim() || disabled}
        >
          发送
        </button>
      </div>
    </div>
  )
}
