// src/main/utils/dataPath.ts
// 统一数据路径管理 — 所有用户数据存到一个根目录下

import { join } from 'path'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { logger } from './logger'

const SETTINGS_FILE = join(process.cwd(), 'data', 'global', 'settings.json')

interface AppSettings {
  dataDir: string
  theme: string
  fontSize: number
}

const DEFAULT_DATA_DIR = join(process.cwd(), 'data', 'app')

// 加载设置
const loadSettings = (): AppSettings => {
  try {
    if (existsSync(SETTINGS_FILE)) {
      const content = readFileSync(SETTINGS_FILE, 'utf-8')
      return JSON.parse(content)
    }
  } catch {
    // ignore
  }
  return { dataDir: DEFAULT_DATA_DIR, theme: 'default', fontSize: 14 }
}

// 保存设置
const saveSettings = (settings: AppSettings): void => {
  try {
    const dir = join(process.cwd(), 'data', 'global')
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }
    writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8')
  } catch {
    // ignore
  }
}

// 获取数据根目录
export const getDataDir = (): string => {
  const settings = loadSettings()
  return settings.dataDir || DEFAULT_DATA_DIR
}

// 设置数据根目录
export const setDataDir = (dir: string): void => {
  const settings = loadSettings()
  settings.dataDir = dir
  saveSettings(settings)
  logger.info(`数据目录切换为: ${dir}`)
}

// 获取子目录路径
export const getSubDir = (subdir: string): string => {
  const dataDir = getDataDir()
  const fullPath = join(dataDir, subdir)
  if (!existsSync(fullPath)) {
    mkdirSync(fullPath, { recursive: true })
  }
  return fullPath
}

// 预定义的子目录
export const PATHS = {
  get avatars() { return getSubDir('avatars') },
  get characters() { return getSubDir('characters') },
  get memories() { return getSubDir('memories') },
  get emotions() { return getSubDir('emotions') },
  get moments() { return getSubDir('moments') },
  get logs() { return getSubDir('logs') },
}
