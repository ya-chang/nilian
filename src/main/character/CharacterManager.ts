// src/main/character/CharacterManager.ts
// 角色管理器 — 多角色创建、切换、独立数据

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { app } from 'electron'
import * as yaml from 'yaml'
import { logger } from '../utils/logger'
import { gentleTemplate } from './templates/gentle'
import { funnyTemplate } from './templates/funny'
import { tsundereTemplate } from './templates/tsundere'
import { KnowledgeManager } from '../knowledge/KnowledgeManager'

export interface CharacterConfig {
  id: string
  name: string
  avatar: string
  persona: string
  traits: string[]
  catchphrase?: string
  provider: string
  model: string
  apiKey?: string
  baseUrl?: string
  temperature: number
  maxTokens: number
  createdAt: string
  updatedAt: string
}

interface CharacterTemplate {
  id: string
  name: string
  description: string
  persona: string
  traits: string[]
  sampleMessages: string[]
}

const TEMPLATES: CharacterTemplate[] = [
  gentleTemplate,
  funnyTemplate,
  tsundereTemplate
]

const getDataRoot = (): string => {
  if (app.isPackaged) {
    return join(app.getPath('userData'), 'data', 'characters')
  }
  return join(process.cwd(), 'data', 'characters')
}

export class CharacterManager {
  private characters: Map<string, CharacterConfig> = new Map()
  private activeCharacterId: string | null = null
  private dataRoot: string

  constructor() {
    this.dataRoot = getDataRoot()
    this.ensureDataRoot()
    this.loadAll()
    this.ensureDefaultCharacter()
  }

  /**
   * 首次启动 — 如果没有任何角色，自动创建一个默认角色
   */
  private ensureDefaultCharacter(): void {
    if (this.characters.size > 0) return

    this.createFromTemplate('gentle', '小薇', '🌸', {
      persona: '你是用户的小薇，温柔体贴，善解人意。你会主动关心对方的饮食起居，记得对方说过的小细节。\n\n回复时语气柔和，常用"呀""嗯""好呀"等语气词。\n偶尔撒娇，但不过分。会用拥抱、亲亲等亲密动作。\n对方难过时会耐心安慰，对方开心时会一起开心。',
      traits: ['温柔', '体贴', '关心', '撒娇'],
      catchphrase: '嗯嗯~',
      provider: 'deepseek',
      model: 'deepseek-v4-flash'
    })

    logger.info('已创建默认角色: 小薇')
  }

