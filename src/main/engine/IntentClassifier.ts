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

// 超短消息（但白名单内的不走模板）
const TOO_SHORT_PATTERN = /^.{1,2}$/

// 白名单：虽然是短消息，但应该走模型回复
const MODEL_WHITELIST = [
  '早安', '晚安', '早上好', '晚上好', '你好', '在吗', '在不在',
  '干嘛', '干嘛呢', '干嘛呀', '怎么了', '怎么啦', '怎么了你',
  '想你', '想你了', '喜欢你', '爱你', '我爱你', '讨厌',
  '无聊', '好无聊', '好累', '累了', '饿了', '困了',
  '开心', '难过', '生气', '害怕', '伤心',
  '谢谢', '感谢', '对不起', '抱歉',
  'help', 'hi', 'hello'
]

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

    // 白名单 → 直接走模型
    if (MODEL_WHITELIST.includes(trimmed)) {
      return { action: 'model_reply' }
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
