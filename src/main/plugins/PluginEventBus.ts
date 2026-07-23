// src/main/plugins/PluginEventBus.ts
// 优先级事件总线 — 多插件监听同一事件时，按 priority 排序执行

import { EventEmitter } from 'events'
import { logger } from '../utils/logger'

interface ListenerEntry {
  pluginId: string
  priority: number
  callback: (...args: unknown[]) => void
}

interface AsyncListenerEntry {
  pluginId: string
  priority: number
  callback: (...args: unknown[]) => Promise<unknown>
}

export class PluginEventBus {
  private listeners: Map<string, ListenerEntry[]> = new Map()
  private asyncListeners: Map<string, AsyncListenerEntry[]> = new Map()
  private emitter = new EventEmitter()

  constructor() {
    this.emitter.setMaxListeners(100)
  }

  /**
   * 注册同步事件监听（按 priority 排序执行）
   */
  on(event: string, pluginId: string, priority: number, callback: (...args: unknown[]) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    const list = this.listeners.get(event)!
    list.push({ pluginId, priority, callback })
    // 按 priority 升序排列（数字越小越先执行）
    list.sort((a, b) => a.priority - b.priority)
  }

  /**
   * 注册异步事件监听（按 priority 排序执行）
   */
  onAsync(event: string, pluginId: string, priority: number, callback: (...args: unknown[]) => Promise<unknown>): void {
    if (!this.asyncListeners.has(event)) {
      this.asyncListeners.set(event, [])
    }
    const list = this.asyncListeners.get(event)!
    list.push({ pluginId, priority, callback })
    list.sort((a, b) => a.priority - b.priority)
  }

  /**
   * 移除指定插件的事件监听
   */
  off(event: string, pluginId: string): void {
    const syncList = this.listeners.get(event)
    if (syncList) {
      this.listeners.set(event, syncList.filter(l => l.pluginId !== pluginId))
    }
    const asyncList = this.asyncListeners.get(event)
    if (asyncList) {
      this.asyncListeners.set(event, asyncList.filter(l => l.pluginId !== pluginId))
    }
  }

  /**
   * 移除指定插件的所有事件监听
   */
  offAll(pluginId: string): void {
    for (const [event, list] of this.listeners) {
      this.listeners.set(event, list.filter(l => l.pluginId !== pluginId))
    }
    for (const [event, list] of this.asyncListeners) {
      this.asyncListeners.set(event, list.filter(l => l.pluginId !== pluginId))
    }
  }

  /**
   * EventEmitter 兼容：removeListener(event, callback)
   * 插件可能用 app.events.removeListener('proactive:morning', this.morningListener)
   */
  removeListener(event: string, callback: (...args: unknown[]) => void): void {
    const syncList = this.listeners.get(event)
    if (syncList) {
      this.listeners.set(event, syncList.filter(l => l.callback !== callback))
    }
    const asyncList = this.asyncListeners.get(event)
    if (asyncList) {
      this.asyncListeners.set(event, asyncList.filter(l => l.callback !== callback))
    }
  }

  /**
   * EventEmitter 兼容：removeAllListeners(event?)
   */
  removeAllListeners(event?: string): void {
    if (event) {
      this.listeners.delete(event)
      this.asyncListeners.delete(event)
    } else {
      this.listeners.clear()
      this.asyncListeners.clear()
    }
  }

  /**
   * 同步触发事件（按 priority 顺序执行所有监听器）
   */
  emit(event: string, ...args: unknown[]): void {
    const list = this.listeners.get(event) || []
    for (const entry of list) {
      try {
        entry.callback(...args)
      } catch (err) {
        logger.error(`[事件总线] ${event} 监听器 ${entry.pluginId} 执行失败`, err)
      }
    }
  }

  /**
   * 异步触发事件（按 priority 顺序执行所有监听器）
   */
  async emitAsync(event: string, ...args: unknown[]): Promise<void> {
    // 先执行同步监听器
    const syncList = this.listeners.get(event) || []
    for (const entry of syncList) {
      try {
        entry.callback(...args)
      } catch (err) {
        logger.error(`[事件总线] ${event} 监听器 ${entry.pluginId} 执行失败`, err)
      }
    }

    // 再执行异步监听器（按 priority 顺序 await）
    const asyncList = this.asyncListeners.get(event) || []
    for (const entry of asyncList) {
      try {
        await entry.callback(...args)
      } catch (err) {
        logger.error(`[事件总线] ${event} 异步监听器 ${entry.pluginId} 执行失败`, err)
      }
    }
  }

  /**
   * 获取事件的监听器列表（按 priority 排序）
   */
  getListeners(event: string): Array<{ pluginId: string; priority: number }> {
    const syncList = this.listeners.get(event) || []
    const asyncList = this.asyncListeners.get(event) || []
    return [...syncList, ...asyncList]
      .sort((a, b) => a.priority - b.priority)
      .map(l => ({ pluginId: l.pluginId, priority: l.priority }))
  }

  /**
   * 检查事件是否有监听器
   */
  hasListeners(event: string): boolean {
    const syncList = this.listeners.get(event)
    const asyncList = this.asyncListeners.get(event)
    return (syncList?.length ?? 0) + (asyncList?.length ?? 0) > 0
  }

  /**
   * 获取所有已注册的事件名
   */
  getEventNames(): string[] {
    const names = new Set<string>()
    for (const name of this.listeners.keys()) names.add(name)
    for (const name of this.asyncListeners.keys()) names.add(name)
    return Array.from(names)
  }

  /**
   * 清空所有监听器
   */
  clear(): void {
    this.listeners.clear()
    this.asyncListeners.clear()
  }
}
