// src/main/engine/Humanizer.ts
// "人味儿"注入器 — 让 AI 回复更像真人

export interface HumanizerConfig {
  emojiOnlyChance: number       // 只回一个表情的概率，默认 0.05
  longDelayChance: number       // 长延迟概率，默认 0.08
  longDelayRange: [number, number]  // 30-120秒
  recallChance: number          // 撤回概率，默认 0.02
  typoChance: number            // 打错字概率，默认 0.03
}

const DEFAULT_CONFIG: HumanizerConfig = {
  emojiOnlyChance: 0.05,
  longDelayChance: 0.08,
  longDelayRange: [30, 120],
  recallChance: 0.02,
  typoChance: 0.03
}

const COMMON_EMOJIS = ['😊', '😂', '❤️', '👍', '🥰', '😍', '😘', '🥺']

const COMMON_TYPOS: Array<[string, string]> = [
  ['的', '地'],
  ['在', '再'],
  ['吗', '嘛'],
  ['啊', '阿'],
  ['哦', '噢'],
  ['嗯', '唔'],
  ['哈哈', '蛤蛤'],
  ['可爱', '可耐'],
]

export class Humanizer {
  private config: HumanizerConfig

  constructor(config?: Partial<HumanizerConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  process(content: string): {
    content: string
    isEmojiOnly: boolean
    shouldRecall: boolean
    shouldLongDelay: boolean
  } {
    let processedContent = content
    let isEmojiOnly = false

    // 偶尔只回一个表情
    if (Math.random() < this.config.emojiOnlyChance) {
      const emoji = COMMON_EMOJIS[Math.floor(Math.random() * COMMON_EMOJIS.length)]
      return { content: emoji, isEmojiOnly: true, shouldRecall: false, shouldLongDelay: false }
    }

    // 偶尔打错字
    if (Math.random() < this.config.typoChance) {
      processedContent = this.injectTypo(content)
    }

    return {
      content: processedContent,
      isEmojiOnly,
      shouldRecall: Math.random() < this.config.recallChance,
      shouldLongDelay: Math.random() < this.config.longDelayChance
    }
  }

  private injectTypo(content: string): string {
    const candidates = COMMON_TYPOS.filter(([original]) => content.includes(original))
    if (candidates.length === 0) return content

    const [original, typo] = candidates[Math.floor(Math.random() * candidates.length)]
    return content.replace(original, typo)
  }
}
