// src/main/plugins/PluginErrorHandler.ts
// 插件错误处理 — 集中管理错误记录、自动禁用、用户通知

import { logger } from '../utils/logger'

interface PluginError {
  pluginId: string
  phase: 'install' | 'enable' | 'disable' | 'uninstall' | 'runtime' | 'health'
  message: string
  stack?: string
  timestamp: number
}

interface ErrorThreshold {
  maxErrors: number       // 最大错误次数
  windowMs: number        // 时间窗口（毫秒）
  autoDisable: boolean    // 达到阈值后自动禁用
  onAutoDisable?: (pluginId: string) => void  // 自动禁用回调
}

const DEFAULT_THRESHOLD: ErrorThreshold = {
  maxErrors: 5,
  windowMs: 5 * 60 * 1000,  // 5分钟
  autoDisable: true
}

export class PluginErrorHandler {
  private errors: Map<string, PluginError[]> = new Map()
  private disableCallbacks: Map<string, () => void> = new Map()
  private threshold: ErrorThreshold

  constructor(options?: Partial<ErrorThreshold>) {
    this.threshold = { ...DEFAULT_THRESHOLD, ...options }
  }

  /**
   * 注册插件禁用回调（当错误达到阈值时自动调用）
   */
  onAutoDisable(pluginId: string, callback: () => void): void {
    this.disableCallbacks.set(pluginId, callback)
  }

  /**
   * 记录错误
   * @returns 如果错误达到阈值返回 true（表示插件应被禁用）
   */
  recordError(pluginId: string, phase: PluginError['phase'], error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error)
    const stack = error instanceof Error ? error.stack : undefined

    const entry: PluginError = {
      pluginId,
      phase,
      message,
      stack,
      timestamp: Date.now()
    }

    // 添加到错误列表
    if (!this.errors.has(pluginId)) {
      this.errors.set(pluginId, [])
    }
    this.errors.get(pluginId)!.push(entry)

    // 清理过期错误
    this.pruneErrors(pluginId)

    // 记录日志
    logger.error(`[插件错误] ${pluginId} (${phase}): ${message}`)

    // 检查是否达到阈值
    const recentErrors = this.errors.get(pluginId) || []
    if (recentErrors.length >= this.threshold.maxErrors && this.threshold.autoDisable) {
      logger.warn(`[插件] ${pluginId} 错误次数达到阈值(${this.threshold.maxErrors})，自动禁用`)
      this.triggerAutoDisable(pluginId)
      return true
    }

    return false
  }

  /**
   * 记录成功操作（重置错误计数）
   */
  recordSuccess(pluginId: string): void {
    this.errors.delete(pluginId)
  }

  /**
   * 获取插件的错误历史
   */
  getErrors(pluginId: string): PluginError[] {
    return this.errors.get(pluginId) || []
  }

  /**
   * 获取插件的最近错误
   */
  getRecentErrors(pluginId: string, count: number = 5): PluginError[] {
    const errors = this.errors.get(pluginId) || []
    return errors.slice(-count)
  }

  /**
   * 获取插件的错误统计
   */
  getStats(pluginId: string): { total: number; recent: number; lastError: PluginError | null } {
    const errors = this.errors.get(pluginId) || []
    this.pruneErrors(pluginId)
    const recent = this.errors.get(pluginId) || []
    return {
      total: errors.length,
      recent: recent.length,
      lastError: errors.length > 0 ? errors[errors.length - 1] : null
    }
  }

  /**
   * 清除插件的错误记录
   */
  clearErrors(pluginId: string): void {
    this.errors.delete(pluginId)
  }

  /**
   * 清理过期错误（超过时间窗口的）
   */
  private pruneErrors(pluginId: string): void {
    const errors = this.errors.get(pluginId)
    if (!errors) return

    const cutoff = Date.now() - this.threshold.windowMs
    const pruned = errors.filter(e => e.timestamp > cutoff)
    if (pruned.length === 0) {
      this.errors.delete(pluginId)
    } else {
      this.errors.set(pluginId, pruned)
    }
  }

  /**
   * 触发自动禁用
   */
  private triggerAutoDisable(pluginId: string): void {
    // 优先使用全局回调
    if (this.threshold.onAutoDisable) {
      try {
        this.threshold.onAutoDisable(pluginId)
      } catch (err) {
        logger.error(`[插件] 自动禁用 ${pluginId} 失败`, err)
      }
      return
    }

    // 否则使用 per-plugin 回调
    const callback = this.disableCallbacks.get(pluginId)
    if (callback) {
      try {
        callback()
      } catch (err) {
        logger.error(`[插件] 自动禁用 ${pluginId} 失败`, err)
      }
    }
  }

  /**
   * 获取所有有错误的插件
   */
  getPluginsWithErrors(): Array<{ pluginId: string; errorCount: number; lastError: PluginError | null }> {
    const result: Array<{ pluginId: string; errorCount: number; lastError: PluginError | null }> = []
    for (const [pluginId, errors] of this.errors) {
      if (errors.length > 0) {
        result.push({
          pluginId,
          errorCount: errors.length,
          lastError: errors[errors.length - 1]
        })
      }
    }
    return result
  }
}
