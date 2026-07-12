// src/renderer/stores/contactStore.ts
// 通讯录选中状态

import { create } from 'zustand'

interface ContactState {
  selectedContactId: string | null
  setSelectedContactId: (id: string | null) => void
}

export const useContactStore = create<ContactState>((set) => ({
  selectedContactId: null,
  setSelectedContactId: (id) => set({ selectedContactId: id })
}))
