// src/main/ipc/bannedWords.ts
// 禁词箱子 IPC

import { ipcMain } from 'electron'
import { BannedWordFilter } from '../filter/BannedWordFilter'

const filter = new BannedWordFilter()

export const registerBannedWordsIPC = (): void => {
  ipcMain.handle('bannedWords:list', () => {
    return { success: true, data: filter.getWords() }
  })

  ipcMain.handle('bannedWords:add', (_event, params: { word: string; action: 'remove' | 'replace'; replacement?: string }) => {
    filter.addWord(params.word, params.action, params.replacement)
    return { success: true }
  })

  ipcMain.handle('bannedWords:remove', (_event, params: { word: string }) => {
    filter.removeWord(params.word)
    return { success: true }
  })

  ipcMain.handle('bannedWords:getPrompt', () => {
    return { success: true, data: filter.buildPromptSection() }
  })
}

export { filter as bannedWordFilter }
