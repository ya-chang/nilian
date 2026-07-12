// src/renderer/components/layout/TitleBar.tsx
// 聊天窗口标题栏 — "⋯"菜单：修改拍一拍后缀 + 对象头像 + 删除对象

import React, { useState, useRef, useEffect } from 'react'
import './TitleBar.css'

interface TitleBarProps {
  name: string
  avatar?: string
  online: boolean
  isTyping?: boolean
  onPatSuffixChange?: (suffix: string) => void
  onAvatarChange?: (dataUrl: string) => void
  onDelete?: () => void
  currentPatSuffix?: string
  characterId?: string
}

export function TitleBar({
  name,
  avatar,
  online,
  isTyping,
  onPatSuffixChange,
  onAvatarChange,
  onDelete,
  currentPatSuffix,
  characterId
}: TitleBarProps): React.JSX.Element {
  const [showMenu, setShowMenu] = useState(false)
  const [showSuffixInput, setShowSuffixInput] = useState(false)
  const [suffixValue, setSuffixValue] = useState(currentPatSuffix || '小脑袋')
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const suffixInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setSuffixValue(currentPatSuffix || '小脑袋')
  }, [currentPatSuffix])

  useEffect(() => {
    if (!showMenu) return
    const handleClickOutside = (e: MouseEvent): void => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showMenu])

  useEffect(() => {
    if (showSuffixInput && suffixInputRef.current) {
      suffixInputRef.current.focus()
      suffixInputRef.current.select()
    }
  }, [showSuffixInput])

  const handleEditPatSuffix = (): void => {
    setShowMenu(false)
    setShowSuffixInput(true)
  }

  const handleSuffixConfirm = (): void => {
    if (onPatSuffixChange) {
      onPatSuffixChange(suffixValue.trim() || '小脑袋')
    }
    setShowSuffixInput(false)
  }

  const handleSuffixKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter') {
      handleSuffixConfirm()
    } else if (e.key === 'Escape') {
      setShowSuffixInput(false)
      setSuffixValue(currentPatSuffix || '小脑袋')
    }
  }

  const handleEditAvatar = (): void => {
    setShowMenu(false)
    avatarInputRef.current?.click()
  }

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0]
    if (!file || !onAvatarChange) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      if (dataUrl) onAvatarChange(dataUrl)
    }
    reader.readAsDataURL(file)
  }

  const handleDelete = (): void => {
    setShowMenu(false)
    if (!characterId || !onDelete) return
    const confirmed = window.confirm(`确定要删除「${name}」吗？\n\n所有聊天记录和数据将被永久删除，不可恢复。`)
    if (confirmed) {
      onDelete()
    }
  }

  return (
    <div className="titlebar chat-window__titlebar">
      <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />

      <div className="titlebar__left">
        <span className="titlebar__name">
          {isTyping ? '对方正在输入中...' : name}
        </span>
        {!isTyping && online && <span className="titlebar__online">在线</span>}

        {showSuffixInput && (
          <div className="titlebar__suffix-input-wrap">
            <input
              ref={suffixInputRef}
              className="titlebar__suffix-input"
              value={suffixValue}
              onChange={(e) => setSuffixValue(e.target.value)}
              onKeyDown={handleSuffixKeyDown}
              onBlur={handleSuffixConfirm}
              placeholder="输入后缀"
              maxLength={20}
            />
          </div>
        )}

        {!isTyping && !showSuffixInput && (
          <div className="titlebar__menu-wrapper" ref={menuRef}>
            <button
              className="titlebar__menu-btn"
              onClick={() => setShowMenu(!showMenu)}
              title="更多设置"
            >
              ···
            </button>
            {showMenu && (
              <div className="titlebar__dropdown">
                <div className="titlebar__dropdown-item" onClick={handleEditAvatar}>
                  修改对象头像
                </div>
                <div className="titlebar__dropdown-item" onClick={handleEditPatSuffix}>
                  修改拍一拍后缀
                </div>
                <div className="titlebar__dropdown-divider" />
                <div className="titlebar__dropdown-item titlebar__dropdown-item--danger" onClick={handleDelete}>
                  删除对象
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="titlebar__right">
        <button className="titlebar__btn" onClick={() => window.electronAPI?.minimize()} title="最小化">
          <svg width="12" height="12" viewBox="0 0 12 12"><line x1="1" y1="6" x2="11" y2="6" stroke="currentColor" strokeWidth="1" /></svg>
        </button>
        <button className="titlebar__btn" onClick={() => window.electronAPI?.maximize()} title="最大化">
          <svg width="12" height="12" viewBox="0 0 12 12"><rect x="1" y="1" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1" /></svg>
        </button>
        <button className="titlebar__btn titlebar__btn--close" onClick={() => window.electronAPI?.close()} title="关闭">
          <svg width="12" height="12" viewBox="0 0 12 12">
            <line x1="1" y1="1" x2="11" y2="11" stroke="currentColor" strokeWidth="1" />
            <line x1="11" y1="1" x2="1" y2="11" stroke="currentColor" strokeWidth="1" />
          </svg>
        </button>
      </div>
    </div>
  )
}
