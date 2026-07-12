// src/main/memory/MemoryManager.ts
// 记忆管理器 — 协调短期/中期/长期记忆

import { ShortTerm, type ShortTermMessage } from './ShortTerm'
import { LongTerm, type LongTermMemory } from './LongTerm'
import { Summarizer, type ConversationSummary } from './Summarizer'
import { MemoryGrader } from './MemoryGrader'
import { logger } from '../utils/logger'

export interface MemoryContext {
  recentMessages: ShortTermMessage[]
  relevantMemories: LongTermMemory[]
  summaries: ConversationSummary[]
}

export class MemoryManager {
  private shortTerm: ShortTerm
  private longTerm: LongTerm
  private summarizer: Summarizer
  private grader: MemoryGrader
  private summaries: ConversationSummary[] = []
  private characterId: string

  constructor(characterId: string) {
    this.characterId = characterId
    this.shortTerm = new ShortTerm(20)
    this.longTerm = new LongTerm(characterId)
    this.summarizer = new Summarizer()
    this.grader = new MemoryGrader()
  }

  addMessage(message: ShortTermMessage): void {
    this.shortTerm.add(message)

    // 用户消息存入长期记忆
    if (message.role === 'user') {
      const { grade, importance } = this.grader.grade(message.content)
      if (importance > 0.3) {
        this.longTerm.add(message.content)
      }
    }
  }

  getContext(query?: string): MemoryContext {
    const relevantMemories = query
      ? this.longTerm.search(query, 5)
      : this.longTerm.getAll().slice(0, 5)

    return {
      recentMessages: this.shortTerm.getMessages(),
      relevantMemories,
      summaries: this.summaries.slice(-3)
    }
  }

  generateSummary(): ConversationSummary | null {
    const messages = this.shortTerm.getMessages()
    if (messages.length < 5) return null

    const summary = this.summarizer.summarize(messages)
    this.summaries.push(summary)
    this.shortTerm.clear()

    logger.info(`生成对话摘要: topics=${summary.topics.join(',')}`)
    return summary
  }

  searchMemories(query: string): LongTermMemory[] {
    return this.longTerm.search(query, 5)
  }

  save(): void {
    this.longTerm.save(this.characterId)
  }
}
