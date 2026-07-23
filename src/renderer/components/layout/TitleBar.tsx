// src/renderer/components/layout/TitleBar.tsx
// 聊天窗口标题栏 — "⋯"菜单 + 语音合成按钮

import { useState, useRef, useEffect } from 'react'
import { VoicePanel } from '../tts/VoicePanel'
import './TitleBar.css'

interface TitleBarProps {
  name: string
  avatar?: string
  online: boolean
  isTyping?: boolean
  onPatSuffixChange?: (suffix: string) => void
  onAvatarChange?: (dataUrl: string) => void
  onDelete?: () => void
  onSearch?: () => void
  currentPatSuffix?: string
  characterId?: string
  onBack?: () => void
}

export function TitleBar({
  name,
  avatar,
  online,
  isTyping,
  onPatSuffixChange,
  onAvatarChange,
  onDelete,
  onSearch,
  currentPatSuffix,
  characterId,
  onBack
}: TitleBarProps): React.JSX.Element {
  const [showMenu, setShowMenu] = useState(false)
  const [showSuffixInput, setShowSuffixInput] = useState(false)
  const [suffixValue, setSuffixValue] = useState(currentPatSuffix || '小脑袋')
  const [showVoice, setShowVoice] = useState(false)
  const [ttsEnabled, setTtsEnabled] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const suffixInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setSuffixValue(currentPatSuffix || '小脑袋')
  }, [currentPatSuffix])

  // 监听 TTS 状态（从角色配置读取）
  useEffect(() => {
    if (!characterId) return
    const loadTtsState = async (): Promise<void> => {
      try {
        const charList = await window.electronAPI?.invoke('character:list') as Array<Record<string, unknown>> | null
        const charData = charList?.find(c => c.id === characterId)
        if (charData) {
          setTtsEnabled(!!charData.ttsEnabled)
        }
      } catch { /* ignore */ }
    }
    loadTtsState()
  }, [characterId])

  // 监听自定义事件：VoicePanel 关闭时刷新 TTS 状态
  useEffect(() => {
    const handler = (): void => {
      if (!characterId) return
      window.electronAPI?.invoke('character:list').then((charList) => {
        if (Array.isArray(charList)) {
          const charData = charList.find((c: Record<string, unknown>) => c.id === characterId)
          if (charData) {
            setTtsEnabled(!!charData.ttsEnabled)
          }
        }
      }).catch(() => {})
    }
    window.addEventListener('tts:refresh', handler)
    return () => window.removeEventListener('tts:refresh', handler)
  }, [characterId])

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
        {onBack && (
          <button className="titlebar__back-btn" onClick={onBack} title="返回">
            ←
          </button>
        )}
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
        {/* 语音合成按钮 */}
        <button
          className={`titlebar__btn ${ttsEnabled ? 'titlebar__btn--tts-active' : ''}`}
          title={ttsEnabled ? '语音合成已启用' : '语音合成'}
          onClick={() => setShowVoice(!showVoice)}
        >
          <span style={{ fontSize: 16 }}>{ttsEnabled ? '🔊' : '🔇'}</span>
        </button>
      </div>

      {showVoice && (
        <VoicePanel onClose={() => setShowVoice(false)} characterId={characterId} />
      )}
    </div>
  )
}
