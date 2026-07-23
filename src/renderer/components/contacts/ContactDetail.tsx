// src/renderer/components/contacts/ContactDetail.tsx
// 联系人详情 — 显示在中间区域，支持修改头像

import { useState, useEffect, useRef } from 'react'
import { useContactStore } from '../../stores/contactStore'
import { useChatListStore } from '../../stores/chatListStore'
import './ContactList.css'

interface ContactDetailProps {
  onBack?: () => void
}

export function ContactDetail({ onBack }: ContactDetailProps): React.JSX.Element | null {
  const selectedContactId = useContactStore((s) => s.selectedContactId)
  const setSelectedContactId = useContactStore((s) => s.setSelectedContactId)
  const sessions = useChatListStore((s) => s.sessions)
  const bumpAvatarVersion = useChatListStore((s) => s.bumpAvatarVersion)
  const [showApiKey, setShowApiKey] = useState(false)
  const [customAvatar, setCustomAvatar] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const session = sessions.find((s) => s.id === selectedContactId)

  const [charData, setCharData] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!selectedContactId) { setLoading(false); return }
    setLoading(true)
    try {
      const raw = localStorage.getItem(`char-data-${selectedContactId}`)
      setCharData(raw ? JSON.parse(raw) : null)
    } catch {
      setCharData(null)
    } finally {
      setLoading(false)
    }
  }, [selectedContactId])

  useEffect(() => {
    if (!selectedContactId) return
    try {
      const saved = localStorage.getItem(`char-avatar-${selectedContactId}`)
      setCustomAvatar(saved && saved.startsWith('data:image') ? saved : null)
    } catch {
      setCustomAvatar(null)
    }
  }, [selectedContactId, session?.avatarVersion])

  useEffect(() => {
    setShowApiKey(false)
  }, [selectedContactId])

  // 头像上传
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0]
    if (!file || !selectedContactId) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      if (dataUrl) {
        // 保存到 localStorage
        localStorage.setItem(`char-avatar-${selectedContactId}`, dataUrl)
        // 更新 char-data 中的 avatar
        try {
          const raw = localStorage.getItem(`char-data-${selectedContactId}`)
          if (raw) {
            const data = JSON.parse(raw)
            data.avatar = dataUrl
            localStorage.setItem(`char-data-${selectedContactId}`, JSON.stringify(data))
          }
        } catch { /* ignore */ }
        // 通知刷新
        setCustomAvatar(dataUrl)
        bumpAvatarVersion(selectedContactId)
      }
    }
    reader.readAsDataURL(file)
    // 清空 input 允许重复选择同一文件
    e.target.value = ''
  }

  if (!session || !selectedContactId) return null

  if (loading) {
    return (
      <div className="contact-detail">
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
          加载中...
        </div>
      </div>
    )
  }

  const isImage = customAvatar && customAvatar.startsWith('data:image')
  const displayAvatar = isImage ? customAvatar : session.avatar

  const maskApiKey = (key: string): string => {
    if (!key) return '未设置'
    if (key.length <= 8) return '****'
    return key.slice(0, 4) + '****' + key.slice(-4)
  }

  const providerLabels: Record<string, string> = {
    deepseek: 'DeepSeek',
    siliconflow: '硅基流动',
    mimo: 'MiMo（小米）',
    openai: 'OpenAI',
    ollama: 'Ollama（本地）'
  }

  const provider = (charData?.provider as string) || '未知'
  const model = (charData?.model as string) || '未知'
  const apiKey = (charData?.apiKey as string) || ''
  const persona = (charData?.persona as string) || ''
  const catchphrase = (charData?.catchphrase as string) || ''
  const traitsRaw = charData?.traits
  const traits: string[] = Array.isArray(traitsRaw)
    ? traitsRaw
    : typeof traitsRaw === 'string'
      ? traitsRaw.split(/[,，]/).map((t: string) => t.trim()).filter(Boolean)
      : []

  return (
    <div className="contact-detail">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleAvatarUpload}
        style={{ display: 'none' }}
      />

      <div className="contact-detail__titlebar">
        <button className="contact-detail__back" onClick={() => onBack ? onBack() : setSelectedContactId(null)}>
          ←
        </button>
        <span className="contact-detail__title">对象详情</span>
      </div>

      <div className="contact-detail__body">
        <div className="contact-detail__profile">
          <div className="contact-detail__avatar contact-detail__avatar--editable" onClick={() => fileInputRef.current?.click()}>
            {isImage ? (
              <img src={displayAvatar} alt="avatar" />
            ) : (
              <span className="contact-detail__avatar-emoji">{displayAvatar}</span>
            )}
            <div className="contact-detail__avatar-overlay">修改头像</div>
          </div>
          <div className="contact-detail__name">{session.name}</div>
        </div>

        <div className="contact-detail__section">
          <div className="contact-detail__section-title">基本信息</div>

          <div className="contact-detail__row">
            <span className="contact-detail__label">模型服务</span>
            <span className="contact-detail__value">{providerLabels[provider] || provider}</span>
          </div>

          <div className="contact-detail__row">
            <span className="contact-detail__label">模型</span>
            <span className="contact-detail__value">{model}</span>
          </div>

          <div className="contact-detail__row">
            <span className="contact-detail__label">API Key</span>
            <div className="contact-detail__api-key">
              <span className="contact-detail__value">
                {showApiKey ? (apiKey || '未设置') : maskApiKey(apiKey)}
              </span>
              <button
                className="contact-detail__toggle-btn"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? '隐藏' : '显示'}
              </button>
            </div>
          </div>
        </div>

        <div className="contact-detail__section">
          <div className="contact-detail__section-title">性格设定</div>

          {traits.length > 0 && (
            <div className="contact-detail__traits">
              {traits.map((trait, i) => (
                <span key={i} className="contact-detail__trait-tag">{trait}</span>
              ))}
            </div>
          )}

          {catchphrase && (
            <div className="contact-detail__row">
              <span className="contact-detail__label">口头禅</span>
              <span className="contact-detail__value contact-detail__value--catchphrase">{catchphrase}</span>
            </div>
          )}
        </div>

        {persona && (
          <div className="contact-detail__section">
            <div className="contact-detail__section-title">人设描述</div>
            <div className="contact-detail__persona">{persona}</div>
          </div>
        )}
      </div>
    </div>
  )
}