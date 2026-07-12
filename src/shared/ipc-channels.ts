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
  WINDOW_CLOSE: 'window:close'
} as const

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS]
