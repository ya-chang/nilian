// src/renderer/services/TTSService.ts
// TTS 服务 — 直接调用 MiMo TTS API

const MIMO_TTS_BASE = 'https://api.xiaomimimo.com/v1'

export type TTSModelType = 'preset' | 'voicedesign' | 'voiceclone'

export const TTS_MODELS: Record<TTSModelType, { id: string; name: string; description: string }> = {
  preset: { id: 'mimo-v2.5-tts', name: '精品音色', description: '内置多款高质量音色' },
  voicedesign: { id: 'mimo-v2.5-tts-voicedesign', name: '音色设计', description: '通过描述生成音色' },
  voiceclone: { id: 'mimo-v2.5-tts-voiceclone', name: '音色克隆', description: '暂未开放' }
}

const PRESET_VOICES = [
  { id: 'mimo_default', name: '冰糖', lang: '中文', gender: '女' },
  { id: '茉莉', name: '茉莉', lang: '中文', gender: '女' },
  { id: '苏打', name: '苏打', lang: '中文', gender: '男' },
  { id: '白桦', name: '白桦', lang: '中文', gender: '男' },
  { id: 'Mia', name: 'Mia', lang: '英文', gender: '女' },
  { id: 'Chloe', name: 'Chloe', lang: '英文', gender: '女' },
  { id: 'Milo', name: 'Milo', lang: '英文', gender: '男' },
  { id: 'Dean', name: 'Dean', lang: '英文', gender: '男' }
]

let ttsApiKey = ''

export const TTSService = {
  init(apiKey: string): void {
    ttsApiKey = apiKey
    localStorage.setItem('nilian_tts_apikey', apiKey)
  },

  loadConfig(): void {
    const saved = localStorage.getItem('nilian_tts_apikey')
    if (saved) ttsApiKey = saved
  },

  isReady(): boolean {
    return !!ttsApiKey
  },

  getPresetVoices() {
    return PRESET_VOICES
  },

  getAvailableModels() {
    return Object.entries(TTS_MODELS).map(([id, config]) => ({
      id: id as TTSModelType,
      name: config.name,
      description: config.description
    }))
  },

  async synthesize(text: string, voiceId: string, stylePrompt?: string, modelType: TTSModelType = 'preset'): Promise<string | null> {
    if (!ttsApiKey || !text.trim()) return null

    const safeText = text.length > 500 ? text.slice(0, 500) : text

    const messages = [
      { role: 'user', content: stylePrompt || '用自然的语气说话' },
      { role: 'assistant', content: safeText }
    ]

    const audio: Record<string, string> = { format: 'wav' }

    let apiModel: string
    switch (modelType) {
      case 'voicedesign':
        apiModel = 'mimo-v2.5-tts-voicedesign'
        break
      case 'voiceclone':
        apiModel = 'mimo-v2.5-tts-voiceclone'
        break
      default:
        apiModel = 'mimo-v2.5-tts'
        audio.voice = voiceId
        break
    }

    const requestBody: Record<string, unknown> = {
      model: apiModel,
      messages,
      audio
    }

    try {
      const response = await fetch(`${MIMO_TTS_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ttsApiKey}`
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        console.error(`[TTS] API错误: ${response.status}`)
        return null
      }

      const data = await response.json()
      return data.choices?.[0]?.message?.audio?.data || null
    } catch (err) {
      console.error('[TTS] 合成失败:', err)
      return null
    }
  }
}
