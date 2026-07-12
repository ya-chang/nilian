// src/renderer/stores/characterStore.ts
// 角色状态管理 — Zustand

import { create } from 'zustand'

export interface CharacterConfig {
  id: string
  name: string
  avatar: string
  persona: string
  traits: string[]
  catchphrase?: string
  provider: string
  model: string
  apiKey?: string
  baseUrl?: string
  temperature: number
  maxTokens: number
  createdAt: string
  updatedAt: string
}

interface CharacterState {
  characters: CharacterConfig[]
  activeCharacter: CharacterConfig | null
  isLoading: boolean

  setCharacters: (characters: CharacterConfig[]) => void
  setActiveCharacter: (character: CharacterConfig | null) => void
  addCharacter: (character: CharacterConfig) => void
  updateCharacter: (id: string, updates: Partial<CharacterConfig>) => void
  removeCharacter: (id: string) => void
  setLoading: (loading: boolean) => void
}

export const useCharacterStore = create<CharacterState>((set) => ({
  characters: [],
  activeCharacter: null,
  isLoading: false,

  setCharacters: (characters) => set({ characters }),

  setActiveCharacter: (character) => set({ activeCharacter: character }),

  addCharacter: (character) =>
    set((state) => ({
      characters: [...state.characters, character]
    })),

  updateCharacter: (id, updates) =>
    set((state) => ({
      characters: state.characters.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
      activeCharacter:
        state.activeCharacter?.id === id
          ? { ...state.activeCharacter, ...updates }
          : state.activeCharacter
    })),

  removeCharacter: (id) =>
    set((state) => ({
      characters: state.characters.filter((c) => c.id !== id),
      activeCharacter:
        state.activeCharacter?.id === id ? null : state.activeCharacter
    })),

  setLoading: (loading) => set({ isLoading: loading })
}))
