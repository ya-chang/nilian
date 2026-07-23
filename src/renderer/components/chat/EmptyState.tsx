// src/renderer/components/chat/EmptyState.tsx
// 空状态组件 — 各种场景的空状态提示

import './EmptyState.css'

interface EmptyStateProps {
  type: 'no-chats' | 'no-messages' | 'no-moments' | 'no-search' | 'no-knowledge'
}

const EMPTY_STATE_CONFIG = {
  'no-chats': {
    icon: '💬',
    title: '还没有聊天',
    subtitle: '点击+创建你的第一个对象'
  },
  'no-messages': {
    icon: '👋',
    title: '开始聊天吧',
    subtitle: '发送一条消息，和TA说说话'
  },
  'no-moments': {
    icon: '📷',
    title: '还没有动态',
    subtitle: '等TA发第一条朋友圈吧'
  },
  'no-search': {
    icon: '🔍',
    title: '没有找到相关消息',
    subtitle: '换个关键词试试'
  },
  'no-knowledge': {
    icon: '📚',
    title: '还没有上传文档',
    subtitle: 'AI会通过聊天慢慢了解你'
  }
}

export function EmptyState({ type }: EmptyStateProps): React.JSX.Element {
  const config = EMPTY_STATE_CONFIG[type]

  return (
    <div className="empty-state">
      <div className="empty-state__icon">{config.icon}</div>
      <div className="empty-state__title">{config.title}</div>
      <div className="empty-state__subtitle">{config.subtitle}</div>
    </div>
  )
}