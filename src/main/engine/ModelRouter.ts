// src/main/engine/ModelRouter.ts
// 模型路由器 — 支持流式输出

import { getProviderConfig } from '../utils/config'
import { logger } from '../utils/logger'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatRequest {
  messages: ChatMessage[]
  provider: string
  model: string
  temperature?: number
  maxTokens?: number
  stream?: boolean
  apiKey?: string
  baseUrl?: string
}

export interface ChatResponse {
  content: string
  model: string
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

export class ModelRouter {
  /**
   * 流式调用 — 返回 AsyncGenerator，逐 token 产出
   */
  async *chatStream(request: ChatRequest): AsyncGenerator<{ content: string; done: boolean }> {
    // 优先使用传入的 apiKey/baseUrl，否则从全局配置读取
    let apiKey = request.apiKey
    let baseUrl = request.baseUrl
    if (!apiKey || !baseUrl) {
      const provider = getProviderConfig(request.provider)
      if (!apiKey) apiKey = provider.apiKey
      if (!baseUrl) baseUrl = provider.baseUrl
    }

    const body = {
      model: request.model,
      messages: request.messages,
      temperature: request.temperature ?? 0.85,
      max_tokens: request.maxTokens ?? 1024,
      stream: true
    }

    logger.info(`模型调用(流式): ${request.provider}/${request.model}, baseUrl=${baseUrl}, apiKey=${apiKey ? apiKey.substring(0, 5) + '...' : 'EMPTY'}`)

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const errorText = await response.text()
      logger.error(`API 调用失败: ${response.status}`, errorText)
      throw new Error(`API 调用失败: ${response.status} ${errorText}`)
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error('无法获取响应流')

    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || !trimmed.startsWith('data: ')) continue
          const data = trimmed.slice(6)
          if (data === '[DONE]') {
            yield { content: '', done: true }
            return
          }

          try {
            const parsed = JSON.parse(data)
            const delta = parsed.choices?.[0]?.delta?.content
            if (delta) {
              yield { content: delta, done: false }
            }
          } catch {
            // 忽略解析错误
          }
        }
      }
    } catch (readError) {
      logger.error('流式读取中断', readError)
      throw new Error(`流式读取失败: ${readError instanceof Error ? readError.message : String(readError)}`)
    }

    yield { content: '', done: true }
  }

  /**
   * 非流式调用（兼容旧接口）
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    // 优先使用传入的 apiKey/baseUrl
    let apiKey = request.apiKey
    let baseUrl = request.baseUrl
    if (!apiKey || !baseUrl) {
      const provider = getProviderConfig(request.provider)
      if (!apiKey) apiKey = provider.apiKey
      if (!baseUrl) baseUrl = provider.baseUrl
    }

    const body = {
      model: request.model,
      messages: request.messages,
      temperature: request.temperature ?? 0.85,
      max_tokens: request.maxTokens ?? 1024,
      stream: false
    }

    logger.info(`模型调用: ${request.provider}/${request.model}`)

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const errorText = await response.text()
      logger.error(`API 调用失败: ${response.status}`, errorText)
      throw new Error(`API 调用失败: ${response.status} ${errorText}`)
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>
      model: string
      usage: {
        prompt_tokens: number
        completion_tokens: number
        total_tokens: number
      }
    }

    const content = data.choices?.[0]?.message?.content ?? ''
    logger.info(`API 响应成功, tokens: ${data.usage?.total_tokens ?? 0}`)

    return {
      content,
      model: data.model,
      usage: {
        promptTokens: data.usage?.prompt_tokens ?? 0,
        completionTokens: data.usage?.completion_tokens ?? 0,
        totalTokens: data.usage?.total_tokens ?? 0
      }
    }
  }
}