  getTemplates(): Array<{ id: string; name: string; description: string }> {
    return TEMPLATES.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description
    }))
  }

  createFromTemplate(
    templateId: string,
    name: string,
    avatar: string,
    overrides?: Partial<Pick<CharacterConfig, 'provider' | 'model' | 'temperature' | 'maxTokens' | 'apiKey' | 'baseUrl' | 'persona' | 'traits' | 'catchphrase'>>
  ): CharacterConfig {
    const template = TEMPLATES.find((t) => t.id === templateId)
    if (!template) {
      throw new Error(`未知模板: ${templateId}`)
    }

    const id = `char_${Date.now()}`
    const now = new Date().toISOString()

    const character: CharacterConfig = {
      id,
      name,
      avatar,
      persona: overrides?.persona || template.persona,
      traits: overrides?.traits || template.traits,
      catchphrase: overrides?.catchphrase,
      provider: overrides?.provider ?? 'deepseek',
      model: overrides?.model ?? 'deepseek-chat',
      apiKey: overrides?.apiKey,
      baseUrl: overrides?.baseUrl,
      temperature: overrides?.temperature ?? 0.85,
      maxTokens: overrides?.maxTokens ?? 1024,
      createdAt: now,
      updatedAt: now
    }

    this.save(character)
    logger.info(`角色创建成功: id=${id}, name=${name}`)
    return character
  }

  createCustom(params: {
    name: string
    avatar: string
    persona?: string
    traits?: string[]
    catchphrase?: string
    provider?: string
    model?: string
    apiKey?: string
    baseUrl?: string
  }): CharacterConfig {
    const id = `char_${Date.now()}`
    const now = new Date().toISOString()

    const character: CharacterConfig = {
      id,
      name: params.name,
      avatar: params.avatar,
      persona: params.persona ?? '',
      traits: params.traits ?? [],
      catchphrase: params.catchphrase,
      provider: params.provider ?? 'deepseek',
      model: params.model ?? 'deepseek-chat',
      apiKey: params.apiKey,
      baseUrl: params.baseUrl,
      temperature: 0.85,
      maxTokens: 1024,
      createdAt: now,
      updatedAt: now
    }

    this.save(character)
    return character
  }

  getAll(): CharacterConfig[] {
    return Array.from(this.characters.values())
  }

  get(id: string): CharacterConfig | undefined {
    return this.characters.get(id)
  }

  getActive(): CharacterConfig | null {
    if (!this.activeCharacterId) return null
    return this.characters.get(this.activeCharacterId) ?? null
  }

  getActiveId(): string | null {
    return this.activeCharacterId
  }

  setActive(id: string): void {
    if (!this.characters.has(id)) {
      throw new Error(`角色不存在: ${id}`)
    }
    this.activeCharacterId = id
    logger.info(`切换角色: id=${id}`)
  }

  update(id: string, updates: Partial<CharacterConfig>): CharacterConfig {
    const existing = this.characters.get(id)
    if (!existing) {
      throw new Error(`角色不存在: ${id}`)
    }

    const updated = {
      ...existing,
      ...updates,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString()
    }

    this.save(updated)
    return updated
  }

  delete(id: string): void {
    const character = this.characters.get(id)
    if (!character) {
      throw new Error(`角色不存在: ${id}`)
    }

    // 从内存中移除
    this.characters.delete(id)

    // 如果删除的是当前活跃角色，清空
    if (this.activeCharacterId === id) {
      this.activeCharacterId = null
    }

    // 递归删除角色数据目录
    const dir = join(this.dataRoot, id)
    if (existsSync(dir)) {
      this.removeDirRecursive(dir)
    }

    logger.info(`角色已删除: id=${id}, name=${character.name}`)
  }

  /**
   * 递归删除目录 — 先删文件再删目录
   * 注意：这是同步操作，大数据量时可能阻塞
   */
  private removeDirRecursive(dirPath: string): void {
    const fs = require('fs')
    if (existsSync(dirPath)) {
      fs.readdirSync(dirPath).forEach((file: string) => {
        const curPath = join(dirPath, file)
        if (fs.lstatSync(curPath).isDirectory()) {
          this.removeDirRecursive(curPath)
        } else {
          fs.unlinkSync(curPath)
        }
      })
      fs.rmdirSync(dirPath)
    }
  }

  private save(character: CharacterConfig): void {
    this.characters.set(character.id, character)

    const dir = join(this.dataRoot, character.id)
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }

    // 只写配置文件，瞬间完成
    const configPath = join(dir, 'config.yaml')
    writeFileSync(configPath, yaml.stringify(character), 'utf-8')

    // 初始化知识库 MD 文件
    const knowledge = new KnowledgeManager(character.id)
    knowledge.initEmpty()

    // 异步初始化后台目录（不阻塞）
    this.initCharacterDirs(character.id).catch((err) => {
      logger.error(`角色 ${character.id} 后台初始化失败: ${err}`)
    })
  }

  // 后台异步创建角色所需的空目录和初始文件
  private async initCharacterDirs(characterId: string): Promise<void> {
    const dirs = ['memory', 'knowledge', 'learning', 'emotion', 'social']
    const charDir = join(this.dataRoot, characterId)

    for (const dir of dirs) {
      const dirPath = join(charDir, dir)
      if (!existsSync(dirPath)) {
        mkdirSync(dirPath, { recursive: true })
      }
    }

    // 创建学习数据空文件
    const learningFiles = ['patterns.json', 'emoji_usage.json', 'vocabulary.json', 'style_markers.json']
    for (const file of learningFiles) {
      const filePath = join(charDir, 'learning', file)
      if (!existsSync(filePath)) {
        writeFileSync(filePath, '{}', 'utf-8')
      }
    }

    // 创建情感状态初始文件
    const emotionPath = join(charDir, 'emotion', 'state.json')
    if (!existsSync(emotionPath)) {
      writeFileSync(emotionPath, JSON.stringify({
        happiness: 70, sadness: 10, anger: 0, anxiety: 5,
        affection: 50, intimacy: 30, trust: 40,
        energy: 80, missLevel: 20, patience: 80,
        currentMood: 'happy', lastInteraction: new Date().toISOString(), conversationStreak: 0
      }, null, 2), 'utf-8')
    }

    logger.info(`角色 ${characterId} 后台初始化完成`)
  }

  private loadAll(): void {
    if (!existsSync(this.dataRoot)) return

    const dirs = require('fs').readdirSync(this.dataRoot, { withFileTypes: true })
      .filter((d: { isDirectory: () => boolean }) => d.isDirectory())
      .map((d: { name: string }) => d.name)

    for (const dir of dirs) {
      const configPath = join(this.dataRoot, dir, 'config.yaml')
      if (existsSync(configPath)) {
        try {
          const content = readFileSync(configPath, 'utf-8')
          const config = yaml.parse(content) as CharacterConfig
          this.characters.set(config.id, config)

          // 确保已有角色也有知识库文件
          const knowledge = new KnowledgeManager(config.id)
          knowledge.initEmpty()
        } catch {
          logger.warn(`角色加载失败: ${dir}`)
        }
      }
    }

    logger.info(`加载了 ${this.characters.size} 个角色`)
  }

  private ensureDataRoot(): void {
    if (!existsSync(this.dataRoot)) {
      mkdirSync(this.dataRoot, { recursive: true })
    }
  }
}
