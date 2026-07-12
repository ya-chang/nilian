// src/main/learning/LearningEngine.ts
// 学习引擎 — 协调规则引擎（主）和模型分析（辅）

import { RuleEngine, type UserPatterns } from './RuleEngine'
import { ModelAnalyzer, type UserProfile } from './ModelAnalyzer'
import { logger } from '../utils/logger'

export interface LearningData {
  patterns: UserPatterns
  profile: UserProfile
  lastModelAnalysis: string
}

export class LearningEngine {
  private ruleEngine: RuleEngine
  private modelAnalyzer: ModelAnalyzer
  private data: LearningData

  constructor() {
    this.ruleEngine = new RuleEngine()
    this.modelAnalyzer = new ModelAnalyzer()
    this.data = {
      patterns: this.ruleEngine.getPatterns(),
      profile: {
        personality: '待分析',
        communicationStyle: '待分析',
        emotionalPatterns: [],
        interests: [],
        lastAnalysis: new Date().toISOString()
      },
      lastModelAnalysis: new Date().toISOString()
    }
  }

  // 实时分析（每条消息）
  analyzeMessage(content: string): {
    emotion: string
    patterns: Partial<UserPatterns>
  } {
    const result = this.ruleEngine.analyze(content)
    logger.debug(`规则分析: emotion=${result.emotion}`)
    return result
  }

  // 定期模型分析（每周）
  async runWeeklyAnalysis(summaries: string[]): Promise<UserProfile> {
    const profile = await this.modelAnalyzer.analyzeWeekly(summaries)
    this.data.profile = profile
    this.data.lastModelAnalysis = new Date().toISOString()
    logger.info('每周用户画像分析完成')
    return profile
  }

  shouldRunWeeklyAnalysis(): boolean {
    const lastAnalysis = new Date(this.data.lastModelAnalysis)
    const now = new Date()
    const daysSinceLastAnalysis = (now.getTime() - lastAnalysis.getTime()) / (1000 * 60 * 60 * 24)
    return daysSinceLastAnalysis >= 7
  }

  getData(): LearningData {
    return { ...this.data }
  }
}
