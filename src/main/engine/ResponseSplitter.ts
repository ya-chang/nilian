// src/main/engine/ResponseSplitter.ts
// 回复拆分器 — 将 AI 回复拆分成碎片，模拟真人分段发送

export interface SplitConfig {
  minChunkLength: number    // 最短碎片（默认8字）
  maxChunkLength: number    // 最长碎片（默认50字）
  mergeShort: boolean       // 太短的合并到下一个
  preserveEmoji: boolean    // emoji归属前一个碎片
}

const DEFAULT_CONFIG: SplitConfig = {
  minChunkLength: 8,
  maxChunkLength: 50,
  mergeShort: true,
  preserveEmoji: true
}

// 拆分符号（包含中文全角和半角标点、逗号）
const SPLIT_MARKERS = /[。！？!?…～，,\n]+/

export class ResponseSplitter {
  private config: SplitConfig

  constructor(config?: Partial<SplitConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  split(text: string): string[] {
    if (!text.trim()) return []

    const rawChunks = this.splitByPunctuation(text.trim())
    const merged = this.config.mergeShort
      ? this.mergeShortChunks(rawChunks)
      : rawChunks

    return merged
      .map((c) => c.trim())
      .filter((c) => c.length > 0)
  }

  private splitByPunctuation(text: string): string[] {
    const result: string[] = []
    let current = ''

    for (const char of text) {
      current += char
      if (this.isSplitChar(char)) {
        result.push(current)
        current = ''
      }
    }
    if (current) result.push(current)

    return result
  }

  private isSplitChar(char: string): boolean {
    return '。！？!?\n…～，,'.includes(char)
  }

  private mergeShortChunks(chunks: string[]): string[] {
    if (chunks.length <= 1) return chunks

    const merged: string[] = []
    let buffer = ''

    for (let i = 0; i < chunks.length; i++) {
      buffer += chunks[i]
      const isLast = i === chunks.length - 1
      if (buffer.length >= this.config.minChunkLength || isLast) {
        merged.push(buffer)
        buffer = ''
      }
    }

    if (buffer && merged.length > 0) {
      merged[merged.length - 1] += buffer
    } else if (buffer) {
      merged.push(buffer)
    }

    return merged
  }
}
