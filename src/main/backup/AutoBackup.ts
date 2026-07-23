// src/main/backup/AutoBackup.ts
// 自动备份 — 可配置备份时间和数量

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, copyFileSync, statSync, rmSync } from 'fs'
import { join } from 'path'
import { logger } from '../utils/logger'

export interface BackupConfig {
  maxBackups: number      // 最多保留份数
  backupHour: number      // 几点备份（0-23）
  backupMinute: number    // 几分备份（0-59）
}

const DEFAULT_CONFIG: BackupConfig = {
  maxBackups: 7,
  backupHour: 3,
  backupMinute: 0
}

export class AutoBackup {
  private backupDir: string
  private dataDir: string
  private config: BackupConfig
  private timer: ReturnType<typeof setTimeout> | null = null
  private configPath: string

  constructor(dataDir: string) {
    this.dataDir = dataDir
    this.backupDir = join(dataDir, 'backups')
    this.configPath = join(dataDir, 'global', 'backup-config.json')
    if (!existsSync(this.backupDir)) {
      mkdirSync(this.backupDir, { recursive: true })
    }
    this.config = this.loadConfig()
  }

  // ═══════════════════════════════════════════
  // 配置管理
  // ═══════════════════════════════════════════

  private loadConfig(): BackupConfig {
    try {
      if (existsSync(this.configPath)) {
        const saved = JSON.parse(readFileSync(this.configPath, 'utf-8'))
        return { ...DEFAULT_CONFIG, ...saved }
      }
    } catch { /* ignore */ }
    return { ...DEFAULT_CONFIG }
  }

  private saveConfig(): void {
    try {
      const dir = join(this.dataDir, 'global')
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
      writeFileSync(this.configPath, JSON.stringify(this.config, null, 2), 'utf-8')
    } catch { /* ignore */ }
  }

  getConfig(): BackupConfig {
    return { ...this.config }
  }

  setConfig(updates: Partial<BackupConfig>): void {
    this.config = { ...this.config, ...updates }
    this.saveConfig()
    // 重新调度
    this.stop()
    this.start()
    logger.info(`[备份] 配置更新: 每天${this.config.backupHour}:${String(this.config.backupMinute).padStart(2, '0')}，保留${this.config.maxBackups}份`)
  }

  /**
   * 启动自动备份
   */
  start(): void {
    // 启动时检查今天是否已备份
    const today = this.getDateString()
    const todayBackup = join(this.backupDir, `backup-${today}`)
    if (!existsSync(todayBackup)) {
      this.backup()
    }

    // 设置定时器，每天凌晨3点
    this.scheduleDaily()
    logger.info('[备份] 自动备份已启动')
  }

  /**
   * 停止定时器
   */
  stop(): void {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
  }

  /**
   * 执行备份
   */
  backup(): string {
    const today = this.getDateString()
    const backupPath = join(this.backupDir, `backup-${today}`)

    try {
      // 备份数据目录下的所有文件
      this.copyDirRecursive(this.dataDir, backupPath, ['backups', 'logs', 'node_modules'])

      // 清理旧备份
      this.cleanOldBackups()

      logger.info(`[备份] 备份完成: ${backupPath}`)
      return today
    } catch (err) {
      logger.error('[备份] 备份失败', err)
      return ''
    }
  }

  /**
   * 恢复备份
   */
  restore(backupDate: string): boolean {
    const backupPath = join(this.backupDir, `backup-${backupDate}`)
    if (!existsSync(backupPath)) {
      logger.error(`[备份] 备份不存在: ${backupDate}`)
      return false
    }

    try {
      this.copyDirRecursive(backupPath, this.dataDir, ['backups'])
      logger.info(`[备份] 恢复完成: ${backupDate}`)
      return true
    } catch (err) {
      logger.error('[备份] 恢复失败', err)
      return false
    }
  }

  /**
   * 获取可用备份列表
   */
  listBackups(): Array<{ date: string; size: number }> {
    const backups: Array<{ date: string; size: number }> = []
    if (!existsSync(this.backupDir)) return backups

    const entries = readdirSync(this.backupDir)
    for (const entry of entries) {
      if (entry.startsWith('backup-')) {
        const date = entry.replace('backup-', '')
        const fullPath = join(this.backupDir, entry)
        const size = this.getDirSize(fullPath)
        backups.push({ date, size })
      }
    }

    return backups.sort((a, b) => b.date.localeCompare(a.date))
  }

  /**
   * 获取上次备份日期
   */
  getLastBackupDate(): string | null {
    const backups = this.listBackups()
    return backups.length > 0 ? backups[0].date : null
  }

  private cleanOldBackups(): void {
    const backups = this.listBackups()
    if (backups.length > this.config.maxBackups) {
      const toDelete = backups.slice(this.config.maxBackups)
      for (const backup of toDelete) {
        const backupPath = join(this.backupDir, `backup-${backup.date}`)
        rmSync(backupPath, { recursive: true, force: true })
        logger.info(`[备份] 清理旧备份: ${backup.date}`)
      }
    }
  }

  private scheduleDaily(): void {
    const now = new Date()
    const target = new Date()
    target.setHours(this.config.backupHour, this.config.backupMinute, 0, 0)

    if (now > target) {
      target.setDate(target.getDate() + 1)
    }

    const delay = target.getTime() - now.getTime()
    this.timer = setTimeout(() => {
      this.backup()
      // 之后每24小时执行一次
      this.timer = setInterval(() => this.backup(), 24 * 60 * 60 * 1000)
    }, delay)
  }

  private copyDirRecursive(src: string, dest: string, excludeDirs: string[] = []): void {
    mkdirSync(dest, { recursive: true })
    const entries = readdirSync(src, { withFileTypes: true })
    for (const entry of entries) {
      if (excludeDirs.includes(entry.name)) continue
      const srcPath = join(src, entry.name)
      const destPath = join(dest, entry.name)
      if (entry.isDirectory()) {
        this.copyDirRecursive(srcPath, destPath, excludeDirs)
      } else {
        copyFileSync(srcPath, destPath)
      }
    }
  }

  private getDirSize(dir: string): number {
    let size = 0
    try {
      const entries = readdirSync(dir, { withFileTypes: true })
      for (const entry of entries) {
        const fullPath = join(dir, entry.name)
        if (entry.isDirectory()) {
          size += this.getDirSize(fullPath)
        } else {
          size += statSync(fullPath).size
        }
      }
    } catch { /* ignore */ }
    return size
  }

  private getDateString(): string {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }
}
