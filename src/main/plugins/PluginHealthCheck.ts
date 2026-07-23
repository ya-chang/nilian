// src/main/plugins/PluginHealthCheck.ts
// 插件健康检查 — 心跳机制 + 感知插件健康监控

import { logger } from '../utils/logger'

interface HealthStatus {
  pluginId: string
  alive: boolean
  lastHeartbeat: number
  lastCheck: number
  consecutiveFailures: number
}

interface HealthCheckConfig {
  intervalMs: number        // 检查间隔
  timeoutMs: number         // 单次检查超时
  maxFailures: number       // 连续失败次数阈值
}

const DEFAULT_CONFIG: HealthCheckConfig = {
  intervalMs: 60 * 1000,      // 1分钟检查一次
  timeoutMs: 5 * 1000,        // 5秒超时
  maxFailures: 3               // 连续3次失败
}

export class PluginHealthCheck {
  private statuses: Map<string, HealthStatus> = new Map()
  private heartbeatCallbacks: Map<string, () => Promise<boolean>> = new Map()
  private failureCallbacks: Map<string, (pluginId: string) => void> = new Map()
  private intervalTimer: ReturnType<typeof setInterval> | null = null
  private config: HealthCheckConfig

  constructor(config?: Partial<HealthCheckConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * 注册心跳回调（插件提供）
   * 插件的 enable 钩子中调用 app.health.onHeartbeat(async () => true)
   */
  registerHeartbeat(pluginId: string, callback: () => Promise<boolean>): void {
    this.heartbeatCallbacks.set(pluginId, callback)
    this.statuses.set(pluginId, {
      pluginId,
      alive: true,
      lastHeartbeat: Date.now(),
      lastCheck: Date.now(),
      consecutiveFailures: 0
    })
    logger.debug(`[健康检查] 注册心跳: ${pluginId}`)
  }

  /**
   * 注册失败回调（当插件连续失败时调用）
   */
  onFailure(pluginId: string, callback: (pluginId: string) => void): void {
    this.failureCallbacks.set(pluginId, callback)
  }

  /**
   * 注销插件
   */
  unregister(pluginId: string): void {
    this.heartbeatCallbacks.delete(pluginId)
    this.failureCallbacks.delete(pluginId)
    this.statuses.delete(pluginId)
  }

  /**
   * 手动发送心跳（插件主动调用）
   */
  heartbeat(pluginId: string): void {
    const status = this.statuses.get(pluginId)
    if (status) {
      status.alive = true
      status.lastHeartbeat = Date.now()
      status.consecutiveFailures = 0
    }
  }

  /**
   * 启动定时健康检查
   */
  start(): void {
    if (this.intervalTimer) return

    this.intervalTimer = setInterval(() => {
      this.checkAll()
    }, this.config.intervalMs)

    logger.info(`[健康检查] 已启动，间隔 ${this.config.intervalMs / 1000}s`)
  }

  /**
   * 停止定时健康检查
   */
  stop(): void {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer)
      this.intervalTimer = null
    }
  }

  /**
   * 检查所有注册的插件
   */
  private async checkAll(): Promise<void> {
    for (const [pluginId, callback] of this.heartbeatCallbacks) {
      await this.checkPlugin(pluginId, callback)
    }
  }

  /**
   * 检查单个插件
   */
  private async checkPlugin(pluginId: string, callback: () => Promise<boolean>): Promise<void> {
    let status = this.statuses.get(pluginId)
    if (!status) {
      status = {
        pluginId,
        alive: true,
        lastHeartbeat: Date.now(),
        lastCheck: Date.now(),
        consecutiveFailures: 0
      }
      this.statuses.set(pluginId, status)
    }

    status.lastCheck = Date.now()

    try {
      // 带超时的心跳检查
      const result = await Promise.race([
        callback(),
        new Promise<boolean>((_, reject) =>
          setTimeout(() => reject(new Error('心跳超时')), this.config.timeoutMs)
        )
      ])

      if (result) {
        status.alive = true
        status.lastHeartbeat = Date.now()
        status.consecutiveFailures = 0
      } else {
        status.consecutiveFailures++
        status.alive = status.consecutiveFailures < this.config.maxFailures
        this.handleFailure(pluginId, status)
      }
    } catch (err) {
      status.consecutiveFailures++
      status.alive = status.consecutiveFailures < this.config.maxFailures
      logger.warn(`[健康检查] ${pluginId} 心跳失败: ${err instanceof Error ? err.message : String(err)}`)
      this.handleFailure(pluginId, status)
    }
  }

  /**
   * 处理连续失败
   */
  private handleFailure(pluginId: string, status: HealthStatus): void {
    if (status.consecutiveFailures >= this.config.maxFailures) {
      logger.error(`[健康检查] ${pluginId} 连续失败 ${status.consecutiveFailures} 次，触发失败回调`)
      const callback = this.failureCallbacks.get(pluginId)
      if (callback) {
        try {
          callback(pluginId)
        } catch (err) {
          logger.error(`[健康检查] 失败回调执行异常: ${pluginId}`, err)
        }
      }
    }
  }

  /**
   * 获取插件健康状态
   */
  getStatus(pluginId: string): HealthStatus | null {
    return this.statuses.get(pluginId) || null
  }

  /**
   * 获取所有插件健康状态
   */
  getAllStatuses(): HealthStatus[] {
    return Array.from(this.statuses.values())
  }

  /**
   * 检查插件是否健康
   */
  isHealthy(pluginId: string): boolean {
    return this.statuses.get(pluginId)?.alive ?? false
  }
}
