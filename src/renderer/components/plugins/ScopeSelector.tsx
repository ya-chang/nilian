// src/renderer/components/plugins/ScopeSelector.tsx
// 角色选择弹窗 — character 插件安装后选择作用角色

import { useState, useEffect } from 'react'

interface Character {
  id: string
  name: string
  avatar: string
}

interface ScopeSelectorProps {
  pluginName: string
  onSelect: (characterId: string) => void
  onSkip: () => void
}

export function ScopeSelector({ pluginName, onSelect, onSkip }: ScopeSelectorProps): React.JSX.Element {
  const [characters, setCharacters] = useState<Character[]>([])
  const [selected, setSelected] = useState<string>('')

  useEffect(() => {
    loadCharacters()
  }, [])

  const loadCharacters = async (): Promise<void> => {
    try {
      const result = await window.electronAPI?.invoke('character:list')
      if (Array.isArray(result)) {
        setCharacters(result as Character[])
      }
    } catch {
      // ignore
    }
  }

  const handleConfirm = (): void => {
    if (selected) {
      onSelect(selected)
    }
  }

  return (
    <div className="plugin-confirm-overlay" onClick={onSkip}>
      <div className="plugin-confirm" onClick={e => e.stopPropagation()}>
        <h3>选择作用对象</h3>

        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: 16 }}>
          插件「{pluginName}」只对选定的角色生效：
        </p>

        <div className="plugin-scope-options">
          {characters.map(char => (
            <div
              key={char.id}
              className={`plugin-scope-option ${selected === char.id ? 'plugin-scope-option--active' : ''}`}
              onClick={() => setSelected(char.id)}
            >
              <div className="plugin-scope-radio" />
              <span>{char.avatar} {char.name}</span>
            </div>
          ))}
        </div>

        <div className="plugin-confirm__actions" style={{ marginTop: 20 }}>
          <button className="plugin-btn" onClick={onSkip}>跳过，稍后设置</button>
          <button
            className="plugin-btn plugin-btn--primary"
            disabled={!selected}
            onClick={handleConfirm}
          >
            确认
          </button>
        </div>
      </div>
    </div>
  )
}