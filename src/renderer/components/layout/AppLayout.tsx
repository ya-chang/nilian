// src/renderer/components/layout/AppLayout.tsx
// 移动端布局 — 全屏切换 + 底部导航

import { BottomNav } from './BottomNav'
import { ChatList } from './ChatList'
import { ChatWindow } from './ChatWindow'
import { ContactList } from '../contacts/ContactList'
import { ContactDetail } from '../contacts/ContactDetail'
import { ErrorBoundary } from '../ErrorBoundary'
import { useUIStore } from '../../stores/uiStore'
import { useChatSessionStore } from '../../stores/chatSessionStore'
import { useContactStore } from '../../stores/contactStore'
import './AppLayout.css'

export function AppLayout(): React.JSX.Element {
  const currentView = useUIStore((s) => s.currentView)
  const currentSession = useChatSessionStore((s) => s.currentSession)
  const setCurrentSession = useChatSessionStore((s) => s.setCurrentSession)
  const selectedContactId = useContactStore((s) => s.selectedContactId)
  const setSelectedContactId = useContactStore((s) => s.setSelectedContactId)

  // 聊天页面：有选中会话时显示 ChatWindow，否则显示 ChatList
  const showChatWindow = currentView === 'chat' && currentSession
  // 通讯录页面：有选中联系人时显示 ContactDetail，否则显示 ContactList
  const showContactDetail = currentView === 'contacts' && selectedContactId

  const showBottomNav = !showChatWindow && !showContactDetail

  return (
    <div className={`app-layout app-layout--mobile ${showBottomNav ? 'app-layout--has-bottomnav' : ''}`}>
      <div className="app-layout__content">
        {/* 聊天 */}
        {currentView === 'chat' && !showChatWindow && (
          <ChatList />
        )}
        {showChatWindow && (
          <ErrorBoundary section="聊天窗口">
            <ChatWindow onBack={() => setCurrentSession(null)} />
          </ErrorBoundary>
        )}

        {/* 通讯录 */}
        {currentView === 'contacts' && !showContactDetail && (
          <ContactList />
        )}
        {showContactDetail && (
          <ErrorBoundary section="联系人详情">
            <ContactDetail onBack={() => setSelectedContactId(null)} />
          </ErrorBoundary>
        )}

        {/* 发现 */}
        {currentView === 'moments' && (
          <div className="app-layout__placeholder">
            <div className="app-layout__placeholder-icon">📷</div>
            <div className="app-layout__placeholder-text">发现</div>
          </div>
        )}
      </div>
      {!showChatWindow && !showContactDetail && <BottomNav />}
    </div>
  )
}
