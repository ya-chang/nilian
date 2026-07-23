// src/renderer/components/plugins/PluginPage.tsx
// 插件管理页面 — 安装/卸载/启用/禁用插件

import { useEffect, useState, useRef } from 'react'
import { usePluginStore } from '../../stores/pluginStore'
import { PluginCard } from './PluginCard'
import { InstallConfirm } from './InstallConfirm'
import { ScopeSelector } from './ScopeSelector'
import { PluginSettingsPage } from './PluginSettingsPage'
import { openPluginFileDialog, installPlugin as installPluginIPC, getPluginInfo, type PluginInfo } from '../../ipc/plugin'
import './PluginPage.css'

interface PluginPageProps {
  onClose: () => void
}

export function PluginPage({ onClose }: PluginPageProps): React.JSX.Element {
  const { plugins, isLoading, error, successMessage, loadPlugins, uninstall, toggleEnabled, switchTarget, clearError, clearSuccess } = usePluginStore()
  const [dragging, setDragging] = useState(false)
  const [confirmInfo, setConfirmInfo] = useState<PluginInfo | null>(null)
  const [pendingPermissions, setPendingPermissions] = useState<Record<string, boolean> | null>(null)
  const [scopeSelector, setScopeSelector] = useState<{ pluginId: string; pluginName: string } | null>(null)
  const [settingsPluginId, setSettingsPluginId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadPlugins()
  }, [])

  // 自动清除提示
  useEffect(() => {
    if (error) {
      const t = setTimeout(clearError, 4000)
      return () => clearTimeout(t)
    }
  }, [error])

  useEffect(() => {
    if (successMessage) {
      const t = setTimeout(clearSuccess, 3000)
      return () => clearTimeout(t)
    }
  }, [successMessage])

  // ─── 安装流程 ───

  const handleInstall = async (filePath: string): Promise<void> => {
    // 1. 先解析插件获取 meta
    const result = await window.electronAPI?.invoke('plugin:install', { filePath }) as {
      success: boolean
      meta?: { id: string; name: string; version: string }
      error?: string
    }

    if (result?.success && result.meta) {
      // 2. 获取完整信息用于确认弹窗
      const info = await getPluginInfo(result.meta.id)
      if (info) {
        setConfirmInfo(info)
      } else {
        // 无法获取完整信息，刷新列表让用户手动启用
        await loadPlugins()
        usePluginStore.setState({ successMessage: `插件 "${result.meta.name}" 已安装，请手动启用` })
      }
    } else if (result?.error) {
      usePluginStore.setState({ error: result.error })
    }
  }

  const handleConfirmInstall = async (permissions: Record<string, boolean>): Promise<void> => {
    if (!confirmInfo) return

    try {
      // 设置权限
      for (const [perm, granted] of Object.entries(permissions)) {
        await window.electronAPI?.invoke('plugin:set-permission', {
          pluginId: confirmInfo.meta.id,
          permission: perm,
          granted
        })
      }

      // 启用插件
      if (confirmInfo.meta.scope === 'character') {
        setScopeSelector({ pluginId: confirmInfo.meta.id, pluginName: confirmInfo.meta.name })
      } else {
        const enableResult = await window.electronAPI?.invoke('plugin:enable', { pluginId: confirmInfo.meta.id })
        if (enableResult && typeof enableResult === 'object' && 'success' in enableResult && !(enableResult as { success: boolean }).success) {
          usePluginStore.setState({ error: (enableResult as { error?: string }).error || '启用失败' })
        }
      }

      setConfirmInfo(null)
      setPendingPermissions(null)
      await loadPlugins()
      usePluginStore.setState({ successMessage: '插件安装成功' })
    } catch (err) {
      usePluginStore.setState({ error: `安装失败: ${err instanceof Error ? err.message : String(err)}` })
      setConfirmInfo(null)
      await loadPlugins()
    }
  }

  const handleScopeSelect = async (characterId: string): Promise<void> => {
    if (!scopeSelector) return
    await window.electronAPI?.invoke('plugin:enable', {
      pluginId: scopeSelector.pluginId,
      characterId
    })
    setScopeSelector(null)
    await loadPlugins()
  }

  // ─── 文件选择 ───

  const handleFileSelect = async (): Promise<void> => {
    const result = await openPluginFileDialog()
    if (result.success && result.filePath) {
      await handleInstall(result.filePath)
    }
  }

  // ─── 拖拽 ───

  const handleDragOver = (e: React.DragEvent): void => {
    e.preventDefault()
    setDragging(true)
  }

  const handleDragLeave = (): void => {
    setDragging(false)
  }

  const handleDrop = async (e: React.DragEvent): Promise<void> => {
    e.preventDefault()
    setDragging(false)

    const files = Array.from(e.dataTransfer.files)
    const jsFile = files.find(f => f.name.endsWith('.js'))
    if (jsFile) {
      // Electron 中文件有 path 属性
      const filePath = (jsFile as unknown as { path: string }).path
      if (filePath) {
        await handleInstall(filePath)
      }
    }
  }

  // ─── 分组 ───

  const normalPlugins = plugins.filter(p => p.type !== 'sensor')
  const sensorPlugins = plugins.filter(p => p.type === 'sensor')

  return (
    <div className="plugin-overlay" onClick={onClose}>
      <div className="plugin-panel" onClick={e => e.stopPropagation()}>
        <div className="plugin-header">
          <h3>插件管理</h3>
          <button className="plugin-close" onClick={onClose}>×</button>
        </div>

        <div className="plugin-content">
          {/* 安装区域 */}
          <div
            className={`plugin-install-zone ${dragging ? 'plugin-install-zone--dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleFileSelect}
          >
            <div className="plugin-install-icon">📦</div>
            <div className="plugin-install-text">
              拖拽 .js 文件到此处安装<br />
              或 <span>选择文件安装</span>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".js"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) {
                const filePath = (file as unknown as { path: string }).path
                if (filePath) handleInstall(filePath)
              }
            }}
          />

          {/* 普通插件 */}
          {normalPlugins.length > 0 && (
            <>
              <div className="plugin-group-header">
                普通插件 <span className="plugin-group-count">{normalPlugins.length}</span>
              </div>
              {normalPlugins.map(plugin => (
                <PluginCard
                  key={plugin.id}
                  plugin={plugin}
                  onToggle={toggleEnabled}
                  onUninstall={uninstall}
                  onOpenSettings={(id) => setSettingsPluginId(id)}
                />
              ))}
            </>
          )}

          {/* 感知插件 */}
          <div className="plugin-group-header">
            感知插件 <span className="plugin-group-count">{sensorPlugins.length}/1</span>
          </div>
          {sensorPlugins.length > 0 ? (
            sensorPlugins.map(plugin => (
              <PluginCard
                key={plugin.id}
                plugin={plugin}
                onToggle={toggleEnabled}
                onUninstall={uninstall}
              />
            ))
          ) : (
            <div className="plugin-empty">暂无感知插件</div>
          )}

          {/* 空状态 */}
          {plugins.length === 0 && !isLoading && (
            <div className="plugin-empty">暂无已安装的插件</div>
          )}
        </div>
      </div>

      {/* 安装确认弹窗 */}
      {confirmInfo && (
        <InstallConfirm
          pluginInfo={confirmInfo}
          onConfirm={handleConfirmInstall}
          onCancel={() => { setConfirmInfo(null); setPendingPermissions(null) }}
        />
      )}

      {/* 角色选择弹窗 */}
      {scopeSelector && (
        <ScopeSelector
          pluginName={scopeSelector.pluginName}
          onSelect={handleScopeSelect}
          onSkip={() => setScopeSelector(null)}
        />
      )}

      {/* 消息提示 */}
      {error && <div className="plugin-toast plugin-toast--error">{error}</div>}
      {successMessage && <div className="plugin-toast plugin-toast--success">{successMessage}</div>}

      {/* 插件设置页面 */}
      {settingsPluginId && (
        <PluginSettingsPage
          pluginId={settingsPluginId}
          onClose={() => setSettingsPluginId(null)}
        />
      )}
    </div>
  )
}