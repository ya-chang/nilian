// src/renderer/components/plugins/PluginConfigPanel.tsx
// 通用插件配置面板 — 根据 configSchema 自动生成配置 UI

import { useState, useEffect } from 'react'

interface ConfigField {
  key: string
  label: string
  type: 'text' | 'number' | 'toggle' | 'select' | 'color' | 'textarea'
  default?: unknown
  placeholder?: string
  options?: Array<{ label: string; value: unknown }>
  min?: number
  max?: number
}

interface PluginConfigPanelProps {
  pluginId: string
  pluginName: string
  configSchema: ConfigField[]
  currentConfig: Record<string, unknown>
  onSave: (config: Record<string, unknown>) => void
  onReset: () => void
}

export function PluginConfigPanel({
  pluginId,
  pluginName,
  configSchema,
  currentConfig,
  onSave,
  onReset
}: PluginConfigPanelProps): React.JSX.Element {
  const [config, setConfig] = useState<Record<string, unknown>>({})
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const initial: Record<string, unknown> = {}
    for (const field of configSchema) {
      initial[field.key] = currentConfig[field.key] ?? field.default ?? ''
    }
    setConfig(initial)
  }, [configSchema, currentConfig])

  const updateField = (key: string, value: unknown): void => {
    setConfig(prev => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  const handleSave = (): void => {
    onSave(config)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleReset = (): void => {
    onReset()
    const defaults: Record<string, unknown> = {}
    for (const field of configSchema) {
      defaults[field.key] = field.default ?? ''
    }
    setConfig(defaults)
    setSaved(false)
  }

  return (
    <div className="plugin-config-panel">
      <div className="plugin-config-header">
        <h3>插件设置 · {pluginName}</h3>
      </div>

      <div className="plugin-config-body">
        {configSchema.map(field => (
          <ConfigFieldItem
            key={field.key}
            field={field}
            value={config[field.key]}
            onChange={(val) => updateField(field.key, val)}
          />
        ))}
      </div>

      <div className="plugin-config-footer">
        {saved && <span className="plugin-config-saved">已保存 ✓</span>}
        <button className="plugin-config-btn-reset" onClick={handleReset}>
          恢复默认
        </button>
        <button className="plugin-config-btn-save" onClick={handleSave}>
          保存
        </button>
      </div>
    </div>
  )
}

// ─── 单个配置项 ───

interface ConfigFieldItemProps {
  field: ConfigField
  value: unknown
  onChange: (value: unknown) => void
}

function ConfigFieldItem({ field, value, onChange }: ConfigFieldItemProps): React.JSX.Element {
  return (
    <div className="plugin-config-field">
      <label className="plugin-config-label">{field.label}</label>

      {field.type === 'text' && (
        <input
          type="text"
          className="plugin-config-input"
          value={(value as string) || ''}
          placeholder={field.placeholder}
          onChange={e => onChange(e.target.value)}
        />
      )}

      {field.type === 'number' && (
        <input
          type="number"
          className="plugin-config-input"
          value={String(value ?? '')}
          min={field.min}
          max={field.max}
          onChange={e => onChange(Number(e.target.value))}
        />
      )}

      {field.type === 'toggle' && (
        <div className="plugin-config-toggle-row">
          <button
            className={`plugin-config-toggle ${value ? 'plugin-config-toggle--on' : ''}`}
            onClick={() => onChange(!value)}
          />
          <span className="plugin-config-toggle-label">
            {value ? '开启' : '关闭'}
          </span>
        </div>
      )}

      {field.type === 'select' && (
        <select
          className="plugin-config-select"
          value={(value as string) || ''}
          onChange={e => onChange(e.target.value)}
        >
          {field.options?.map(opt => (
            <option key={String(opt.value)} value={String(opt.value)}>
              {opt.label}
            </option>
          ))}
        </select>
      )}

      {field.type === 'color' && (
        <div className="plugin-config-color-row">
          <input
            type="color"
            className="plugin-config-color"
            value={(value as string) || '#000000'}
            onChange={e => onChange(e.target.value)}
          />
          <span className="plugin-config-color-value">{(value as string) || '#000000'}</span>
        </div>
      )}

      {field.type === 'textarea' && (
        <textarea
          className="plugin-config-textarea"
          value={(value as string) || ''}
          placeholder={field.placeholder}
          rows={4}
          onChange={e => onChange(e.target.value)}
        />
      )}
    </div>
  )
}