// src/main/store/CloudAdapter.ts
// 云端存储适配器 — 预留接口，不实现

import type { SyncAdapter, MergeResult } from './SyncAdapter'

// TODO: [P12] 待实现 —— 云端同步功能
// 当前为占位实现，所有操作返回空结果

export class CloudAdapter implements SyncAdapter {
  private apiKey: string
  private baseUrl: string

  constructor(apiKey: string = '', baseUrl: string = '') {
    this.apiKey = apiKey
    this.baseUrl = baseUrl
  }

  async save(_table: string, _data: Record<string, unknown>): Promise<void> {
    // TODO: [P12] 待实现 —— 调用云端 API 保存数据
    console.warn('CloudAdapter.save() 未实现')
  }

  async load(_table: string, _query?: Record<string, unknown>): Promise<Record<string, unknown>[]> {
    // TODO: [P12] 待实现 —— 调用云端 API 加载数据
    console.warn('CloudAdapter.load() 未实现')
    return []
  }

  async delete(_table: string, _id: string): Promise<void> {
    // TODO: [P12] 待实现 —— 调用云端 API 删除数据
    console.warn('CloudAdapter.delete() 未实现')
  }

  async merge(_table: string, _remote: Record<string, unknown>[]): Promise<MergeResult> {
    // TODO: [P12] 待实现 —— 云端数据合并
    console.warn('CloudAdapter.merge() 未实现')
    return { added: 0, updated: 0, skipped: 0, conflicts: [] }
  }

  isConnected(): boolean {
    return this.apiKey.length > 0 && this.baseUrl.length > 0
  }
}
