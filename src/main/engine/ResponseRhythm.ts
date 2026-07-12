// src/main/engine/ResponseRhythm.ts
// 回复节奏控制 — 模拟真人打字节奏

export interface ReplyRhythmConfig {
  firstDelay: [number, number]   // 第一条 [min, max] 秒
  midDelay: [number, number]     // 中间碎片 [min, max] 秒
  lastDelay: [number, number]    // 最后一条 [min, max] 秒
  emotionalMultiplier: number    // 情绪激动时 × 倍率（更快）
  seriousMultiplier: number      // 深沉内容时 × 倍率（更慢）
}

const DEFAULT_RHYTHM: ReplyRhythmConfig = {
  firstDelay: [0.5, 1.5],
  midDelay: [1, 4],
  lastDelay: [1, 6],
  emotionalMultiplier: 0.6,
  seriousMultiplier: 1.5
}

export type EmotionType = 'emotional' | 'serious' | 'normal'

export class ResponseRhythm {
  private config: ReplyRhythmConfig

  constructor(config?: Partial<ReplyRhythmConfig>) {
    this.config = { ...DEFAULT_RHYTHM, ...config }
  }

  getDelay(chunkIndex: number, totalChunks: number): number {
    const { firstDelay, midDelay, lastDelay } = this.config

    if (totalChunks === 1) {
      return this.randomBetween(firstDelay[0], firstDelay[1])
    }
    if (chunkIndex === 0) {
      return this.randomBetween(firstDelay[0], firstDelay[1])
    }
    if (chunkIndex === totalChunks - 1) {
      return this.randomBetween(lastDelay[0], lastDelay[1])
    }
    return this.randomBetween(midDelay[0], midDelay[1])
  }

  getDelayWithEmotion(
    chunkIndex: number,
    totalChunks: number,
    emotion: EmotionType
  ): number {
    let delay = this.getDelay(chunkIndex, totalChunks)

    if (emotion === 'emotional') {
      delay *= this.config.emotionalMultiplier
    } else if (emotion === 'serious') {
      delay *= this.config.seriousMultiplier
    }

    return Math.max(0.3, delay)
  }

  private randomBetween(min: number, max: number): number {
    return min + Math.random() * (max - min)
  }
}
