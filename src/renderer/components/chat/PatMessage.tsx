// src/renderer/components/chat/PatMessage.tsx
// 拍一拍消息 — 居中灰色小字，时间在文字上面

import React from 'react'
import './PatMessage.css'

interface PatMessageProps {
  from: string
  to: string
  suffix: string
  time?: string
}

export function PatMessage({ from, to, suffix, time }: PatMessageProps): React.JSX.Element {
  return (
    <div className="pat-message">
      {time && <span className="pat-message__time">{time}</span>}
      <span className="pat-message__text">
        {from} 拍了拍 {to}{suffix ? `的${suffix}` : ''}
      </span>
    </div>
  )
}
