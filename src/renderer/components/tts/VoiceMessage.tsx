// src/renderer/components/tts/VoiceMessage.tsx
// 语音条组件 — 微信风格语音消息

import { useState, useRef } from 'react'
import './voice.css'

interface VoiceMessageProps {
  audioBase64: string
  isSelf: boolean
}

export function VoiceMessage({ audioBase64, isSelf }: VoiceMessageProps) {
  const [playing, setPlaying] = useState(false)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const sourceRef = useRef<AudioBufferSourceNode | null>(null)

  const togglePlay = async (): Promise<void> => {
    if (playing) {
      // 停止播放
      sourceRef.current?.stop()
      sourceRef.current = null
      setPlaying(false)
      return
    }

    try {
      // 解码 base64 为 ArrayBuffer
      const binaryStr = atob(audioBase64)
      const bytes = new Uint8Array(binaryStr.length)
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i)
      }

      // 使用 AudioContext 解码和播放
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext()
      }
      const audioCtx = audioCtxRef.current

      // 解码音频
      const audioBuffer = await audioCtx.decodeAudioData(bytes.buffer)

      // 创建播放源
      const source = audioCtx.createBufferSource()
      source.buffer = audioBuffer
      source.connect(audioCtx.destination)
      source.onended = () => setPlaying(false)

      sourceRef.current = source
      source.start(0)
      setPlaying(true)
    } catch (err) {
      console.error('[VoiceMessage] 播放失败:', err)
      setPlaying(false)
    }
  }

  // 检查音频数据是否有效
  const isValidAudio = audioBase64 && audioBase64.length > 100 && !audioBase64.startsWith('http')

  if (!isValidAudio) {
    return null
  }

  return (
    <div
      className={`voice-message ${isSelf ? 'voice-message--self' : 'voice-message--other'} ${playing ? 'voice-message--playing' : ''}`}
      onClick={togglePlay}
    >
      <span className="voice-message__icon">{playing ? '⏸' : '▶'}</span>
      <div className="voice-message__waves">
        <div className="voice-wave" />
        <div className="voice-wave" />
        <div className="voice-wave" />
        <div className="voice-wave" />
        <div className="voice-wave" />
      </div>
    </div>
  )
}
