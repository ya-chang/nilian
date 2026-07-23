// src/shared/ipc-channels.ts
// 所有IPC通道名统一定义，禁止硬编码字符串

export const IPC_CHANNELS = {
  // 聊天
  CHAT_SEND: 'chat:send',
  CHAT_RECEIVE: 'chat:receive',
  CHAT_CHUNK: 'chat:chunk',
  CHAT_TYPING: 'chat:typing',
  CHAT_HISTORY: 'chat:history',
  CHAT_LOAD_MESSAGES: 'chat:loadMessages',
  CHAT_SAVE_MESSAGES: 'chat:saveMessages',
  CHAT_DELETE_MESSAGES: 'chat:deleteMessages',

  // 角色
  CHARACTER_LIST: 'character:list',
  CHARACTER_CREATE: 'character:create',
  CHARACTER_SWITCH: 'character:switch',
  CHARACTER_UPDATE: 'character:update',
  CHARACTER_DELETE: 'character:delete',

  // 知识库（MD 文件）
  KNOWLEDGE_GET_PERSONA: 'knowledge:getPersona',
  KNOWLEDGE_SET_PERSONA: 'knowledge:setPersona',
  KNOWLEDGE_GET_ALL: 'knowledge:getAll',

  // 设置
  SETTINGS_GET: 'settings:get',
  SETTINGS_UPDATE: 'settings:update',

  // 通用
  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_MAXIMIZE: 'window:maximize',
  WINDOW_CLOSE: 'window:close',

  // 插件
  PLUGIN_INSTALL: 'plugin:install',
  PLUGIN_UNINSTALL: 'plugin:uninstall',
  PLUGIN_ENABLE: 'plugin:enable',
  PLUGIN_DISABLE: 'plugin:disable',
  PLUGIN_SWITCH_TARGET: 'plugin:switch-target',
  PLUGIN_GET_INSTALLED: 'plugin:get-installed',
  PLUGIN_GET_PERMISSIONS: 'plugin:get-permissions',
  PLUGIN_OPEN_FILE_DIALOG: 'plugin:open-file-dialog',

  // 备份
  BACKUP_NOW: 'backup:now',
  BACKUP_RESTORE: 'backup:restore',
  BACKUP_LIST: 'backup:list',
  BACKUP_CHECK_INTEGRITY: 'backup:check-integrity',
  BACKUP_GET_STATUS: 'backup:get-status',

  // 语音合成
  TTS_TOGGLE: 'tts:toggle',
  TTS_SET_VOICE: 'tts:set-voice',
  TTS_GET_STATE: 'tts:get-state',
  TTS_GET_VOICES: 'tts:get-voices',
  TTS_GET_MODELS: 'tts:get-models',
  TTS_SYNTHESIZE: 'tts:synthesize',
  TTS_INIT: 'tts:init',
  TTS_GET_CACHE_SIZE: 'tts:get-cache-size',
  TTS_CLEAR_CACHE: 'tts:clear-cache',
  TTS_STATE_CHANGED: 'tts:state-changed',
} as const

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS]
