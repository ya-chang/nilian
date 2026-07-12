// src/main/memory/ShortTerm.ts
// 短期记忆 — 当前对话上下文（滑动窗口）

export interface ShortTermMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
  timestamp: number
}

export class ShortTerm {
  private messages: ShortTermMessage[] = []
  private windowSize: number

  constructor(windowSize: number = 20) {
    this.windowSize = windowSize
  }

  add(message: ShortTermMessage): void {
    this.messages.push(message)
    if (this.messages.length > this.windowSize) {
      this.messages.shift()
    }
  }

  getMessages(): ShortTermMessage[] {
    return [...this.messages]
  }

  getContext(): string {
    return this.messages
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n')
  }

  clear(): void {
    this.messages = []
  }

  get size(): number {
    return this.messages.length
  }
}
