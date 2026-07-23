// src/main/backup/CrashRecovery.ts
// 崩溃恢复 — 锁文件检测 + 数据完整性检查

import { readFileSync, writeFileSync, existsSync, unlinkSync, readdirSync } from 'fs'
import { join } from 'path'
import { logger } from '../utils/logger'

export class CrashRecovery {
  private dataDir: string
  private lockFile: string
  private lastCrashTime: string | null = null

  constructor(dataDir: string) {
    this.dataDir = dataDir
    this.lockFile = join(dataDir, '.lock')
  }

  /**
   * 应用启动时检查
   */
  check(): boolean {
    if (existsSync(this.lockFile)) {
      // 上次没有正常关闭
      try {
        const lockData = JSON.parse(readFileSync(this.lockFile, 'utf-8'))
        this.lastCrashTime = lockData.startTime || '未知时间'
      } catch {
        this.lastCrashTime = '未知时间'
      }
      logger.warn(`[崩溃恢复] 检测到上次非正常关闭: ${this.lastCrashTime}`)
      this.recover()
      return true
    }

    // 写入锁文件
    this.writeLock()
    return false
  }

  /**
   * 应用正常关闭时调用
   */
  cleanup(): void {
    if (existsSync(this.lockFile)) {
      unlinkSync(this.lockFile)
    }
  }

  /**
   * 获取上次崩溃时间
   */
  getLastCrashTime(): string | null {
    return this.lastCrashTime
  }

  /**
   * 检查数据完整性
   */
  checkIntegrity(): { ok: boolean; errors: string[] } {
    const errors: string[] = []

    // 检查关键目录是否存在
    const requiredDirs = ['characters', 'messages', 'memories']
    for (const dir of requiredDirs) {
      const dirPath = join(this.dataDir, dir)
      if (!existsSync(dirPath)) {
        errors.push(`目录缺失: ${dir}`)
      }
    }

    // 检查角色配置文件
    const charactersDir = join(this.dataDir, 'characters')
    if (existsSync(charactersDir)) {
      const dirs = readdirSync(charactersDir, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name)

      for (const charId of dirs) {
        const configPath = join(charactersDir, charId, 'config.yaml')
        if (!existsSync(configPath)) {
          errors.push(`角色配置缺失: ${charId}`)
        }
      }
    }

    // 检查消息文件是否可读
    const messagesDir = join(this.dataDir, 'messages')
    if (existsSync(messagesDir)) {
      const files = readdirSync(messagesDir).filter(f => f.endsWith('.json'))
      for (const file of files) {
        try {
          JSON.parse(readFileSync(join(messagesDir, file), 'utf-8'))
        } catch {
          errors.push(`消息文件损坏: ${file}`)
        }
      }
    }

    return { ok: errors.length === 0, errors }
  }

  private recover(): void {
    logger.info('[崩溃恢复] 开始恢复...')
    this.writeLock()
    logger.info('[崩溃恢复] 恢复完成')
  }

  private writeLock(): void {
    writeFileSync(this.lockFile, JSON.stringify({
      pid: process.pid,
      startTime: new Date().toISOString()
    }))
  }
}
