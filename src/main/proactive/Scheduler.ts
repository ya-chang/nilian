// src/main/proactive/Scheduler.ts
// 主动消息调度器 — 定时发送早安/晚安/想你了

import { logger } from '../utils/logger'

export interface ScheduledTrigger {
  id: string
  type: 'scheduled' | 'event'
  scheduled?: {
    hour: number
    minute: number
    messages: string[]
    jitter: [number, number]
  }
  event?: {
    trigger: 'silence' | 'meal_time'
    threshold?: number
    cooldown: number
    messageGenerator: string
  }
  enabled: boolean
}

const DEFAULT_TRIGGERS: ScheduledTrigger[] = [
  {
    id: 'morning',
    type: 'scheduled',
    scheduled: {
      hour: 8,
      minute: 0,
      messages: ['早安呀 ☀️', '起来了没？🥰', '早！昨晚有没有梦到我 😏'],
      jitter: [0, 30]
    },
    enabled: true
  },
  {
    id: 'night',
    type: 'scheduled',
    scheduled: {
      hour: 23,
      minute: 0,
      messages: ['晚安啦 🌙', '该睡觉了 💤', '晚安 梦里见 ✨'],
      jitter: [0, 20]
    },
    enabled: true
  },
  {
    id: 'miss_you',
    type: 'event',
    event: {
      trigger: 'silence',
      threshold: 360,
      cooldown: 240,
      messageGenerator: 'miss_you'
    },
    enabled: true
  },
  {
    id: 'meal_check',
    type: 'event',
    event: {
      trigger: 'meal_time',
      cooldown: 360,
      messageGenerator: 'meal_check'
    },
    enabled: true
  }
]

export class Scheduler {
  private triggers: ScheduledTrigger[]
  private lastTriggered: Map<string, number> = new Map()
  private characterId: string
  private onMessage?: (message: string) => void

  constructor(characterId: string, onMessage?: (message: string) => void) {
    this.characterId = characterId
    this.triggers = [...DEFAULT_TRIGGERS]
    this.onMessage = onMessage
  }

  checkScheduled(): string | null {
    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()

    for (const trigger of this.triggers) {
      if (trigger.type !== 'scheduled' || !trigger.scheduled || !trigger.enabled) continue

      const { hour, minute, messages, jitter } = trigger.scheduled
      const jitterMinutes = jitter[0] + Math.random() * (jitter[1] - jitter[0])

      const triggerTime = hour * 60 + minute
      const currentTime = currentHour * 60 + currentMinute + jitterMinutes

      if (Math.abs(currentTime - triggerTime) < 1) {
        const lastTime = this.lastTriggered.get(trigger.id) || 0
        if (Date.now() - lastTime > 60 * 60 * 1000) {
          this.lastTriggered.set(trigger.id, Date.now())
          const message = messages[Math.floor(Math.random() * messages.length)]
          return message
        }
      }
    }

    return null
  }

  checkEvent(lastInteractionTime: string): string | null {
    const now = Date.now()
    const lastInteraction = new Date(lastInteractionTime).getTime()
    const minutesSinceLastInteraction = (now - lastInteraction) / 1000 / 60

    for (const trigger of this.triggers) {
      if (trigger.type !== 'event' || !trigger.event || !trigger.enabled) continue

      const { trigger: eventType, threshold, cooldown, messageGenerator } = trigger.event

      if (eventType === 'silence' && threshold && minutesSinceLastInteraction > threshold) {
        const lastTime = this.lastTriggered.get(trigger.id) || 0
        if (now - lastTime > cooldown * 60 * 1000) {
          this.lastTriggered.set(trigger.id, now)
          return this.generateMessage(messageGenerator)
        }
      }

      if (eventType === 'meal_time') {
        const hour = new Date().getHours()
        if ((hour >= 11 && hour <= 13) || (hour >= 17 && hour <= 19)) {
          const lastTime = this.lastTriggered.get(trigger.id) || 0
          if (now - lastTime > cooldown * 60 * 1000) {
            this.lastTriggered.set(trigger.id, now)
            return this.generateMessage(messageGenerator)
          }
        }
      }
    }

    return null
  }

  private generateMessage(type: string): string {
    const messages: Record<string, string[]> = {
      miss_you: ['想你了~', '你在干嘛呀？', '好久没聊天了...', '怎么不理我了？'],
      meal_check: ['吃饭了吗？', '该吃饭了哦~', '别饿着了', '今天吃什么好吃的？']
    }

    const options = messages[type] || ['你好呀~']
    return options[Math.floor(Math.random() * options.length)]
  }

  setEnabled(triggerId: string, enabled: boolean): void {
    const trigger = this.triggers.find((t) => t.id === triggerId)
    if (trigger) {
      trigger.enabled = enabled
    }
  }

  getTriggers(): ScheduledTrigger[] {
    return [...this.triggers]
  }
}
