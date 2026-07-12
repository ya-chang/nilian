// src/main/learning/ModelAnalyzer.ts
// 模型分析器（引擎B）— 定期，有成本

import { ModelRouter, type ChatMessage } from '../engine/ModelRouter'
import { loadModelsConfig } from '../utils/config'
import { logger } from '../utils/logger'

export interface UserProfile {
  personality: string
  communicationStyle: string
  emotionalPatterns: string[]
  interests: string[]
  lastAnalysis: string
}

export class ModelAnalyzer {
  private router = new ModelRouter()

  async analyzeWeekly(summaries: string[]): Promise<UserProfile> {
    if (summaries.length === 0) {
      return this.getDefaultProfile()
    }

    const config = loadModelsConfig()
    const defaultModel = config.default

    const prompt = `你是一个用户行为分析专家。请根据以下一周的对话摘要，分析用户的性格特征、沟通风格、情绪模式和兴趣爱好。

对话摘要：
${summaries.map((s, i) => `${i + 1}. ${s}`).join('\n')}

请用JSON格式输出分析结果：
{
  "personality": "用户性格特征描述",
  "communicationStyle": "用户沟通风格描述",
  "emotionalPatterns": ["情绪模式1", "情绪模式2"],
  "interests": ["兴趣1", "兴趣2"]
}`

    try {
      const messages: ChatMessage[] = [
        { role: 'system', content: '你是用户行为分析专家，输出JSON格式的分析结果。' },
        { role: 'user', content: prompt }
      ]

      const response = await this.router.chat({
        messages,
        provider: defaultModel.provider,
        model: defaultModel.model,
        temperature: 0.3,
        maxTokens: 500
      })

      const parsed = JSON.parse(response.content) as Omit<UserProfile, 'lastAnalysis'>

      logger.info('用户画像分析完成')

      return {
        ...parsed,
        lastAnalysis: new Date().toISOString()
      }
    } catch (error) {
      logger.error('用户画像分析失败', error)
      return this.getDefaultProfile()
    }
  }

  private getDefaultProfile(): UserProfile {
    return {
      personality: '待分析',
      communicationStyle: '待分析',
      emotionalPatterns: [],
      interests: [],
      lastAnalysis: new Date().toISOString()
    }
  }
}
