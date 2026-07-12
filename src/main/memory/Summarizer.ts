// src/main/memory/Summarizer.ts
// 对话摘要生成器 — 从对话中提取关键信息

export interface ConversationSummary {
  date: string
  topics: string[]
  keyEvents: string[]
  moodSummary: string
  summary: string
  messageCount: number
}

export class Summarizer {
  summarize(messages: Array<{ role: string; content: string }>): ConversationSummary {
    const userMessages = messages.filter((m) => m.role === 'user')
    const assistantMessages = messages.filter((m) => m.role === 'assistant')

    const topics = this.extractTopics(userMessages.map((m) => m.content))
    const keyEvents = this.extractKeyEvents(userMessages.map((m) => m.content))
    const moodSummary = this.analyzeMood(userMessages.map((m) => m.content))

    return {
      date: new Date().toISOString().split('T')[0],
      topics,
      keyEvents,
      moodSummary,
      summary: this.generateSummary(topics, keyEvents, moodSummary),
      messageCount: messages.length
    }
  }

  private extractTopics(messages: string[]): string[] {
    const topicKeywords: Record<string, string[]> = {
      '工作': ['工作', '上班', '加班', '项目', '会议'],
      '生活': ['吃饭', '睡觉', '休息', '运动', '购物'],
      '感情': ['喜欢', '爱', '想你', '开心', '难过'],
      '娱乐': ['电影', '游戏', '音乐', '旅行', '玩']
    }

    const foundTopics: string[] = []
    const allText = messages.join(' ')

    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some((kw) => allText.includes(kw))) {
        foundTopics.push(topic)
      }
    }

    return foundTopics.length > 0 ? foundTopics : ['日常']
  }

  private extractKeyEvents(messages: string[]): string[] {
    const events: string[] = []
    for (const msg of messages) {
      if (msg.includes('答应') || msg.includes('承诺')) {
        events.push('做出承诺')
      }
      if (msg.includes('生气') || msg.includes('吵架')) {
        events.push('发生争执')
      }
      if (msg.includes('开心') || msg.includes('高兴')) {
        events.push('开心时刻')
      }
    }
    return events
  }

  private analyzeMood(messages: string[]): string {
    const happyWords = ['开心', '高兴', '哈哈', '好的', '好']
    const sadWords = ['难过', '伤心', '哭', '累', '烦']
    const angryWords = ['生气', '讨厌', '烦死了', '滚']

    const allText = messages.join(' ')
    const happyCount = happyWords.filter((w) => allText.includes(w)).length
    const sadCount = sadWords.filter((w) => allText.includes(w)).length
    const angryCount = angryWords.filter((w) => allText.includes(w)).length

    if (happyCount > sadCount && happyCount > angryCount) return '开心'
    if (sadCount > angryCount) return '低落'
    if (angryCount > 0) return '生气'
    return '平静'
  }

  private generateSummary(topics: string[], events: string[], mood: string): string {
    const parts: string[] = []
    if (topics.length > 0) parts.push(`讨论了${topics.join('、')}`)
    if (events.length > 0) parts.push(`发生了${events.join('、')}`)
    parts.push(`整体情绪${mood}`)
    return parts.join('，')
  }
}
