// src/renderer/App.tsx
// 根组件 — 启动时从本地存储加载角色

import { useEffect } from 'react'
import { AppLayout } from './components/layout/AppLayout'
import { useUserStore } from './stores/userStore'
import { useChatStore } from './stores/chatStore'
import { useChatListStore } from './stores/chatListStore'
import { CharacterService } from './services/CharacterService'
import { TTSService } from './services/TTSService'

function App(): React.JSX.Element {
  const loadAvatar = useUserStore((s) => s.loadAvatar)

  useEffect(() => {
    loadAvatar()
    TTSService.loadConfig()
    loadCharactersFromStorage()

    // 启动时应用保存的主题
    try {
      const saved = localStorage.getItem('app-settings')
      if (saved) {
        const settings = JSON.parse(saved)
        if (settings.theme) {
          document.documentElement.setAttribute('data-theme', settings.theme)
        }
      }
    } catch { /* ignore */ }

    // 启动时加载上次选中角色的消息
    try {
      const savedSession = localStorage.getItem('wechat-ai-active-session')
      if (savedSession) {
        const session = JSON.parse(savedSession)
        if (session?.id) {
          useChatStore.getState().loadCharacterMessages(session.id)
        }
      }
    } catch { /* ignore */ }
  }, [loadAvatar])

  return <AppLayout />
}

/**
 * 从本地存储加载角色到聊天列表
 */
function loadCharactersFromStorage(): void {
  try {
    const chars = CharacterService.getAll()
    const chatListStore = useChatListStore.getState()

    for (const char of chars) {
      const exists = chatListStore.sessions.some((s) => s.id === char.id)
      if (!exists) {
        chatListStore.addSession({
          id: char.id,
          name: char.name,
          avatar: char.avatar || '🌸',
          lastMessage: '开始聊天吧~',
          time: '',
          unread: 0,
          online: true,
          pinned: false,
          avatarVersion: 0
        })
      }
    }
  } catch (error) {
    console.error('加载角色列表失败:', error)
  }
}

export default App
