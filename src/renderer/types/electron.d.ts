// src/renderer/types/electron.d.ts
// 类型声明 — 移动端不需要 Electron API，但保留类型以避免编译错误

interface Window {
  electronAPI?: {
    invoke: (...args: unknown[]) => Promise<unknown>
    send: (...args: unknown[]) => void
    on: (...args: unknown[]) => void
    off: (...args: unknown[]) => void
    minimize?: () => void
    maximize?: () => void
    close?: () => void
  }
}
