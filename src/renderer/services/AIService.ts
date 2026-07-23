// src/renderer/services/AIService.ts
// AI 服务 — 直接调用 API，替代 ChatEngine IPC

export interface ChatRequest {
  provider: string
  model: string
  apiKey?: string
  baseUrl?: string
  messages: Array<{ role: string; content: string }>
  temperature?: number
  maxTokens?: number
  persona?: string
  userName?: string
  quoteContent?: string
}

export interface ChatResponse {
  success: boolean
  data?: { content: string; model: string }
  error?: string
}

// Provider 基础 URL
const PROVIDER_URLS: Record<string, string> = {
  deepseek: 'https://api.deepseek.com/v1',
  openai: 'https://api.openai.com/v1',
  siliconflow: 'https://api.siliconflow.cn/v1',
  mimo: 'https://api.xiaomimimo.com/v1',
  ollama: 'http://localhost:11434/v1'
}

export const AIService = {
  async chat(request: ChatRequest): Promise<ChatResponse> {
    const baseUrl = request.baseUrl || PROVIDER_URLS[request.provider] || PROVIDER_URLS.deepseek

    const systemMessage: Array<{ role: string; content: string }> = []
    if (request.persona) {
      systemMessage.push({ role: 'system', content: request.persona })
    }
    if (request.userName) {
      systemMessage.push({ role: 'system', content: `用户的名字是${request.userName}` })
    }
    if (request.quoteContent) {
      systemMessage.push({ role: 'system', content: `用户引用了: ${request.quoteContent}` })
    }

    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${request.apiKey}`
        },
        body: JSON.stringify({
          model: request.model,
          messages: [...systemMessage, ...request.messages],
          temperature: request.temperature ?? 0.85,
          max_tokens: request.maxTokens ?? 1024,
          stream: false
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        return { success: false, error: `API错误 ${response.status}: ${errorText.slice(0, 200)}` }
      }

      const data = await response.json()
      const content = data.choices?.[0]?.message?.content
      if (!content) {
        return { success: false, error: '响应中没有内容' }
      }

      return { success: true, data: { content, model: request.model } }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : '请求失败' }
    }
  }
}
