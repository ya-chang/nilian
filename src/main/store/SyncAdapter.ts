// src/main/store/SyncAdapter.ts
// 同步适配层 — 本地/云端统一接口

export interface SyncAdapter {
  save(table: string, data: Record<string, unknown>): Promise<void>
  load(table: string, query?: Record<string, unknown>): Promise<Record<string, unknown>[]>
  delete(table: string, id: string): Promise<void>
  merge(table: string, remote: Record<string, unknown>[]): Promise<MergeResult>
}

export interface MergeResult {
  added: number
  updated: number
  skipped: number
  conflicts: string[]
}

export type MergeStrategy = 'append' | 'merge' | 'take_newer' | 'ask_user'

export interface TableMergeStrategy {
  [tableName: string]: MergeStrategy
}

// 默认合并策略
export const DEFAULT_MERGE_STRATEGY: TableMergeStrategy = {
  messages: 'append',
  memories: 'merge',
  learning: 'merge',
  emotion: 'take_newer',
  config: 'ask_user'
}
