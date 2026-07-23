// src/renderer/components/settings/BannedWords.tsx
// 禁词箱子设置

import { useState, useEffect } from 'react'
import './BannedWords.css'

interface BannedWord {
  word: string
  action: 'remove' | 'replace'
  replacement?: string
}

interface BannedWordsProps {
  onClose: () => void
}

export function BannedWords({ onClose }: BannedWordsProps): React.JSX.Element {
  const [words, setWords] = useState<BannedWord[]>([])
  const [newWord, setNewWord] = useState('')
  const [newAction, setNewAction] = useState<'remove' | 'replace'>('remove')
  const [newReplacement, setNewReplacement] = useState('')
  const [globalAction, setGlobalAction] = useState<'remove' | 'replace'>('remove')
  const [globalReplacement, setGlobalReplacement] = useState('')

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

    const action = newAction === 'replace' && newReplacement.trim() ? 'replace' : 'remove'
    const replacement = action === 'replace' ? newReplacement.trim() : undefined

    try {
      await window.electronAPI?.invoke('bannedWords:add', {
        word: newWord.trim(),
        action,
        replacement
      })
      setNewWord('')
      setNewReplacement('')
      loadWords()
    } catch { /* ignore */ }
  }

  const handleRemove = async (word: string): Promise<void> => {
    try {
      await window.electronAPI?.invoke('bannedWords:remove', { word })
      loadWords()
    } catch { /* ignore */ }
  }

  const handleApplyGlobal = async (): Promise<void> => {
    // 对所有现有禁词应用统一的操作
    for (const w of words) {
      if (w.action !== globalAction) {
        await window.electronAPI?.invoke('bannedWords:remove', { word: w.word })
        await window.electronAPI?.invoke('bannedWords:add', {
          word: w.word,
          action: globalAction,
          replacement: globalAction === 'replace' ? globalReplacement : undefined
        })
      }
    }
    loadWords()
  }

  return (
    <div className="banned-words">
      <div className="banned-words__header">
        <button className="banned-words__back" onClick={onClose}>← 返回</button>
        <h3 className="banned-words__title">禁词箱子</h3>
      </div>

      <p className="banned-words__desc">AI不会在回复中使用以下词语</p>

      <div className="banned-words__list">
        {words.map((w) => (
          <div key={w.word} className="banned-words__item">
            <span className="banned-words__word">{w.word}</span>
            <span className="banned-words__action">
              {w.action === 'remove' ? '删除' : `替换为「${w.replacement}」`}
            </span>
            <button className="banned-words__remove" onClick={() => handleRemove(w.word)}>删除</button>
          </div>
        ))}
        {words.length === 0 && (
          <div className="banned-words__empty">暂无禁词</div>
        )}
      </div>

      <div className="banned-words__add">
        <input
          className="banned-words__input"
          type="text"
          value={newWord}
          onChange={(e) => setNewWord(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="输入禁词..."
        />
        <button className="banned-words__add-btn" onClick={handleAdd} disabled={!newWord.trim()}>添加</button>
      </div>

      <div className="banned-words__global">
        <div className="banned-words__global-label">处理方式：</div>
        <label className="banned-words__radio">
          <input type="radio" name="globalAction" value="remove" checked={globalAction === 'remove'} onChange={() => setGlobalAction('remove')} />
          删除该词
        </label>
        <label className="banned-words__radio">
          <input type="radio" name="globalAction" value="replace" checked={globalAction === 'replace'} onChange={() => setGlobalAction('replace')} />
          替换为：
        </label>
        {globalAction === 'replace' && (
          <input
            className="banned-words__replace-input"
            type="text"
            value={globalReplacement}
            onChange={(e) => setGlobalReplacement(e.target.value)}
            placeholder="替换词"
          />
        )}
      </div>
    </div>
  )
}