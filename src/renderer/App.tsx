// src/renderer/App.tsx
// 根组件 — 启动时从后端加载角色 + 同步聊天列表

import React, { useEffect } from 'react'
import { AppLayout } from './components/layout/AppLayout'
import { useUserStore } from './stores/userStore'
import { useChatStore } from './stores/chatStore'
import { useChatListStore } from './stores/chatListStore'

function App(): React.JSX.Element {
  const loadAvatar = useUserStore((s) => s.loadAvatar)

  useEffect(() => {
    loadAvatar()
    loadCharactersFromBackend()

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
 * 启动时从后端加载所有已有角色，同步到聊天列表
 * 这样重启后角色不会消失
 */
async function loadCharactersFromBackend(): Promise<void> {
  try {
    const result = await window.electronAPI?.invoke('character:list')
    if (!result || !Array.isArray(result)) return

    const chatListStore = useChatListStore.getState()

    for (const char of result) {
      // 安全取值，防止后端返回异常数据
      const id = (char as Record<string, unknown>)?.id
      const name = (char as Record<string, unknown>)?.name
      const avatar = (char as Record<string, unknown>)?.avatar

      if (typeof id !== 'string' || typeof name !== 'string') continue

      const exists = chatListStore.sessions.some((s) => s.id === id)
      if (!exists) {
        chatListStore.addSession({
          id,
          name,
          avatar: typeof avatar === 'string' ? avatar : '🌸',
          lastMessage: '开始聊天吧~',
          time: '',
          unread: 0,
          online: true,
          pinned: false,
          avatarVersion: 0
        })
      }

      // 同步最新消息
      const chatData = useChatStore.getState().messagesByCharacter[id]
      if (chatData && chatData.length > 0) {
        const lastMsg = chatData[chatData.length - 1]
        const content = lastMsg.content.length > 20
          ? lastMsg.content.slice(0, 20) + '...'
          : lastMsg.content
        useChatListStore.getState().updateLastMessage(id, content)
      }
    }
  } catch (error) {
    console.error('加载角色列表失败:', error)
  }
}

export default App
