// src/preload/index.ts
// Preload 脚本，安全暴露 IPC 通道给渲染进程

import { contextBridge, ipcRenderer } from 'electron'

export interface ElectronAPI {
  minimize: () => void
  maximize: () => void
  close: () => void
  send: (channel: string, ...args: unknown[]) => void
  on: (channel: string, callback: (...args: unknown[]) => void) => void
  off: (channel: string, callback: (...args: unknown[]) => void) => void
  invoke: (channel: string, ...args: unknown[]) => Promise<unknown>
}

// 保存回调引用，用于清理
const listeners = new Map<string, Set<(...args: unknown[]) => void>>()

const electronAPI: ElectronAPI = {
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),
  send: (channel: string, ...args: unknown[]) => ipcRenderer.send(channel, ...args),
  on: (channel: string, callback: (...args: unknown[]) => void) => {
    const wrapper = (_event: Electron.IpcRendererEvent, ...args: unknown[]): void => callback(...args)
    ipcRenderer.on(channel, wrapper)
    if (!listeners.has(channel)) listeners.set(channel, new Set())
    listeners.get(channel)!.add(callback)
    // 保存 wrapper 引用以便清理
    ;(callback as unknown as { __wrapper__: typeof wrapper }).__wrapper__ = wrapper
  },
  off: (channel: string, callback: (...args: unknown[]) => void) => {
    const wrapper = (callback as unknown as { __wrapper__?: (...args: unknown[]) => void }).__wrapper__
    if (wrapper) {
      ipcRenderer.removeListener(channel, wrapper)
    }
    listeners.get(channel)?.delete(callback)
  },
  invoke: (channel: string, ...args: unknown[]) => ipcRenderer.invoke(channel, ...args)
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)
