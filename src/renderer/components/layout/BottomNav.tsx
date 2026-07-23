// src/renderer/components/layout/BottomNav.tsx
// 底部导航栏 — 微信手机版风格

import { useUIStore, type ViewType } from '../../stores/uiStore'
import { useUnreadStore } from '../../stores/unreadStore'
import './BottomNav.css'

interface NavItem {
  id: ViewType
  icon: string
  label: string
}

const NAV_ITEMS: NavItem[] = [
  { id: 'chat', icon: '💬', label: '消息' },
  { id: 'contacts', icon: '👥', label: '通讯录' },
  { id: 'moments', icon: '📷', label: '发现' },
]

export function BottomNav(): React.JSX.Element {
  const currentView = useUIStore((s) => s.currentView)
  const setView = useUIStore((s) => s.setView)
  const totalUnread = useUnreadStore((s) => s.totalUnread)

  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map((item) => (
        <button
          key={item.id}
          className={`bottom-nav__item ${currentView === item.id ? 'bottom-nav__item--active' : ''}`}
          onClick={() => setView(item.id)}
        >
          <span className="bottom-nav__icon">{item.icon}</span>
          {item.id === 'chat' && totalUnread > 0 && (
            <span className="bottom-nav__badge">{totalUnread}</span>
          )}
          <span className="bottom-nav__label">{item.label}</span>
        </button>
      ))}
    </nav>
  )
}
