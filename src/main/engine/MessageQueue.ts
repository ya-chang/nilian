// src/main/engine/MessageQueue.ts
// 消息队列 — 防并发，确保顺序处理

import { logger } from '../utils/logger'

interface QueuedMessage {
  id: string
  characterId: string
  content: string
  history: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
  resolve: (result: unknown) => void
  reject: (error: Error) => void
}

export class MessageQueue {
  private queue: QueuedMessage[] = []
  private processing = false

  async enqueue(msg: Omit<QueuedMessage, 'resolve' | 'reject'>): Promise<unknown> {
    return new Promise((resolve, reject) => {
      this.queue.push({ ...msg, resolve, reject })

      if (!this.processing) {
        this.processNext()
      }
    })
  }

  private async processNext(): Promise<void> {
    this.processing = true
    const msg = this.queue.shift()

    if (!msg) {
      this.processing = false
      return
    }

    try {
      // 合并排队中的消息作为上下文
      const pendingContext = this.queue
        .filter((q) => q.characterId === msg.characterId)
        .map((q) => q.content)

      const result = await this.handleMessage(msg, pendingContext)
      msg.resolve(result)
    } catch (error) {
      msg.reject(error instanceof Error ? error : new Error(String(error)))
    }

    // 继续处理下一条
    await this.processNext()
  }

  private async handleMessage(
    msg: QueuedMessage,
    _pendingContext: string[]
  ): Promise<unknown> {
    logger.info(`处理消息: id=${msg.id}`)

    // 这里调用实际的消息处理逻辑
    // 由外部注入处理器
    return this.handler?.(msg, _pendingContext)
  }

  // 处理器注入点
  handler?: (
    msg: QueuedMessage,
    pendingContext: string[]
  ) => Promise<unknown> | unknown
}
