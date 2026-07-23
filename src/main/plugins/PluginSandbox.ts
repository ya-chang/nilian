// src/main/plugins/PluginSandbox.ts
// 插件沙箱 — 在隔离环境中执行插件代码

import vm from 'vm'
import { logger } from '../utils/logger'

export interface PluginModule {
  meta: {
    id: string
    name: string
    version: string
    author?: string
    description?: string
    type?: 'normal' | 'sensor'
    scope?: 'global' | 'character'
    priority?: number
    permissions?: string[]
    configSchema?: ConfigField[]
  }
  install?(app: unknown): void
  enable?(app: unknown): void | Promise<void>
  disable?(app: unknown): void
  uninstall?(app: unknown): void
  [key: string]: unknown
}

export interface ConfigField {
  key: string
  label: string
  type: 'text' | 'number' | 'toggle' | 'select' | 'color' | 'textarea'
  default?: unknown
  placeholder?: string
  options?: Array<{ label: string; value: unknown }>
  min?: number
  max?: number
}

export class PluginSandbox {
  /**
   * 在沙箱中加载并解析插件代码
   * 返回 module.exports 的内容
   */
  load(code: string, filePath: string): PluginModule {
    const sandbox = {
      module: { exports: {} as PluginModule },
      exports: {},
      console,
      setTimeout,
      setInterval,
      clearTimeout,
      clearInterval,
      Buffer,
      require
    }

    try {
      const context = vm.createContext(sandbox)
      const script = new vm.Script(code, { filename: filePath })
      script.runInContext(context, { timeout: 5000 })

      return sandbox.module.exports
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error)
      logger.error(`插件加载失败: ${filePath}`, errMsg)
      throw new Error(`插件代码执行错误: ${errMsg}`)
    }
  }
}
