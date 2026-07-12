// src/main/engine/ChatEngine.ts
// 对话引擎 — 协调模型调用、记忆检索、学习分析、情感状态、知识库生成

import { ModelRouter, type ChatMessage, type ChatResponse } from './ModelRouter'
import { MemoryManager, type MemoryContext } from '../memory/MemoryManager'
import { LearningEngine } from '../learning/LearningEngine'
import { EmotionFSM } from '../emotion/EmotionFSM'
import { KnowledgeManager } from '../knowledge/KnowledgeManager'
import { KnowledgeGenerator, type GenerateContext } from '../knowledge/KnowledgeGenerator'
import { loadModelsConfig } from '../utils/config'
import { logger } from '../utils/logger'

// TODO: [P5] 人设 prompt 从角色配置读取
const DEFAULT_PERSONA =
  '你是一个温柔体贴的恋人，说话自然亲切，像真人微信聊天一样。' +
  '可以用表情、语气词、叠字。回复不要太长，像真人打字一样。'

export interface SendMessageParams {
  content: string
  characterId: string
  history: ChatMessage[]
  persona?: string
  provider?: string
  model?: string
  apiKey?: string
  baseUrl?: string
  quoteContent?: string
  userName?: string
  currentSong?: {
    name: string
    artist: string
    album: string
    lyricsSnippet: string
    description: string
  }
}

export class ChatEngine {
  private router = new ModelRouter()
  private memoryManagers: Map<string, MemoryManager> = new Map()
  private learningEngines: Map<string, LearningEngine> = new Map()
  private emotionFSMs: Map<string, EmotionFSM> = new Map()
  private knowledgeManagers: Map<string, KnowledgeManager> = new Map()
  private knowledgeGenerator = new KnowledgeGenerator()
  private messageCounts: Map<string, number> = new Map()

  private getMemoryManager(characterId: string): MemoryManager {
    if (!this.memoryManagers.has(characterId)) {
      this.memoryManagers.set(characterId, new MemoryManager(characterId))
    }
    return this.memoryManagers.get(characterId)!
  }

  private getLearningEngine(characterId: string): LearningEngine {
    if (!this.learningEngines.has(characterId)) {
      this.learningEngines.set(characterId, new LearningEngine())
    }
    return this.learningEngines.get(characterId)!
  }

  private getEmotionFSM(characterId: string): EmotionFSM {
    if (!this.emotionFSMs.has(characterId)) {
      this.emotionFSMs.set(characterId, new EmotionFSM(characterId))
    }
    return this.emotionFSMs.get(characterId)!
  }

  private getKnowledgeManager(characterId: string): KnowledgeManager {
    if (!this.knowledgeManagers.has(characterId)) {
      this.knowledgeManagers.set(characterId, new KnowledgeManager(characterId))
    }
    return this.knowledgeManagers.get(characterId)!
  }

  async sendMessage(params: SendMessageParams): Promise<ChatResponse> {
    const config = loadModelsConfig()
    const defaultModel = config.default

    const memoryManager = this.getMemoryManager(params.characterId)
    const learningEngine = this.getLearningEngine(params.characterId)
    const emotionFSM = this.getEmotionFSM(params.characterId)

    // 规则引擎分析用户情绪
    const { emotion } = learningEngine.analyzeMessage(params.content)

    // 情感状态机处理
    const emotionalState = emotionFSM.processMessage(params.content, emotion)

    // 检查是否需要和好
    if (emotionFSM.shouldReconcile()) {
      emotionFSM.reconcile()
      logger.info('角色主动和好')
    }

    // 记录用户消息到记忆
    memoryManager.addMessage({
      role: 'user',
      content: params.content,
      timestamp: Date.now()
    })

    // 获取记忆上下文
    const memoryContext = memoryManager.getContext(params.content)

    // 构建带记忆的 system prompt（注入 MD 文件内容）
    const systemPrompt = this.buildSystemPrompt(
      params.persona || DEFAULT_PERSONA,
      memoryContext,
      emotion,
      emotionalState.currentMood,
      params.characterId,
      params.quoteContent,
      params.userName,
      params.currentSong
    )

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...params.history,
      { role: 'user', content: params.content }
    ]

