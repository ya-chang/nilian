// src/renderer/components/search/SearchBar.tsx
// 聊天记录搜索 — Ctrl+F 或点击🔍图标触发

import { useState, useRef, useEffect, useCallback } from 'react'
import { useChatStore } from '../../stores/chatStore'
import './SearchBar.css'

interface SearchResult {
  id: string
  content: string
  role: string
  timestamp: number
}

interface SearchBarProps {
  visible: boolean
  onClose: () => void
  onJumpTo: (messageId: string) => void
}

export function SearchBar({ visible, onClose, onJumpTo }: SearchBarProps): React.JSX.Element | null {
  const [keyword, setKeyword] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (visible) {
      setTimeout(() => inputRef.current?.focus(), 100)
    } else {
      setKeyword('')
      setResults([])
      setHasSearched(false)
    }
  }, [visible])

  const handleSearch = useCallback((): void => {
    if (!keyword.trim()) return

    const messages = useChatStore.getState().messages
    const kw = keyword.toLowerCase()
    const matched = messages.filter((m) =>
      m.content.toLowerCase().includes(kw)
    ).map((m) => ({
      id: m.id,
      content: m.content,
      role: m.role,
      timestamp: m.timestamp
    }))

    setResults(matched)
    setHasSearched(true)
  }, [keyword])

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter') handleSearch()
    if (e.key === 'Escape') onClose()
  }

  const highlightText = (text: string, kw: string): React.ReactNode => {
    if (!kw.trim()) return text
    const parts = text.split(new RegExp(`(${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'))
    return parts.map((part, i) =>
      part.toLowerCase() === kw.toLowerCase()
        ? <mark key={i} className="search-highlight">{part}</mark>
        : part
    )
  }

  if (!visible) return null

  return (
    <div className="search-bar">
      <div className="search-bar__header">
        <span className="search-bar__icon">🔍</span>
        <input
          ref={inputRef}
          className="search-bar__input"
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="搜索当前对话..."
        />
        <button className="search-bar__close" onClick={onClose}>×</button>
      </div>

      {hasSearched && (
        <div className="search-bar__results">
          {results.length > 0 ? (
            <>
              <div className="search-bar__count">找到 {results.length} 条结果</div>
              {results.slice(0, 20).map((r) => (
                <div key={r.id} className="search-bar__result">
                  <div className="search-bar__result-time">
                    {new Date(r.timestamp).toLocaleString('zh-CN', {
                      month: '2-digit', day: '2-digit',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </div>
                  <div className="search-bar__result-content">
                    {highlightText(r.content, keyword)}
                  </div>
                  <button
                    className="search-bar__jump-btn"
                    onClick={() => { onJumpTo(r.id); onClose() }}
                  >
                    跳转
                  </button>
                </div>
              ))}
            </>
          ) : (
            <div className="search-bar__empty">
              <div className="search-bar__empty-icon">😕</div>
              <div>没有找到相关消息</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}