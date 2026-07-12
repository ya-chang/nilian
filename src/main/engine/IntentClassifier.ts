// src/main/engine/IntentClassifier.ts
// 意图预判 — 判断消息是否需要调 API，节省 20-30% 调用

export interface IntentResult {
  action: 'skip' | 'template_reply' | 'delayed_reply' | 'model_reply'
  template?: string
  delay?: [number, number]
}

// 纯应答模式
const ACK_PATTERN = /^(嗯|哦|好|ok|OK|嗯嗯|好的|行|可以|知道了|收到|好嘞|好叭|哈哈|嘿嘿)$/

// 纯表情模式
const EMOJI_ONLY_PATTERN = /^[\p{Emoji_Presentation}\p{Extended_Pictographic}\s]+$/u

// 拍一拍
const PAT_PATTERN = /^拍了拍/

// 超短消息
const TOO_SHORT_PATTERN = /^.{1,2}$/

// 模板回复
const ACK_REPLIES = ['嗯嗯', '好的', '收到', '好嘞', '👌', '👍']
const EMOJI_MAP: Record<string, string> = {
  '😊': '😊',
  '😂': '😂',
  '❤️': '❤️',
  '👍': '👍',
  '🥰': '🥰',
  '😭': '😢',
}

export class IntentClassifier {
  classify(content: string): IntentResult {
    const trimmed = content.trim()

    // 拍一拍 → 插件处理
    if (PAT_PATTERN.test(trimmed)) {
      return { action: 'skip' }
    }

    // 纯应答 → 30%不回，70%用模板
    if (ACK_PATTERN.test(trimmed)) {
      if (Math.random() < 0.3) {
        return { action: 'skip' }
      }
      return {
        action: 'template_reply',
        template: this.randomPick(ACK_REPLIES)
      }
    }

    // 纯表情 → 回一个类似表情
    if (EMOJI_ONLY_PATTERN.test(trimmed)) {
      const reply = EMOJI_MAP[trimmed] || trimmed
      return { action: 'template_reply', template: reply }
    }

    // 超短消息 → 模板
    if (TOO_SHORT_PATTERN.test(trimmed)) {
      return {
        action: 'template_reply',
        template: this.randomPick(['嗯？', '怎么啦', '？'])
      }
    }

    // 其他 → 调模型
    return { action: 'model_reply' }
  }

  private randomPick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)]
  }
}
