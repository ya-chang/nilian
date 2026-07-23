// src/renderer/components/chat/RedPacket.tsx
// 红包消息 — 红色卡片 + 祝福语

import { useState } from 'react'
import './RedPacket.css'

interface RedPacketProps {
  amount: number
  message: string
  opened: boolean
}

export function RedPacket({ amount, message, opened }: RedPacketProps): React.JSX.Element {
  const [isOpened, setIsOpened] = useState(opened)

  const handleOpen = (): void => {
    if (!isOpened) {
      setIsOpened(true)
    }
  }

  return (
    <div className={`red-packet ${isOpened ? 'red-packet--opened' : ''}`} onClick={handleOpen}>
      <div className="red-packet__icon">
        {isOpened ? '🧧' : '💰'}
      </div>
      <div className="red-packet__info">
        <div className="red-packet__message">{message || '恭喜发财'}</div>
        <div className="red-packet__amount">
          {isOpened ? `¥${amount.toFixed(2)}` : '点击领取'}
        </div>
      </div>
    </div>
  )
}