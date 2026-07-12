// src/main/emotion/EmotionFSM.ts
// 情感状态机 — 管理角色情感变化

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { logger } from '../utils/logger'

export interface EmotionalState {
  happiness: number
  sadness: number
  anger: number
  anxiety: number
  affection: number
  intimacy: number
  trust: number
  energy: number
  missLevel: number
  patience: number
  currentMood: string
  lastInteraction: string
  conversationStreak: number
}

interface EmotionalEvent {
  event: string
  impact: number
  timestamp: string
}

interface ReconciliationState {
  isFighting: boolean
  lastFightTime: string | null
  lastReconciliationTime: string | null
}

const DEFAULT_STATE: EmotionalState = {
  happiness: 70,
  sadness: 10,
  anger: 0,
  anxiety: 5,
  affection: 50,
  intimacy: 30,
  trust: 40,
  energy: 80,
  missLevel: 20,
  patience: 80,
  currentMood: 'happy',
  lastInteraction: new Date().toISOString(),
  conversationStreak: 0
}

const DATA_DIR = join(process.cwd(), 'data', 'emotions')

export class EmotionFSM {
  private state: EmotionalState
  private emotionalMemory: EmotionalEvent[] = []
  private reconciliation: ReconciliationState = {
    isFighting: false,
    lastFightTime: null,
    lastReconciliationTime: null
  }
  private characterId: string

  constructor(characterId: string, initialState?: Partial<EmotionalState>) {
    this.characterId = characterId
    this.state = { ...DEFAULT_STATE, ...initialState }
    this.load()
  }

  processMessage(content: string, userEmotion: string): EmotionalState {
    const now = new Date()
    const lastInteraction = new Date(this.state.lastInteraction)
    const timeSinceLastMessage = (now.getTime() - lastInteraction.getTime()) / 1000 / 60

    // 沉默超过2小时 → 想你
    if (timeSinceLastMessage > 120) {
      this.state.missLevel = Math.min(100, this.state.missLevel + 10)
      this.state.sadness = Math.min(100, this.state.sadness + 2)
    }

    // 用户说爱你/想你 → 开心
    const loveWords = ['爱你', '喜欢你', '想你', '爱', '喜欢']
    if (loveWords.some((w) => content.includes(w))) {
      this.state.happiness = Math.min(100, this.state.happiness + 20)
      this.state.affection = Math.min(100, this.state.affection + 5)
      this.state.intimacy = Math.min(100, this.state.intimacy + 3)
      this.addEvent('收到爱意表达', 20)
    }

    // 用户生气 → 受影响
    if (userEmotion === 'angry') {
      this.state.happiness = Math.max(0, this.state.happiness - 15)
      this.state.sadness = Math.min(100, this.state.sadness + 10)
      this.state.energy = Math.max(0, this.state.energy - 5)
      this.state.anger = Math.min(100, this.state.anger + 10)
      this.addEvent('用户生气', -15)
    }

    // 用户难过 → 关心
    if (userEmotion === 'sad') {
      this.state.sadness = Math.min(100, this.state.sadness + 5)
      this.state.affection = Math.min(100, this.state.affection + 2)
    }

    // 更新状态
    this.state.lastInteraction = now.toISOString()
    this.state.conversationStreak += 1

    // 计算当前情绪
    this.state.currentMood = this.calculateMood()

    this.save()
    return { ...this.state }
  }

  private calculateMood(): string {
    const { happiness, sadness, anger, anxiety } = this.state

    if (anger > 60) return 'angry'
    if (sadness > 60) return 'sad'
    if (anxiety > 60) return 'anxious'
    if (happiness > 70) return 'happy'
    if (happiness > 40) return 'neutral'
    return 'low'
  }

  private addEvent(event: string, impact: number): void {
    this.emotionalMemory.push({
      event,
      impact,
      timestamp: new Date().toISOString()
    })

    // 只保留最近50个事件
    if (this.emotionalMemory.length > 50) {
      this.emotionalMemory.shift()
    }
  }

  getState(): EmotionalState {
    return { ...this.state }
  }

  getReconciliationState(): ReconciliationState {
    return { ...this.reconciliation }
  }

  shouldReconcile(): boolean {
    if (!this.reconciliation.isFighting) return false
    if (this.state.anger <= 60) return false

    const lastFight = this.reconciliation.lastFightTime
    if (!lastFight) return false

    const minutesSinceFight = (Date.now() - new Date(lastFight).getTime()) / 1000 / 60
    return minutesSinceFight > 30
  }

  startFighting(): void {
    this.reconciliation.isFighting = true
    this.reconciliation.lastFightTime = new Date().toISOString()
    this.state.anger = Math.min(100, this.state.anger + 30)
    logger.info(`角色开始生气: id=${this.characterId}`)
  }

  reconcile(): void {
    this.reconciliation.isFighting = false
    this.reconciliation.lastReconciliationTime = new Date().toISOString()
    this.state.anger = Math.max(0, this.state.anger - 40)
    this.state.happiness = Math.min(100, this.state.happiness + 10)
    logger.info(`角色和好: id=${this.characterId}`)
  }

  private save(): void {
    if (!existsSync(DATA_DIR)) {
      mkdirSync(DATA_DIR, { recursive: true })
    }
    const filePath = join(DATA_DIR, `${this.characterId}.json`)
    writeFileSync(filePath, JSON.stringify({
      state: this.state,
      emotionalMemory: this.emotionalMemory,
      reconciliation: this.reconciliation
    }, null, 2), 'utf-8')
  }

  private load(): void {
    const filePath = join(DATA_DIR, `${this.characterId}.json`)
    if (existsSync(filePath)) {
      try {
        const data = JSON.parse(readFileSync(filePath, 'utf-8'))
        this.state = { ...DEFAULT_STATE, ...data.state }
        this.emotionalMemory = data.emotionalMemory || []
        this.reconciliation = data.reconciliation || this.reconciliation
      } catch {
        this.state = { ...DEFAULT_STATE }
      }
    }
  }
}
