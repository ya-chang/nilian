// src/main/plugins/PluginPermissions.ts
// 插件权限检查 — 运行时验证插件是否有权执行操作

import { logger } from '../utils/logger'

// 所有权限定义及风险等级
export const PERMISSION_REGISTRY: Record<string, { label: string; risk: 'low' | 'medium' | 'high'; description: string }> = {
  'chat.read': { label: '读取聊天记录', risk: 'medium', description: '读取用户的聊天历史' },
  'chat.send': { label: '发送消息', risk: 'medium', description: '以用户或AI身份发送消息' },
  'ai.prompt': { label: '修改AI的Prompt', risk: 'medium', description: '向AI的系统提示词中追加内容' },
  'ai.behavior': { label: '添加AI行为策略', risk: 'medium', description: '添加自定义的AI行为规则' },
  'ai.context': { label: '注入AI上下文', risk: 'medium', description: '向AI注入感知事件上下文' },
  'ui.nav': { label: '添加导航页面', risk: 'low', description: '在侧边栏添加自定义页面' },
  'ui.theme': { label: '修改主题', risk: 'low', description: '注入CSS修改界面样式' },
  'ui.message': { label: '注册消息类型', risk: 'low', description: '注册自定义消息的渲染方式' },
  'data.read': { label: '读取角色数据', risk: 'medium', description: '读取角色配置、记忆、情感状态' },
  'data.write': { label: '写入角色数据', risk: 'high', description: '修改角色数据、记忆' },
  'api.request': { label: '发起外部请求', risk: 'high', description: '向外部API发送HTTP请求' },
  'file.read': { label: '读取本地文件', risk: 'high', description: '读取本地文件系统中的文件' },
  'file.write': { label: '写入本地文件', risk: 'high', description: '向本地文件系统写入文件' },
  'sensor.system': { label: '监听系统行为', risk: 'high', description: '监听用户打开的应用、文件变化等' }
}

// 权限开关状态
interface PermissionSwitch {
  granted: boolean
}

export class PluginPermissions {
  // pluginId → permission → granted
  private switches: Map<string, Map<string, PermissionSwitch>> = new Map()

  /**
   * 检查插件是否拥有所需权限
   * @returns 通过返回 true，不通过返回缺失的权限列表
   */
  check(pluginId: string, requiredPermissions: string[]): { allowed: boolean; denied: string[] } {
    const denied: string[] = []
    const pluginSwitches = this.switches.get(pluginId)

    for (const perm of requiredPermissions) {
      if (!pluginSwitches?.has(perm)) {
        // 没有记录 → 默认拒绝
        denied.push(perm)
        continue
      }
      if (!pluginSwitches.get(perm)!.granted) {
        denied.push(perm)
      }
    }

    if (denied.length > 0) {
      logger.warn(`插件 ${pluginId} 权限不足: ${denied.join(', ')}`)
    }

    return { allowed: denied.length === 0, denied }
  }

  /**
   * 检查单个权限
   */
  hasPermission(pluginId: string, permission: string): boolean {
    const pluginSwitches = this.switches.get(pluginId)
    return pluginSwitches?.get(permission)?.granted ?? false
  }

  /**
   * 设置权限开关
   */
  setPermission(pluginId: string, permission: string, granted: boolean): void {
    if (!this.switches.has(pluginId)) {
      this.switches.set(pluginId, new Map())
    }
    this.switches.get(pluginId)!.set(permission, { granted })
  }

  /**
   * 批量设置权限（安装时用）
   */
  setPermissions(pluginId: string, permissions: string[], granted: boolean): void {
    for (const perm of permissions) {
      this.setPermission(pluginId, perm, granted)
    }
  }

  /**
   * 初始化：安装时默认全部允许（用户可在确认弹窗中关闭）
   */
  initOnInstall(pluginId: string, permissions: string[]): void {
    this.setPermissions(pluginId, permissions, true)
  }

  /**
   * 获取插件的权限状态
   */
  getPermissions(pluginId: string): Array<{ permission: string; granted: boolean; info: typeof PERMISSION_REGISTRY[string] }> {
    const result: Array<{ permission: string; granted: boolean; info: typeof PERMISSION_REGISTRY[string] }> = []
    const allPerms = Object.keys(PERMISSION_REGISTRY)
    const pluginSwitches = this.switches.get(pluginId)

    for (const perm of allPerms) {
      const info = PERMISSION_REGISTRY[perm]
      const granted = pluginSwitches?.get(perm)?.granted ?? false
      result.push({ permission: perm, granted, info })
    }

    return result
  }

  /**
   * 获取插件实际拥有的权限（meta.permissions 中声明的）
   */
  getPluginRequiredPermissions(pluginId: string, metaPermissions: string[]): Array<{ permission: string; granted: boolean; info: typeof PERMISSION_REGISTRY[string] }> {
    return metaPermissions.map(perm => ({
      permission: perm,
      granted: this.hasPermission(pluginId, perm),
      info: PERMISSION_REGISTRY[perm] || { label: perm, risk: 'medium' as const, description: '' }
    }))
  }

  /**
   * 卸载时清理
   */
  cleanup(pluginId: string): void {
    this.switches.delete(pluginId)
  }
}
