// src/main/tts/TTSState.ts
// TTS 状态管理

import { TTSModelType } from './TTSService'

export interface TTSStateData {
  enabled: boolean
  currentVoice: string
  currentVoiceName: string
  stylePrompt: string
  modelType: TTSModelType
}

export class TTSState {
  private state: TTSStateData = {
    enabled: false,
    currentVoice: '茉莉',
    currentVoiceName: '茉莉',
    stylePrompt: '',
    modelType: 'preset'
  }

  private listeners: Set<(state: TTSStateData) => void> = new Set()

  enable(voiceId?: string, voiceName?: string, stylePrompt?: string, modelType?: TTSModelType): void {
    this.state.enabled = true
    if (voiceId) this.state.currentVoice = voiceId
    if (voiceName) this.state.currentVoiceName = voiceName
    if (stylePrompt !== undefined) this.state.stylePrompt = stylePrompt
    if (modelType) this.state.modelType = modelType
    this.notify()
  }

  disable(): void {
    this.state.enabled = false
    this.notify()
  }

  setVoice(voiceId: string, voiceName: string): void {
    this.state.currentVoice = voiceId
    this.state.currentVoiceName = voiceName
    this.notify()
  }

  setStylePrompt(prompt: string): void {
    this.state.stylePrompt = prompt
  }

  setModelType(modelType: TTSModelType): void {
    this.state.modelType = modelType
    this.notify()
  }

  isEnabled(): boolean {
    return this.state.enabled
  }

  getState(): TTSStateData {
    return { ...this.state }
  }

  onStateChange(callback: (state: TTSStateData) => void): void {
    this.listeners.add(callback)
  }

  private notify(): void {
    this.listeners.forEach(cb => cb(this.state))
  }
}
