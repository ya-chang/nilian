// src/main/plugins/PluginPromptStore.ts
// 插件Prompt存储 — 全局/单角色Prompt的共享存储，供ChatEngine读取

interface PromptEntry {
  pluginId: string
  characterId?: string
  section: string
}

class PluginPromptStore {
  private globalPrompts: PromptEntry[] = []
  private characterPrompts: PromptEntry[] = []

  addGlobal(pluginId: string, section: string): void {
    // 移除该插件之前的全局 Prompt
    this.globalPrompts = this.globalPrompts.filter(p => p.pluginId !== pluginId)
    this.globalPrompts.push({ pluginId, section })
  }

  addCharacter(pluginId: string, characterId: string, section: string): void {
    this.characterPrompts = this.characterPrompts.filter(
      p => !(p.pluginId === pluginId && p.characterId === characterId)
    )
    this.characterPrompts.push({ pluginId, characterId, section })
  }

  getGlobalPrompts(): string[] {
    return this.globalPrompts.map(p => p.section)
  }

  getCharacterPrompts(characterId: string): string[] {
    return this.characterPrompts
      .filter(p => p.characterId === characterId)
      .map(p => p.section)
  }

  removeByPlugin(pluginId: string): void {
    this.globalPrompts = this.globalPrompts.filter(p => p.pluginId !== pluginId)
    this.characterPrompts = this.characterPrompts.filter(p => p.pluginId !== pluginId)
  }

  clear(): void {
    this.globalPrompts = []
    this.characterPrompts = []
  }
}

// 全局单例
export const pluginPromptStore = new PluginPromptStore()
