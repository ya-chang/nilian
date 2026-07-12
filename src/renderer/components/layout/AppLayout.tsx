// src/renderer/components/layout/AppLayout.tsx
// 三栏布局容器 — 支持视图切换 + 实时未读数

import React from 'react'
import { SideNav } from './SideNav'
import { ChatList } from './ChatList'
import { ChatWindow } from './ChatWindow'
import { ContactList } from '../contacts/ContactList'
import { ContactDetail } from '../contacts/ContactDetail'
import { MusicPanel } from '../music/MusicPanel'
import { useUIStore } from '../../stores/uiStore'
import { useUnreadStore } from '../../stores/unreadStore'
import { useContactStore } from '../../stores/contactStore'
import './AppLayout.css'

export function AppLayout(): React.JSX.Element {
  const currentView = useUIStore((s) => s.currentView)
  const totalUnread = useUnreadStore((s) => s.totalUnread)
  const selectedContactId = useContactStore((s) => s.selectedContactId)

  return (
    <div className="app-layout">
      <SideNav unreadCount={totalUnread} />
      {currentView === 'chat' && (
        <>
          <ChatList />
          <ChatWindow />
        </>
      )}
      {currentView === 'contacts' && (
        <>
          <ContactList />
          {selectedContactId ? <ContactDetail /> : (
            <div className="app-layout__placeholder">
              <div className="app-layout__placeholder-icon">👤</div>
              <div className="app-layout__placeholder-text">选择一个对象查看详情</div>
            </div>
          )}
        </>
      )}
      {currentView === 'music' && <MusicPanel />}
      {currentView === 'moments' && (
        <div className="app-layout__placeholder">
          <div className="app-layout__placeholder-icon">📷</div>
          <div className="app-layout__placeholder-text">朋友圈</div>
        </div>
      )}
    </div>
  )
}
