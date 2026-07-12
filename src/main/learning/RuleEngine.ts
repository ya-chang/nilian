// src/main/learning/RuleEngine.ts
// 规则引擎（引擎C）— 实时，零成本

export interface UserPatterns {
  emotionVocabulary: Record<string, string[]>
  punctuationStyle: {
    exclamationRate: number
    ellipsisRate: number
    questionRate: number
    tildeRate: number
  }
  emojiUsage: Record<string, number>
  sentenceStyle: {
    avgLength: number
    reduplicationRate: number
   感叹号率: number
  }
  vocabulary: {
    frequentlyUsed: string[]
    catchphrases: string[]
  }
}

// 情绪词典
const EMOTION_DICT: Record<string, string[]> = {
  happy: ['哈哈哈', '好耶', '绝了', '可爱', '开心', '高兴', '太好了', '棒', '赞'],
  angry: ['烦死了', '滚', '你有病吧', '无语', '气死', '讨厌', '受不了'],
  sad: ['累了', '不想', '难过', '伤心', '无聊', '没意思', '唉'],
  excited: ['卧槽', '牛逼', '绝了', '太强了', '厉害', '666']
}

const PUNCTUATION_RULES: Record<string, string> = {
  '！！！': 'angry',
  '...': 'sad',
  '？？？': 'confused',
  '~~': 'playful'
}

export class RuleEngine {
  private patterns: UserPatterns

  constructor() {
    this.patterns = this.getDefaultPatterns()
  }

  analyze(content: string): {
    emotion: string
    patterns: Partial<UserPatterns>
  } {
    const emotion = this.detectEmotion(content)
    const updatedPatterns = this.updatePatterns(content)

    return { emotion, patterns: updatedPatterns }
  }

  private detectEmotion(content: string): string {
    // 关键词匹配
    for (const [emotion, keywords] of Object.entries(EMOTION_DICT)) {
      if (keywords.some((kw) => content.includes(kw))) {
        return emotion
      }
    }

    // 标点规则
    for (const [punct, emotion] of Object.entries(PUNCTUATION_RULES)) {
      if (content.includes(punct)) {
        return emotion
      }
    }

    return 'neutral'
  }

  private updatePatterns(content: string): Partial<UserPatterns> {
    // 提取表情
    const emojiRegex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu
    const emojis = content.match(emojiRegex) || []
    for (const emoji of emojis) {
      this.patterns.emojiUsage[emoji] = (this.patterns.emojiUsage[emoji] || 0) + 1
    }

    // 更新句式分析
    const sentenceLength = content.length
    this.patterns.sentenceStyle.avgLength =
      (this.patterns.sentenceStyle.avgLength + sentenceLength) / 2

    // 检测叠字
    if (/(.)\1/.test(content)) {
      this.patterns.sentenceStyle.reduplicationRate += 0.01
    }

    return this.patterns
  }

  private getDefaultPatterns(): UserPatterns {
    return {
      emotionVocabulary: { ...EMOTION_DICT },
      punctuationStyle: {
        exclamationRate: 0,
        ellipsisRate: 0,
        questionRate: 0,
        tildeRate: 0
      },
      emojiUsage: {},
      sentenceStyle: {
        avgLength: 10,
        reduplicationRate: 0,
        感叹号率: 0
      },
      vocabulary: {
        frequentlyUsed: [],
        catchphrases: []
      }
    }
  }

  getPatterns(): UserPatterns {
    return { ...this.patterns }
  }
}
