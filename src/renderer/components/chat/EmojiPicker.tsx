// src/renderer/components/chat/EmojiPicker.tsx
// 表情选择器 — 常用表情面板

import React from 'react'
import './EmojiPicker.css'

interface EmojiPickerProps {
  onSelect: (emoji: string) => void
  onClose: () => void
}

const EMOJI_LIST = [
  '😊', '😂', '🤣', '❤️', '😍', '😘', '🥰', '😋',
  '😎', '🤔', '😢', '😭', '😡', '🥺', '😏', '😤',
  '👍', '👎', '🙏', '💪', '🤗', '😴', '🎉', '🔥',
  '💕', '💔', '✨', '🌟', '☀️', '🌙', '🍀', '🌸',
  '🌹', '🍉', '🍕', '🎂', '☕', '🍺', '🎵', '📱',
  '😀', '😁', '😆', '😅', '😉', '😇', '🥰', '😘',
  '😗', '😙', '😚', '😋', '😛', '😜', '🤪', '😝',
  '🤑', '🤭', '🤫', '🤐', '🤨', '🙄', '😬', '😮‍💨',
]

export function EmojiPicker({ onSelect, onClose }: EmojiPickerProps): React.JSX.Element {
  const handleSelect = (emoji: string): void => {
    onSelect(emoji)
    onClose()
  }

  return (
    <div className="emoji-picker">
      <div className="emoji-picker__grid">
        {EMOJI_LIST.map((emoji, index) => (
          <button
            key={`${emoji}-${index}`}
            className="emoji-picker__item"
            onClick={() => handleSelect(emoji)}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  )
}
