// src/renderer/components/character/CharacterSelector.tsx
// 角色选择器 — +按钮弹出创建对话框

import React, { useState, useEffect } from 'react'
import { useCharacterStore, type CharacterConfig } from '../../stores/characterStore'
import { useChatListStore } from '../../stores/chatListStore'
import './CharacterSelector.css'

interface CharacterSelectorProps {
  unreadCount?: number
}

export function CharacterSelector({ unreadCount = 0 }: CharacterSelectorProps): React.JSX.Element {
  const {
    characters,
    activeCharacter,
    setCharacters,
    setActiveCharacter,
    setLoading
  } = useCharacterStore()
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    loadCharacters()
  }, [])

  const loadCharacters = async (): Promise<void> => {
    setLoading(true)
    try {
      const result = await window.electronAPI?.invoke('character:list')
      if (Array.isArray(result)) {
        setCharacters(result as CharacterConfig[])
      }
      const active = await window.electronAPI?.invoke('character:active')
      if (active && typeof active === 'object' && 'id' in active) {
        setActiveCharacter(active as CharacterConfig)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSwitch = async (id: string): Promise<void> => {
    await window.electronAPI?.invoke('character:switch', { characterId: id })
    const char = characters.find((c) => c.id === id)
    if (char) setActiveCharacter(char)
  }

  return (
    <div className="character-selector">
      <div className="character-selector__header">
        <button className="character-selector__add-btn" onClick={() => setShowCreate(true)} title="新建对象">+</button>
      </div>

      {characters.length > 0 && (
        <div className="character-selector__list">
          {characters.map((char) => (
            <div
              key={char.id}
              className={`character-selector__item ${activeCharacter?.id === char.id ? 'character-selector__item--active' : ''}`}
              onClick={() => handleSwitch(char.id)}
            >
              <span className="character-selector__avatar">{char.avatar}</span>
              <span className="character-selector__name">{char.name}</span>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <CharacterCreateDialog
          onClose={() => setShowCreate(false)}
          onCreated={(char) => {
            setActiveCharacter(char)
            setShowCreate(false)
            loadCharacters()
            // 加入聊天列表
            useChatListStore.getState().addSession({
              id: char.id,
              name: char.name,
              avatar: char.avatar,
              lastMessage: '开始聊天吧~',
              time: '刚刚',
              unread: 0,
              online: true,
              pinned: false,
              avatarVersion: 0
            })
          }}
        />
      )}
    </div>
  )
}

// 创建角色对话框
interface CharacterCreateDialogProps {
  onClose: () => void
  onCreated: (char: CharacterConfig) => void
}

function CharacterCreateDialog({ onClose, onCreated }: CharacterCreateDialogProps): React.JSX.Element {
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState('🌸')
  const [selectedTemplate, setSelectedTemplate] = useState('gentle')
  const [persona, setPersona] = useState('')
  const [traits, setTraits] = useState('')
  const [provider, setProvider] = useState('deepseek')
  const [model, setModel] = useState('deepseek-chat')
  const [apiKey, setApiKey] = useState('')
  const [baseUrl, setBaseUrl] = useState('')

  const handleCreate = async (): Promise<void> => {
    if (!name.trim()) return

    const result = await window.electronAPI?.invoke('character:create', {
      templateId: selectedTemplate,
      name: name.trim(),
      avatar,
      persona: persona || undefined,
      traits: traits ? traits.split(',').map((t) => t.trim()) : undefined,
      provider,
      model,
      apiKey: apiKey || undefined,
      baseUrl: baseUrl || undefined
    })

    if (result && typeof result === 'object' && 'id' in result) {
      onCreated(result as CharacterConfig)
    }
  }

  return (
    <div className="character-create-overlay" onClick={onClose}>
      <div className="character-create-dialog" onClick={(e) => e.stopPropagation()}>
        <h3>创建新对象</h3>

        <div className="character-create-field">
          <label>名称 *</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="给对象起个名字" />
        </div>

        <div className="character-create-field">
          <label>头像（emoji）</label>
          <input type="text" value={avatar} onChange={(e) => setAvatar(e.target.value)} placeholder="🌸" />
        </div>

        <div className="character-create-field">
          <label>性格模板</label>
          <div className="character-create-templates">
            {[
              { id: 'gentle', label: '温柔体贴' },
              { id: 'funny', label: '活泼搞笑' },
              { id: 'tsundere', label: '高冷傲娇' },
            ].map((t) => (
              <button
                key={t.id}
                className={`character-create-template ${selectedTemplate === t.id ? 'character-create-template--selected' : ''}`}
                onClick={() => setSelectedTemplate(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="character-create-field">
          <label>模型服务</label>
          <select value={provider} onChange={(e) => {
            setProvider(e.target.value)
            const defaults: Record<string, { url: string; model: string }> = {
              deepseek: { url: 'https://api.deepseek.com/v1', model: 'deepseek-chat' },
              mimo: { url: 'https://api.xiaomi.com/mimo/v1', model: 'MiMo-7B-RL' },
              openai: { url: 'https://api.openai.com/v1', model: 'gpt-4o' },
              ollama: { url: 'http://localhost:11434/v1', model: 'qwen2.5' }
            }
            const d = defaults[e.target.value]
            if (d) { setBaseUrl(d.url); setModel(d.model) }
          }}>
            <option value="deepseek">DeepSeek</option>
            <option value="mimo">MiMo</option>
            <option value="openai">OpenAI</option>
            <option value="ollama">Ollama</option>
          </select>
        </div>

        <div className="character-create-field">
          <label>API Key</label>
          <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk-..." />
        </div>

        <div className="character-create-actions">
          <button className="character-create-btn character-create-btn--cancel" onClick={onClose}>取消</button>
          <button className="character-create-btn character-create-btn--confirm" onClick={handleCreate} disabled={!name.trim()}>创建</button>
        </div>
      </div>
    </div>
  )
}
