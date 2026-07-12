// src/main/social/MomentsGenerator.ts
// 朋友圈内容生成器 — AI 自动生成朋友圈

export interface GeneratedMoment {
  content: string
  mood: string
  images: string[]
}

const DAILY_TEMPLATES = [
  { content: '今天天气真好~', mood: '开心' },
  { content: '又是元气满满的一天！', mood: '积极' },
  { content: '下班了，好累...', mood: '疲惫' },
  { content: '吃到好吃的了！', mood: '满足' },
  { content: '想你了...', mood: '想念' },
  { content: '周末愉快~', mood: '轻松' },
  { content: '今天的月亮好圆', mood: '平静' },
  { content: '刚运动完，舒服~', mood: '充实' },
]

const EMOTIONAL_TEMPLATES = [
  { content: '心情不太好...', mood: '低落' },
  { content: '好开心呀！', mood: '开心' },
  { content: '有点想哭...', mood: '难过' },
  { content: '今天超级幸运！', mood: '幸运' },
  { content: '终于等到你了', mood: '期待' },
]

export class MomentsGenerator {
  generateDaily(): GeneratedMoment {
    const template = DAILY_TEMPLATES[Math.floor(Math.random() * DAILY_TEMPLATES.length)]
    return {
      content: template.content,
      mood: template.mood,
      images: []
    }
  }

  generateEmotional(emotion: string): GeneratedMoment {
    const filtered = EMOTIONAL_TEMPLATES.filter((t) => t.mood === emotion)
    const templates = filtered.length > 0 ? filtered : EMOTIONAL_TEMPLATES
    const template = templates[Math.floor(Math.random() * templates.length)]
    return {
      content: template.content,
      mood: template.mood,
      images: []
    }
  }
}
