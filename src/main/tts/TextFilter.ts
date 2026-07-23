// src/main/tts/TextFilter.ts
// 文本过滤 — 去掉 AI 回复中的描写状态，只保留纯对话文本

/**
 * 过滤描写状态，返回纯对话文本
 *
 * 原始：  （微笑着说）你好呀~        →  你好呀~
 * 原始：  [轻笑] 你猜呢？            →  你猜呢？
 * 原始：  **哈哈** 你太可爱了        →  哈哈 你太可爱了
 * 原始：  「认真脸」今天天气不错      →  今天天气不错
 */
export function filterForTTS(text: string): string {
  if (!text) return ''

  let result = text

  // 去掉（xxx）或(xxx) — 中文括号或英文括号包裹的描写
  result = result.replace(/[（(][^）)]*[）)]/g, '')

  // 去掉 [xxx] — 方括号包裹的描写
  result = result.replace(/\[[^\]]*\]/g, '')

  // 去掉 **xxx** — 粗体标记，保留文字
  result = result.replace(/\*\*([^*]+)\*\*/g, '$1')

  // 去掉 *xxx* — 斜体标记，保留文字
  result = result.replace(/\*([^*]+)\*/g, '$1')

  // 去掉 「xxx」 — 中文书名号包裹的描写
  result = result.replace(/「[^」]*」/g, '')

  // 去掉连续空格
  result = result.replace(/\s+/g, ' ').trim()

  return result
}

/**
 * 为风格指令生成默认 prompt（根据人设模板）
 */
export function getDefaultStylePrompt(persona: string): string {
  if (!persona) return '用自然的语气说话'

  if (persona.includes('温柔') || persona.includes('体贴') || persona.includes('撒娇')) {
    return '用温柔的语气说话，声音柔和'
  }
  if (persona.includes('傲娇') || persona.includes('高冷') || persona.includes('口是心非')) {
    return '用冷淡但偶尔傲娇的语气说话'
  }
  if (persona.includes('搞笑') || persona.includes('活泼') || persona.includes('段子')) {
    return '用活泼开朗的语气说话，语速稍快'
  }
  if (persona.includes('冷') || persona.includes('酷')) {
    return '用简短冷淡的语气说话'
  }

  return '用自然的语气说话'
}
