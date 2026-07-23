// src/renderer/components/plugins/PluginCard.tsx
// 插件卡片 — 显示单个插件的信息和操作按钮

import type { InstalledPlugin } from '../../ipc/plugin'

interface PluginCardProps {
  plugin: InstalledPlugin
  onToggle: (pluginId: string) => void
  onUninstall: (pluginId: string) => void
  onSwitchTarget?: (pluginId: string) => void
  onOpenSettings?: (pluginId: string) => void
}

const RISK_LABELS: Record<string, string> = {
  'chat.read': '读取聊天',
  'chat.send': '发送消息',
  'ai.prompt': '修改Prompt',
  'ai.behavior': '添加行为',
  'ai.context': '注入上下文',
  'ui.nav': '添加页面',
  'ui.theme': '修改主题',
  'ui.message': '消息类型',
  'data.read': '读取数据',
  'data.write': '写入数据',
  'api.request': '外部请求',
  'file.read': '读取文件',
  'file.write': '写入文件',
  'sensor.system': '系统监听'
}

const RISK_LEVELS: Record<string, string> = {
  'chat.read': 'medium',
  'chat.send': 'medium',
  'ai.prompt': 'medium',
  'ai.behavior': 'medium',
  'ai.context': 'medium',
  'ui.nav': 'low',
  'ui.theme': 'low',
  'ui.message': 'low',
  'data.read': 'medium',
  'data.write': 'high',
  'api.request': 'high',
  'file.read': 'high',
  'file.write': 'high',
  'sensor.system': 'high'
}

export function PluginCard({ plugin, onToggle, onUninstall, onSwitchTarget, onOpenSettings }: PluginCardProps): React.JSX.Element {
  return (
    <div className="plugin-card">
      <div className="plugin-card__top">
        <div className="plugin-card__info">
          <div className="plugin-card__name">{plugin.name}</div>
          <div className="plugin-card__meta">
            v{plugin.version} · {plugin.scope === 'global' ? '全局' : '单角色'}
            {plugin.type === 'sensor' && ' · 感知插件'}
            {plugin.priority !== 100 && ` · 优先级:${plugin.priority}`}
          </div>
        </div>
      </div>

      {plugin.permissions.length > 0 && (
        <div className="plugin-card__permissions">
          {plugin.permissions.map(perm => (
            <span
              key={perm}
              className={`plugin-card__perm-tag plugin-card__perm-tag--${RISK_LEVELS[perm] || 'medium'}`}
            >
              {RISK_LABELS[perm] || perm}
            </span>
          ))}
        </div>
      )}

      <div className="plugin-card__actions">
        <button
          className={`plugin-toggle ${plugin.enabled ? 'plugin-toggle--on' : ''}`}
          onClick={() => onToggle(plugin.id)}
          title={plugin.enabled ? '禁用' : '启用'}
        />

        {plugin.scope === 'character' && onSwitchTarget && (
          <button className="plugin-btn" onClick={() => onSwitchTarget(plugin.id)}>
            切换角色
          </button>
        )}

        {onOpenSettings && (
          <button className="plugin-btn" onClick={() => onOpenSettings(plugin.id)}>
            设置
          </button>
        )}

        <div style={{ flex: 1 }} />

        <button
          className="plugin-btn plugin-btn--danger"
          onClick={() => {
            if (confirm(`确定卸载插件「${plugin.name}」？\n插件数据将被删除。`)) {
              onUninstall(plugin.id)
            }
          }}
        >
          卸载
        </button>
      </div>
    </div>
  )
}