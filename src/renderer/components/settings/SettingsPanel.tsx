// src/renderer/components/settings/SettingsPanel.tsx
// 设置面板 — 主题 + 字体大小 + 聊天背景 + 数据管理

import React, { useState, useEffect, useRef } from 'react'
import { useChatSessionStore } from '../../stores/chatSessionStore'
import { useChatBgStore } from '../../stores/chatBgStore'
import './SettingsPanel.css'

interface SettingsPanelProps {
  onClose: () => void
}

// 聊天背景预设
const BG_PRESETS = [
  { id: 'default', label: '默认', value: '#FFFFFF' },
  { id: 'warm', label: '暖色', value: '#FFF8F0' },
  { id: 'cool', label: '冷色', value: '#F0F8FF' },
  { id: 'green', label: '清新', value: '#F0FFF0' },
  { id: 'pink', label: '粉色', value: '#FFF0F5' },
  { id: 'dark', label: '深色', value: '#1A1A1A' },
]

export function SettingsPanel({ onClose }: SettingsPanelProps): React.JSX.Element {
  const [theme, setTheme] = useState('default')
  const [fontSize, setFontSize] = useState(14)
  const [chatBg, setChatBg] = useState('#FFFFFF')
  const [dataDir, setDataDir] = useState('F:\\mimo\\xm\\data\\app')
  const [exportStatus, setExportStatus] = useState('')
  const [importStatus, setImportStatus] = useState('')
  const currentSession = useChatSessionStore((s) => s.currentSession)
  const chatBgStore = useChatBgStore()
  const bgInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const saved = localStorage.getItem('app-settings')
    if (saved) {
      const settings = JSON.parse(saved)
      const t = settings.theme || 'default'
      setTheme(t)
      document.documentElement.setAttribute('data-theme', t)
      setFontSize(settings.fontSize || 14)
    }
    if (currentSession?.id) {
      const bg = chatBgStore.getBg(currentSession.id)
      setChatBg(bg)
    }
  }, [currentSession?.id])

  const saveSettings = (updates: Record<string, unknown>): void => {
    const saved = localStorage.getItem('app-settings')
    const settings = saved ? JSON.parse(saved) : {}
    const newSettings = { ...settings, ...updates }
    localStorage.setItem('app-settings', JSON.stringify(newSettings))
  }

  const handleThemeChange = (newTheme: string): void => {
    setTheme(newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
    saveSettings({ theme: newTheme })
  }

  const handleFontSizeChange = (size: number): void => {
    setFontSize(size)
    document.documentElement.style.setProperty('--font-size-base', `${size}px`)
    saveSettings({ fontSize: size })
  }

  const handleChatBgChange = (bg: string): void => {
    setChatBg(bg)
    if (currentSession?.id) {
      chatBgStore.setBg(currentSession.id, bg)
    }
  }

  const handleCustomBgUpload = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        setChatBg(result)
        if (currentSession?.id) {
          chatBgStore.setBg(currentSession.id, result)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleExport = async (): Promise<void> => {
    setExportStatus('导出中...')
    try {
      const result = await window.electronAPI?.invoke('data:export')
      if (result && typeof result === 'object' && 'success' in result) {
        setExportStatus(result.success ? '导出成功' : '导出失败')
      }
    } catch {
      setExportStatus('导出失败')
    }
    setTimeout(() => setExportStatus(''), 3000)
  }

  const handleChooseDataDir = async (): Promise<void> => {
    const result = await window.electronAPI?.invoke('data:chooseDir')
    const r = result as Record<string, unknown>
    if (r?.success && r.path) {
      setDataDir(r.path as string)
    }
  }

  const handleImport = async (): Promise<void> => {
    setImportStatus('导入中...')
    try {
      const result = await window.electronAPI?.invoke('data:import')
      if (result && typeof result === 'object' && 'success' in result) {
        setImportStatus(result.success ? '导入成功' : '导入失败')
      }
    } catch {
      setImportStatus('导入失败')
    }
    setTimeout(() => setImportStatus(''), 3000)
  }

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h3>设置</h3>
          <button className="settings-close" onClick={onClose}>×</button>
        </div>

        <div className="settings-content">
          {/* 主题 */}
          <div className="settings-section">
            <h4>主题</h4>
            <div className="settings-theme-list">
              {[
                { id: 'default', label: '默认绿', color: '#07C160' },
                { id: 'dark', label: '暗色', color: '#1A1A1A' },
                { id: 'pink', label: '粉色', color: '#FF6B9D' },
              ].map((t) => (
                <div key={t.id} className={`settings-theme-item ${theme === t.id ? 'settings-theme-item--active' : ''}`} onClick={() => handleThemeChange(t.id)}>
                  <div className="settings-theme-color" style={{ background: t.color }} />
                  <span>{t.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 字体大小 */}
          <div className="settings-section">
            <h4>字体大小</h4>
            <div className="settings-font-preview" style={{ fontSize: `${fontSize}px` }}>
              预览文字 Aa 字体大小
            </div>
            <div className="settings-slider-row">
              <span className="settings-slider-label">小</span>
              <input
                type="range"
                min="12"
                max="20"
                value={fontSize}
                onChange={(e) => handleFontSizeChange(Number(e.target.value))}
                className="settings-slider"
              />
              <span className="settings-slider-label">大</span>
              <span className="settings-slider-value">{fontSize}px</span>
            </div>
          </div>

          {/* 聊天背景 */}
          <div className="settings-section">
            <h4>聊天背景</h4>
            {currentSession && (
              <p className="settings-hint">当前角色：{currentSession.name}（背景独立设置）</p>
            )}
            <div className="settings-bg-list">
              {BG_PRESETS.map((bg) => (
                <div
                  key={bg.id}
                  className={`settings-bg-item ${chatBg === bg.value ? 'settings-bg-item--active' : ''}`}
                  onClick={() => handleChatBgChange(bg.value)}
                >
                  <div className="settings-bg-preview" style={{ background: bg.value }} />
                  <span>{bg.label}</span>
                </div>
              ))}
              <div className="settings-bg-item" onClick={() => bgInputRef.current?.click()}>
                <div className="settings-bg-preview settings-bg-preview--custom">+</div>
                <span>自定义</span>
              </div>
            </div>
            <input
              ref={bgInputRef}
              type="file"
              accept="image/*"
              onChange={handleCustomBgUpload}
              style={{ display: 'none' }}
            />
          </div>

          {/* 数据管理 */}
          <div className="settings-section">
            <h4>数据管理</h4>
            <p className="settings-hint">所有用户数据统一存放在一个目录下，按类型分文件夹</p>
            <div className="settings-data-actions">
              <div className="settings-data-item" onClick={handleChooseDataDir} style={{ cursor: 'pointer' }}>
                <div>
                  <div className="settings-data-title">数据存放目录</div>
                  <div className="settings-data-desc">{dataDir}</div>
                </div>
                <button className="settings-btn">选择目录</button>
              </div>
              <div className="settings-data-item">
                <div>
                  <div className="settings-data-title">导出数据</div>
                  <div className="settings-data-desc">导出所有角色、记忆、朋友圈数据</div>
                </div>
                <button className="settings-btn" onClick={handleExport} disabled={!!exportStatus}>
                  {exportStatus || '导出'}
                </button>
              </div>
              <div className="settings-data-item">
                <div>
                  <div className="settings-data-title">导入数据</div>
                  <div className="settings-data-desc">从备份文件恢复数据</div>
                </div>
                <button className="settings-btn" onClick={handleImport} disabled={!!importStatus}>
                  {importStatus || '导入'}
                </button>
              </div>
            </div>
          </div>

          {/* 关于 / 反馈 */}
          <div className="settings-section settings-about">
            <h4>关于拟恋</h4>
            <div className="settings-about__info">
              <div className="settings-about__item">
                <span className="settings-about__label">版本</span>
                <span className="settings-about__value">1.0.0</span>
              </div>
              <div className="settings-about__item">
                <span className="settings-about__label">制作人</span>
                <span className="settings-about__value">鸭肠yac</span>
              </div>
              <div className="settings-about__item">
                <span className="settings-about__label">联系邮箱</span>
                <span className="settings-about__value">3117797385@qq.com</span>
              </div>
            </div>
            <p className="settings-about__desc">
              感谢使用拟恋！如果你有任何建议或问题，欢迎通过邮箱联系我们。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
