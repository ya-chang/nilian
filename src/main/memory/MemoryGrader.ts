// src/main/memory/MemoryGrader.ts
// 记忆分级器 — 判断消息重要性

export type MemoryGrade = 'high' | 'medium' | 'low'

export interface GradedMemory {
  id: string
  content: string
  grade: MemoryGrade
  importance: number
  timestamp: string
}

// 高重要性关键词
const HIGH_IMPORTANCE_KEYWORDS = [
  '名字', '年龄', '生日', '生日是', '我叫',
  '承诺', '答应', '保证', '一定',
  '伤心', '难过', '哭', '分手', '离开',
  '喜欢', '爱', '讨厌', '讨厌你',
  '工作', '学校', '家人', '爸妈'
]

// 中等重要性关键词
const MEDIUM_IMPORTANCE_KEYWORDS = [
  '今天', '昨天', '明天', '下周', '下周',
  '北京', '上海', '深圳', '广州',
  '吃饭', '睡觉', '上班', '下班'
]

export class MemoryGrader {
  grade(content: string): { grade: MemoryGrade; importance: number } {
    const lowerContent = content.toLowerCase()

    // 高重要性
    if (HIGH_IMPORTANCE_KEYWORDS.some((kw) => lowerContent.includes(kw))) {
      return { grade: 'high', importance: 0.9 }
    }

    // 中等重要性
    if (MEDIUM_IMPORTANCE_KEYWORDS.some((kw) => lowerContent.includes(kw))) {
      return { grade: 'medium', importance: 0.5 }
    }

    // 低重要性
    return { grade: 'low', importance: 0.2 }
  }

  // 记岔逻辑 — 只对 low 级别记忆记岔
  shouldForget(grade: MemoryGrade): boolean {
    if (grade !== 'low') return false
    // 5% 概率记岔
    return Math.random() < 0.05
  }
}
