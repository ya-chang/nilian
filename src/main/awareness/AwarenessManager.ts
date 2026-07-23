// src/main/awareness/AwarenessManager.ts
// 感知模块管理器 — 组合节假日+时间感知，注入到Prompt

import { HolidayAwareness } from './HolidayAwareness'
import { TimeAwareness } from './TimeAwareness'

export class AwarenessManager {
  private holiday = new HolidayAwareness()
  private time = new TimeAwareness()

  /**
   * 构建感知Prompt
   */
  buildPrompt(): string {
    const sections: string[] = []

    // 节假日
    const holidaySection = this.holiday.buildPromptSection()
    if (holidaySection) sections.push(holidaySection)

    // 时间
    sections.push(this.time.buildPromptSection())

    return sections.join('\n\n')
  }

  /**
   * 获取今天的节日问候（用于早安消息等）
   */
  getHolidayGreeting(): string | null {
    const holiday = this.holiday.getTodayHoliday()
    if (!holiday) return null
    return this.holiday.getGreeting(holiday)
  }
}
