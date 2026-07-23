// src/main/awareness/TimeAwareness.ts
// 时间感知 — AI知道现在几点，自然地关心用户

interface TimeContext {
  period: string
  label: string
  mood: string
  carePhrase: string
}

function getTimeContext(): TimeContext {
  const hour = new Date().getHours()

  if (hour >= 0 && hour < 6) {
    return { period: 'late_night', label: '深夜', mood: '担心', carePhrase: '怎么还不睡？熬夜对身体不好哦' }
  }
  if (hour >= 6 && hour < 9) {
    return { period: 'morning', label: '早上', mood: '活力', carePhrase: '早安~起了吗？今天也要加油哦' }
  }
  if (hour >= 9 && hour < 12) {
    return { period: 'forenoon', label: '上午', mood: '日常', carePhrase: '上午在忙什么呀' }
  }
  if (hour >= 12 && hour < 14) {
    return { period: 'noon', label: '中午', mood: '日常', carePhrase: '中午吃了什么？记得吃饭哦' }
  }
  if (hour >= 14 && hour < 18) {
    return { period: 'afternoon', label: '下午', mood: '日常', carePhrase: '下午困吗？在忙什么呀' }
  }
  if (hour >= 18 && hour < 21) {
    return { period: 'evening', label: '傍晚', mood: '放松', carePhrase: '下班了吗？晚上吃什么？今天累不累？' }
  }
  return { period: 'night', label: '晚上', mood: '温馨', carePhrase: '该休息了，今天辛苦了，早点睡哦' }
}

function getCurrentTime(): string {
  const now = new Date()
  const hour = now.getHours()
  const minute = now.getMinutes()
  return `${hour}:${String(minute).padStart(2, '0')}`
}

function getWeekday(): string {
  const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  return days[new Date().getDay()]
}

export class TimeAwareness {
  buildPromptSection(): string {
    const ctx = getTimeContext()
    const time = getCurrentTime()
    const weekday = getWeekday()
    const now = new Date()
    const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`

    return `## 当前时间信息
- 日期：${dateStr}（${weekday}）
- 具体时间：${time}
- 时段：${ctx.label}
- 氛围：${ctx.mood}

当用户问"现在几点"或类似问题时，直接告诉用户具体时间（如"现在${time}"）。
如果合适，可以自然地关心用户（如"${ctx.carePhrase}"），但不要每条消息都提时间。
深夜时段（0:00-6:00）如果用户在线，要关心用户为什么还不睡。`
  }
}
