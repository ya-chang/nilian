// src/renderer/components/chat/LoadingSpinner.tsx
// 加载状态组件 — 各种场景的加载提示

import './LoadingSpinner.css'

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large'
  text?: string
}

export function LoadingSpinner({ size = 'medium', text }: LoadingSpinnerProps): React.JSX.Element {
  return (
    <div className={`loading-spinner loading-spinner--${size}`}>
      <div className="loading-spinner__circle" />
      {text && <div className="loading-spinner__text">{text}</div>}
    </div>
  )
}