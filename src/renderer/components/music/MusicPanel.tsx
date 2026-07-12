// src/renderer/components/music/MusicPanel.tsx
// 一起听歌面板 — 输入歌曲名 → 获取歌曲信息 → 注入聊天

import React, { useState, useEffect, useRef } from 'react'
import { useMusicStore, type SongInfo } from '../../stores/musicStore'
import './MusicPanel.css'

export function MusicPanel(): React.JSX.Element {
  const currentSong = useMusicStore((s) => s.currentSong)
  const setCurrentSong = useMusicStore((s) => s.setCurrentSong)
  const clearSong = useMusicStore((s) => s.clearSong)
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // 搜索歌曲
  const handleSearch = async (): Promise<void> => {
    if (!query.trim() || searching) return
    setSearching(true)
    setError('')

    try {
      const result = await window.electronAPI?.invoke('music:search', { query: query.trim() }) as {
        success: boolean
        data?: SongInfo
        error?: string
      }

      if (result?.success && result.data) {
        setCurrentSong(result.data)
        setQuery('')
      } else {
        setError(result?.error || '未找到歌曲信息')
      }
    } catch {
      setError('搜索失败，请检查网络')
    } finally {
      setSearching(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter') handleSearch()
  }

  return (
    <div className="music-panel">
      <div className="music-panel__header">
        <span className="music-panel__icon">🎵</span>
        <span className="music-panel__title">一起听歌</span>
      </div>

      <div className="music-panel__body">
        {/* 搜索框 */}
        <div className="music-panel__search">
          <input
            ref={inputRef}
            className="music-panel__input"
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setError('') }}
            onKeyDown={handleKeyDown}
            placeholder="输入歌曲名或歌手名..."
            disabled={searching}
          />
          <button
            className="music-panel__search-btn"
            onClick={handleSearch}
            disabled={searching || !query.trim()}
          >
            {searching ? '搜索中...' : '搜索'}
          </button>
        </div>

        {error && <div className="music-panel__error">{error}</div>}

        {/* 当前歌曲信息 */}
        {currentSong ? (
          <div className="music-panel__song">
            <div className="music-panel__song-header">
              <span className="music-panel__listening-dot" />
              <span className="music-panel__listening-text">正在一起听</span>
              <button className="music-panel__stop-btn" onClick={clearSong}>结束</button>
            </div>

            <div className="music-panel__song-info">
              <div className="music-panel__song-row">
                <span className="music-panel__song-label">歌曲</span>
                <span className="music-panel__song-value music-panel__song-value--name">{currentSong.name}</span>
              </div>
              <div className="music-panel__song-row">
                <span className="music-panel__song-label">歌手</span>
                <span className="music-panel__song-value">{currentSong.artist}</span>
              </div>
              {currentSong.album && (
                <div className="music-panel__song-row">
                  <span className="music-panel__song-label">专辑</span>
                  <span className="music-panel__song-value">{currentSong.album}</span>
                </div>
              )}
              {currentSong.genre && (
                <div className="music-panel__song-row">
                  <span className="music-panel__song-label">风格</span>
                  <span className="music-panel__song-value">{currentSong.genre}</span>
                </div>
              )}
              {currentSong.year && (
                <div className="music-panel__song-row">
                  <span className="music-panel__song-label">年份</span>
                  <span className="music-panel__song-value">{currentSong.year}</span>
                </div>
              )}
              {currentSong.description && (
                <div className="music-panel__song-desc">{currentSong.description}</div>
              )}
              {currentSong.lyricsSnippet && (
                <div className="music-panel__song-lyrics">
                  <span className="music-panel__song-label">歌词节选</span>
                  <div className="music-panel__lyrics-text">{currentSong.lyricsSnippet}</div>
                </div>
              )}
            </div>

            <div className="music-panel__hint">
              现在聊天时，TA会知道你在听这首歌
            </div>
          </div>
        ) : (
          <div className="music-panel__empty">
            <div className="music-panel__empty-icon">🎶</div>
            <div className="music-panel__empty-text">搜索一首歌，和TA一起听</div>
            <div className="music-panel__empty-hint">输入歌曲名或歌手名，AI会了解这首歌并和你聊</div>
          </div>
        )}
      </div>
    </div>
  )
}