    try {
      const response = await this.router.chat({
        messages,
        provider: params.provider || defaultModel.provider,
        model: params.model || defaultModel.model,
        temperature: defaultModel.temperature,
        maxTokens: defaultModel.maxTokens,
        apiKey: params.apiKey,
        baseUrl: params.baseUrl
      })

      // 记录助手回复到记忆
      memoryManager.addMessage({
        role: 'assistant',
        content: response.content,
        timestamp: Date.now()
      })

      // 异步触发知识库生成（不阻塞回复）
      this.triggerKnowledgeGeneration(params.characterId, params.apiKey, params.baseUrl)

      return response
    } catch (error) {
      logger.error('对话引擎调用失败', error)
      throw error
    }
  }

  private buildSystemPrompt(
    persona: string,
    context: MemoryContext,
    userEmotion?: string,
    characterMood?: string,
    characterId?: string,
    quoteContent?: string,
    userName?: string,
    currentSong?: SendMessageParams['currentSong']
  ): string {
    const parts: string[] = [persona]

    // 注入用户名字
    if (userName) {
      parts.push(`\n## 用户信息\n- 名字：${userName}`)
    }

    // 注入当前歌曲
    if (currentSong) {
      let songSection = `\n## 用户正在听歌\n- 歌曲：${currentSong.name}\n- 歌手：${currentSong.artist}`
      if (currentSong.album) songSection += `\n- 专辑：${currentSong.album}`
      if (currentSong.description) songSection += `\n- 介绍：${currentSong.description}`
      if (currentSong.lyricsSnippet) songSection += `\n- 歌词节选：\n${currentSong.lyricsSnippet}`
      songSection += '\n\n用户可能会和你聊这首歌，请自然地回应。'
      parts.push(songSection)
    }

    // 注入引用的消息
    if (quoteContent) {
      parts.push(`\n## 用户引用了之前的消息\n"${quoteContent}"\n请基于这条引用内容回复。`)
    }

    // 注入角色当前情绪
    if (characterMood && characterMood !== 'happy') {
      parts.push(`\n## 你当前的情绪\n${characterMood}`)
    }

    // 注入用户情绪
    if (userEmotion && userEmotion !== 'neutral') {
      parts.push(`\n## 用户当前情绪\n${userEmotion}`)
    }

    // 注入知识库 MD 文件内容
    if (characterId) {
      const knowledge = this.getKnowledgeManager(characterId)
      const userProfile = knowledge.readUserProfile()
      const chatSummary = knowledge.readChatSummary()
      const styleLearning = knowledge.readStyleLearning()

      // 用户画像
      const profileContent = this.extractUsefulContent(userProfile)
      if (profileContent) {
        parts.push(`\n=== 关于他的记忆 ===\n${profileContent}`)
      }

      // 对话摘要
      const summaryContent = this.extractUsefulContent(chatSummary)
      if (summaryContent) {
        parts.push(`\n=== 近期对话摘要 ===\n${summaryContent}`)
      }

      // 风格学习
      const styleContent = this.extractUsefulContent(styleLearning)
      if (styleContent) {
        parts.push(`\n=== 用户偏好（自动学习） ===\n${styleContent}`)
      }
    }

    // 注入相关记忆（向量检索结果）
    if (context.relevantMemories.length > 0) {
      const memories = context.relevantMemories
        .map((m) => `- ${m.content}`)
        .join('\n')
      parts.push(`\n## 相关记忆\n${memories}`)
    }

    // 注入对话摘要（内存中的短期摘要）
    if (context.summaries.length > 0) {
      const latestSummary = context.summaries[context.summaries.length - 1]
      parts.push(`\n## 最近话题\n${latestSummary.summary}`)
    }

    return parts.join('\n')
  }

  /** 从 MD 文件内容中提取有用部分（去掉标题和注释） */
  private extractUsefulContent(mdContent: string): string {
    if (!mdContent) return ''
    // 去掉 markdown 标题和引用注释行
    return mdContent
      .split('\n')
      .filter((line) => {
        const trimmed = line.trim()
        if (!trimmed) return false
        if (trimmed.startsWith('#')) return false
        if (trimmed.startsWith('>')) return false
        return true
      })
      .join('\n')
      .trim()
  }

  /**
   * 流式发送消息 — 返回 AsyncGenerator
   */
  async *sendMessageStream(params: SendMessageParams): AsyncGenerator<string> {
    const config = loadModelsConfig()
    const defaultModel = config.default

    const memoryManager = this.getMemoryManager(params.characterId)
    const learningEngine = this.getLearningEngine(params.characterId)
    const emotionFSM = this.getEmotionFSM(params.characterId)

    const { emotion } = learningEngine.analyzeMessage(params.content)
    emotionFSM.processMessage(params.content, emotion)

    if (emotionFSM.shouldReconcile()) {
      emotionFSM.reconcile()
    }

    memoryManager.addMessage({
      role: 'user',
      content: params.content,
      timestamp: Date.now()
    })

    const memoryContext = memoryManager.getContext(params.content)
    const systemPrompt = this.buildSystemPrompt(
      params.persona || DEFAULT_PERSONA,
      memoryContext,
      emotion,
      undefined,
      params.characterId,
      params.quoteContent,
      params.userName,
      params.currentSong
    )

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...params.history,
      { role: 'user', content: params.content }
    ]

    let fullContent = ''

    for await (const chunk of this.router.chatStream({
      messages,
      provider: params.provider || defaultModel.provider,
      model: params.model || defaultModel.model,
      temperature: defaultModel.temperature,
      maxTokens: defaultModel.maxTokens,
      apiKey: params.apiKey,
      baseUrl: params.baseUrl
    })) {
      if (!chunk.done && chunk.content) {
        fullContent += chunk.content
        yield chunk.content
      }
    }

    // 流结束后记录助手回复到记忆
    memoryManager.addMessage({
      role: 'assistant',
      content: fullContent,
      timestamp: Date.now()
    })

    // 异步触发知识库生成（不阻塞回复）
    this.triggerKnowledgeGeneration(params.characterId, params.apiKey, params.baseUrl)
  }

  getEmotionState(characterId: string) {
    return this.getEmotionFSM(characterId).getState()
  }

  startFighting(characterId: string): void {
    this.getEmotionFSM(characterId).startFighting()
  }

  saveMemories(): void {
    for (const manager of this.memoryManagers.values()) {
      manager.save()
    }
  }

  /**
   * 异步触发知识库生成 — 不阻塞回复
   * 每 30 条 → 风格学习，每 50 条 → 摘要，每 100 条 → 用户画像
   */
  private triggerKnowledgeGeneration(
    characterId: string,
    apiKey?: string,
    baseUrl?: string
  ): void {
    const count = (this.messageCounts.get(characterId) ?? 0) + 1
    this.messageCounts.set(characterId, count)

    const triggers = this.knowledgeGenerator.incrementAndCheck(characterId)
    if (!triggers.triggerStyleLearning && !triggers.triggerChatSummary && !triggers.triggerUserProfile) {
      return
    }

    // 异步执行，不阻塞主流程
    const memoryManager = this.getMemoryManager(characterId)
    const context = memoryManager.getContext()
    const knowledgeManager = this.getKnowledgeManager(characterId)

    const ctx: GenerateContext = {
      characterId,
      characterName: '',  // TODO: 从角色配置读取
      persona: knowledgeManager.readPersona(),
      messages: context.recentMessages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
        timestamp: m.timestamp
      })),
      apiKey,
      baseUrl
    }

    if (triggers.triggerStyleLearning) {
      this.knowledgeGenerator.generateStyleLearning(ctx).catch((err) => {
        logger.error('异步风格学习失败', err)
      })
    }

    if (triggers.triggerChatSummary) {
      this.knowledgeGenerator.generateChatSummary(ctx).catch((err) => {
        logger.error('异步摘要生成失败', err)
      })
    }

    if (triggers.triggerUserProfile) {
      this.knowledgeGenerator.generateUserProfile(ctx).catch((err) => {
        logger.error('异步画像生成失败', err)
      })
    }
  }
}
