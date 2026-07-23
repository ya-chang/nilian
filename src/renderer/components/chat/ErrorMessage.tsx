// src/renderer/components/chat/ErrorMessage.tsx
// 错误提示组件 — 友好的错误提示

import './ErrorMessage.css'

interface ErrorMessageProps {
  type: 'api_key' | 'network' | 'disk' | 'data' | 'model' | 'unknown'
  onRetry?: () => void
  onSettings?: () => void
}

const ERROR_CONFIG = {
  api_key: {
    icon: '🔑',
    title: 'API连接失败',
    subtitle: '请检查API Key是否正确',
    action: '去设置'
  },
  network: {
    icon: '📡',
    title: '网络已断开',
    subtitle: '消息将在恢复后发送',
    action: '重试'
  },
  disk: {
    icon: '💾',
    title: '存储空间不足',
    subtitle: '请清理磁盘空间',
    action: null
  },
  data: {
    icon: '⚠️',
    title: '数据异常',
    subtitle: '是否从备份恢复？',
    action: '恢复'
  },
  model: {
    icon: '🤖',
    title: '模型不支持',
    subtitle: '当前模型不支持此功能，请切换模型',
    action: '去设置'
  },
  unknown: {
    icon: '❌',
    title: '出了点问题',
    subtitle: '请稍后重试',
    action: '重试'
  }
}

export function ErrorMessage({ type, onRetry, onSettings }: ErrorMessageProps): React.JSX.Element {
  const config = ERROR_CONFIG[type]

  const handleAction = (): void => {
    if (type === 'api_key' || type === 'model') {
      onSettings?.()
    } else {
      onRetry?.()
    }
  }

  return (
    <div className="error-message">
      <div className="error-message__icon">{config.icon}</div>
      <div className="error-message__title">{config.title}</div>
      <div className="error-message__subtitle">{config.subtitle}</div>
      {config.action && (
        <button className="error-message__action" onClick={handleAction}>
          {config.action}
        </button>
      )}
    </div>
  )
}