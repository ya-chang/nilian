// src/renderer/components/contacts/ContactList.tsx
// 通讯录 — 左侧列表，点击选中后右侧显示详情

import { useState, useEffect } from 'react'
import { useChatListStore } from '../../stores/chatListStore'
import { useContactStore } from '../../stores/contactStore'
import './ContactList.css'

export function ContactList(): React.JSX.Element {
  const sessions = useChatListStore((s) => s.sessions)
  const [searchText, setSearchText] = useState('')
  const selectedContactId = useContactStore((s) => s.selectedContactId)
  const setSelectedContactId = useContactStore((s) => s.setSelectedContactId)

  const filteredSessions = sessions.filter((s) =>
    s.name.toLowerCase().includes(searchText.toLowerCase())
  )

  return (
    <div className="contact-list">
      <div className="contact-list__header">
        <span className="contact-list__title">通讯录</span>
      </div>

      <div className="contact-list__search">
        <div className="contact-list__search-wrapper">
          <span className="contact-list__search-icon">🔍</span>
          <input
            type="text"
            className="contact-list__search-input"
            placeholder="搜索联系人"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
      </div>

      <div className="contact-list__section">
        <div className="contact-list__section-title">聊天对象</div>
        {filteredSessions.map((session) => (
          <ContactListItem
            key={session.id}
            session={session}
            selected={session.id === selectedContactId}
            onClick={() => setSelectedContactId(session.id)}
          />
        ))}
        {filteredSessions.length === 0 && (
          <div className="contact-list__empty">暂无联系人</div>
        )}
      </div>
    </div>
  )
}

// ============================================================
// 联系人列表项 — 支持图片头像 + 选中高亮
// ============================================================

function ContactListItem({ session, selected, onClick }: {
  session: { id: string; name: string; avatar: string; online: boolean; avatarVersion: number }
  selected: boolean
  onClick: () => void
}): React.JSX.Element {
  const [customAvatar, setCustomAvatar] = useState<string | null>(null)

  // avatarVersion 变化时重新读取头像
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`char-avatar-${session.id}`)
      setCustomAvatar(saved && saved.startsWith('data:image') ? saved : null)
    } catch {
      setCustomAvatar(null)
    }
  }, [session.id, session.avatarVersion])

  const isImage = customAvatar && customAvatar.startsWith('data:image')
  const displayAvatar = isImage ? customAvatar : session.avatar

  return (
    <div
      className={`contact-list__item ${selected ? 'contact-list__item--selected' : ''}`}
      onClick={onClick}
    >
      <div className="contact-list__item-avatar">
        {isImage ? (
          <img src={displayAvatar} alt="avatar" className="contact-list__item-avatar-img" />
        ) : (
          <span className="contact-list__item-emoji">{displayAvatar}</span>
        )}
        {session.online && <span className="contact-list__item-online-dot" />}
      </div>
      <div className="contact-list__item-info">
        <span className="contact-list__item-name">{session.name}</span>
        <span className="contact-list__item-detail">
          {session.online ? '在线' : '离线'}
        </span>
      </div>
    </div>
  )
}