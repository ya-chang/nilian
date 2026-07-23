// src/renderer/components/chat/QuoteMessage.tsx
// 引用消息展示 — 微信风格

import './QuoteMessage.css'

interface QuoteMessageProps {
  quotedContent: string
  quotedRole: 'user' | 'assistant'
}

export function QuoteMessage({ quotedContent, quotedRole }: QuoteMessageProps): React.JSX.Element {
  return (
    <div className="quote-message">
      <div className="quote-message__bar" />
      <div className="quote-message__content">
        <span className="quote-message__role">
          {quotedRole === 'user' ? '我' : '对方'}
        </span>
        <span className="quote-message__text">
          {quotedContent.length > 50
            ? quotedContent.slice(0, 50) + '...'
            : quotedContent}
        </span>
      </div>
    </div>
  )
}