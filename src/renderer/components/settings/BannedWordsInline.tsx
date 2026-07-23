// src/renderer/components/settings/BannedWordsInline.tsx
// 禁词箱子 — 内联版，嵌入设置面板

import { useState, useEffect } from 'react'
import './BannedWordsInline.css'

interface BannedWord {
  word: string
  action: 'remove' | 'replace'
  replacement?: string
}

export function BannedWordsInline(): React.JSX.Element {
  const [words, setWords] = useState<BannedWord[]>([])
  const [newWord, setNewWord] = useState('')

  useEffect(() => {
    loadWords()
  }, [])

  const loadWords = async (): Promise<void> => {
    try {
      const result = await window.electronAPI?.invoke('bannedWords:list') as {
        success: boolean
        data?: BannedWord[]
      }
      if (result?.success && result.data) {
        setWords(result.data)
      }
    } catch { /* ignore */ }
  }

  const handleAdd = async (): Promise<void> => {
    if (!newWord.trim()) return
    try {
      await window.electronAPI?.invoke('bannedWords:add', {
        word: newWord.trim(),
        action: 'remove'
      })
      setNewWord('')
      loadWords()
    } catch { /* ignore */ }
  }

  const handleRemove = async (word: string): Promise<void> => {
    try {
      await window.electronAPI?.invoke('bannedWords:remove', { word })
      loadWords()
    } catch { /* ignore */ }
  }

  return (
    <div className="banned-inline">
      <div className="banned-inline__list">
        {words.map((w) => (
          <span key={w.word} className="banned-inline__tag">
            {w.word}
            <button className="banned-inline__remove" onClick={() => handleRemove(w.word)}>×</button>
          </span>
        ))}
        {words.length === 0 && (
          <span className="banned-inline__empty">暂无禁词</span>
        )}
      </div>
      <div className="banned-inline__add">
        <input
          className="banned-inline__input"
          type="text"
          value={newWord}
          onChange={(e) => setNewWord(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="输入禁词，回车添加"
        />
      </div>
    </div>
  )
}