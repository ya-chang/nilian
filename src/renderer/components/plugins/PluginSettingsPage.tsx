// src/renderer/components/plugins/PluginSettingsPage.tsx
// 插件设置页面 — 从插件管理页点"设置"进入

import { useEffect, useState } from 'react'
import { PluginConfigPanel } from './PluginConfigPanel'
import { getPluginInfo, getPluginConfigSchema, getMergedConfig, setPluginConfig } from '../../ipc/plugin'

interface PluginSettingsPageProps {
  pluginId: string
  onClose: () => void
}

interface ConfigField {
  key: string
  label: string
  type: 'text' | 'number' | 'toggle' | 'select' | 'color' | 'textarea'
  default?: unknown
  placeholder?: string
  options?: Array<{ label: string; value: unknown }>
}

export function PluginSettingsPage({ pluginId, onClose }: PluginSettingsPageProps): React.JSX.Element {
  const [plugin, setPlugin] = useState<{ meta: { name: string; configSchema?: ConfigField[] } } | null>(null)
  const [config, setConfig] = useState<Record<string, unknown>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPlugin()
  }, [pluginId])

  const loadPlugin = async (): Promise<void> => {
    setLoading(true)
    try {
      const info = await getPluginInfo(pluginId)
      const schema = await getPluginConfigSchema(pluginId) as ConfigField[]
      const mergedConfig = await getMergedConfig(pluginId)

      if (info) {
        setPlugin({ meta: { ...info.meta, configSchema: schema } })
        setConfig(mergedConfig)
      }
    } catch {
      // ignore
    }
    setLoading(false)
  }

  const handleSave = async (newConfig: Record<string, unknown>): Promise<void> => {
    await setPluginConfig(pluginId, newConfig)
    setConfig(newConfig)
  }

  const handleReset = async (): Promise<void> => {
    if (!plugin?.meta.configSchema) return
    const defaults: Record<string, unknown> = {}
    for (const field of plugin.meta.configSchema) {
      defaults[field.key] = field.default
    }
    await setPluginConfig(pluginId, defaults)
    setConfig(defaults)
  }

  if (loading) {
    return (
      <div className="plugin-overlay" onClick={onClose}>
        <div className="plugin-panel" onClick={e => e.stopPropagation()} style={{ padding: 40, textAlign: 'center' }}>
          加载中...
        </div>
      </div>
    )
  }

  if (!plugin) {
    return (
      <div className="plugin-overlay" onClick={onClose}>
        <div className="plugin-panel" onClick={e => e.stopPropagation()} style={{ padding: 40, textAlign: 'center' }}>
          插件不存在
          <br />
          <button className="plugin-btn" style={{ marginTop: 12 }} onClick={onClose}>返回</button>
        </div>
      </div>
    )
  }

  const schema = plugin.meta.configSchema || []

  if (schema.length === 0) {
    return (
      <div className="plugin-overlay" onClick={onClose}>
        <div className="plugin-panel" onClick={e => e.stopPropagation()}>
          <div className="plugin-header">
            <button className="plugin-btn" onClick={onClose}>← 返回</button>
            <h3>{plugin.meta.name} · 设置</h3>
            <div style={{ width: 28 }} />
          </div>
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
            此插件没有可配置的选项
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="plugin-overlay" onClick={onClose}>
      <div className="plugin-panel" onClick={e => e.stopPropagation()}>
        <div className="plugin-header">
          <button className="plugin-btn" onClick={onClose}>← 返回</button>
          <h3>{plugin.meta.name} · 设置</h3>
          <div style={{ width: 28 }} />
        </div>
        <div className="plugin-content">
          <PluginConfigPanel
            pluginId={pluginId}
            pluginName={plugin.meta.name}
            configSchema={schema}
            currentConfig={config}
            onSave={handleSave}
            onReset={handleReset}
          />
        </div>
      </div>
    </div>
  )
}