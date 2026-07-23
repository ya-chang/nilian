// src/renderer/components/plugins/InstallConfirm.tsx
// 安装确认弹窗 — 显示插件信息 + 权限开关 + 安全提示

import { useState } from 'react'
import type { PluginInfo } from '../../ipc/plugin'

interface InstallConfirmProps {
  pluginInfo: PluginInfo
  onConfirm: (permissions: Record<string, boolean>) => void | Promise<void>
  onCancel: () => void
}

const RISK_LABELS: Record<string, string> = {
  'chat.read': '读取聊天记录',
  'chat.send': '发送消息',
  'ai.prompt': '修改AI的Prompt',
  'ai.behavior': '添加AI行为策略',
  'ai.context': '注入AI上下文',
  'ui.nav': '添加导航页面',
  'ui.theme': '修改主题/注入CSS',
  'ui.message': '注册自定义消息类型',
  'data.read': '读取角色数据、记忆',
  'data.write': '写入角色数据、记忆',
  'api.request': '发起外部HTTP请求',
  'file.read': '读取本地文件',
  'file.write': '写入本地文件',
  'sensor.system': '监听系统行为'
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

export function InstallConfirm({ pluginInfo, onConfirm, onCancel }: InstallConfirmProps): React.JSX.Element {
  const { meta } = pluginInfo
  const [permissions, setPermissions] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {}
    for (const perm of meta.permissions || []) {
      init[perm] = true
    }
    return init
  })
  const [confirmed, setConfirmed] = useState(false)

  const togglePerm = (perm: string): void => {
    setPermissions(prev => ({ ...prev, [perm]: !prev[perm] }))
  }

  const handleConfirm = async (): Promise<void> => {
    if (!confirmed) return
    try {
      await onConfirm(permissions)
    } catch (err) {
      console.error('[安装确认] onConfirm 失败:', err)
    }
  }

  const scopeLabel = meta.scope === 'character' ? '单角色（安装后选择角色）' : '全局（对所有角色生效）'
  const typeLabel = meta.type === 'sensor' ? '感知插件' : '普通插件'

  return (
    <div className="plugin-confirm-overlay" onClick={onCancel}>
      <div className="plugin-confirm" onClick={e => e.stopPropagation()}>
        <h3>安装插件</h3>

        <div className="plugin-confirm__card">
          <div className="plugin-confirm__card-name">{meta.name}</div>
          <div className="plugin-confirm__card-meta">
            版本：{meta.version} · 作者：{meta.author || '未知'} · {typeLabel} · {scopeLabel}
          </div>
          {meta.description && (
            <div className="plugin-confirm__card-desc">{meta.description}</div>
          )}
        </div>

        {(meta.permissions?.length ?? 0) > 0 && (
          <div className="plugin-confirm__section">
            <h4>此插件请求以下权限（可单独关闭）：</h4>
            {meta.permissions!.map(perm => (
              <div key={perm} className="plugin-confirm__perm-row">
                <div className="plugin-confirm__perm-info">
                  <span className="plugin-confirm__perm-label">
                    {RISK_LABELS[perm] || perm}
                    <span className={`plugin-confirm__risk plugin-confirm__risk--${RISK_LEVELS[perm] || 'medium'}`}>
                      {RISK_LEVELS[perm] === 'high' ? '高风险' : RISK_LEVELS[perm] === 'medium' ? '中风险' : '低风险'}
                    </span>
                  </span>
                </div>
                <button
                  className={`plugin-confirm-toggle ${permissions[perm] ? 'plugin-confirm-toggle--on' : ''}`}
                  onClick={() => togglePerm(perm)}
                />
              </div>
            ))}
          </div>
        )}

        <div className="plugin-confirm__warn">
          安全提示：<br />
          · 插件在本地运行，数据存储在本地<br />
          · 插件可以访问你的聊天数据和API配置<br />
          · 请确认你信任此插件的作者<br />
          · 你可以随时禁用或卸载插件
        </div>

        <label className="plugin-confirm__checkbox">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={e => setConfirmed(e.target.checked)}
          />
          我已了解风险，确认安装
        </label>

        <div className="plugin-confirm__actions">
          <button className="plugin-btn" onClick={onCancel}>取消</button>
          <button
            className="plugin-btn plugin-btn--primary"
            disabled={!confirmed}
            onClick={handleConfirm}
          >
            安装
          </button>
        </div>
      </div>
    </div>
  )
}