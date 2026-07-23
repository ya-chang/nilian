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

    // 去除重复内容
    processedContent = this.deduplicate(processedContent)

    return {
      content: processedContent,
      isEmojiOnly,
      shouldRecall: Math.random() < this.config.recallChance,
      shouldLongDelay: Math.random() < this.config.longDelayChance
    }
  }

  /**
   * 去除重复的句子 — 支持精确匹配 + 近似匹配 + 空格分隔重复
   */
  private deduplicate(content: string): string {
    // 先处理空格分隔的重复片段（如 "xxx xxx"）
    let processed = this.removeSpaceSeparatedDuplicates(content)
    
    // 按标点分句（包含中文全角和半角标点、逗号）
    const sentences = processed.split(/(?<=[。！？.!?\n～…，,、])/)
    const seenKeys: string[] = []
    const result: string[] = []

    for (const sentence of sentences) {
      const trimmed = sentence.trim()
      if (!trimmed) {
        result.push(sentence)
        continue
      }
      // 去掉标点和空格后比较
      const key = trimmed.replace(/[。！？.!?\s，,、～…]/g, '')
      if (!key) {
        result.push(sentence)
        continue
      }

      // 精确匹配
      if (seenKeys.includes(key)) {
        continue
      }

      // 近似匹配：与已有句子相似度超过 70% 视为重复
      let isDuplicate = false
      for (const seen of seenKeys) {
        if (this.similarity(key, seen) > 0.7) {
          isDuplicate = true
          break
        }
      }

      if (isDuplicate) continue

      seenKeys.push(key)
      result.push(sentence)
    }

    return result.join('')
  }

  /**
   * 去除空格分隔的重复片段
   * 例如: "我最喜欢秋天啦🍂 我最喜欢秋天啦🍂" → "我最喜欢秋天啦🍂"
   * 例如: "凉凉的风、凉凉的风、" → "凉凉的风、"
   */
  private removeSpaceSeparatedDuplicates(content: string): string {
    // 匹配 "xxx xxx" 模式（中间有空格，内容重复，2-80字符）
    let result = content.replace(/(.{2,80}?)\s+\1/g, '$1')
    
    // 匹配标点分隔的重复片段（如 "xxx、xxx、"）
    // 匹配模式：任意2-80字符 + 标点/特殊符号 + 相同内容 + 标点/特殊符号
    result = result.replace(/(.{2,80}?)([。！？.!?\~～…，,、；;：:"""''「」『』【】《》〈〉（）()〔〕\[\]{}])\1\2/g, '$1$2')
    
    // 匹配无分隔符的连续重复（如表情符号重复 "(xxx)(xxx)"）
    result = result.replace(/(.{2,40}?)\1+/g, '$1')
    
    // 如果处理后内容变短了，说明有重复被移除
    // 递归处理可能的多层重复
    if (result.length < content.length) {
      return this.removeSpaceSeparatedDuplicates(result)
    }
    return result
  }

  /** 计算两个字符串的相似度（基于最长公共子序列） */
  private similarity(a: string, b: string): number {
    if (a === b) return 1
    if (a.length === 0 || b.length === 0) return 0

    const shorter = a.length < b.length ? a : b
    const longer = a.length < b.length ? b : a

    // 快速过滤：如果长度差太大，直接返回 0
    if (shorter.length / longer.length < 0.5) return 0

    // 使用编辑距离计算相似度
    const m = shorter.length
    const n = longer.length
    const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (shorter[i - 1] === longer[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
        }
      }
    }

    const lcs = dp[m][n]
    return (2 * lcs) / (m + n)
  }

  private injectTypo(content: string): string {
    const candidates = COMMON_TYPOS.filter(([original]) => content.includes(original))
    if (candidates.length === 0) return content

    const [original, typo] = candidates[Math.floor(Math.random() * candidates.length)]
    return content.replace(original, typo)
  }
}
