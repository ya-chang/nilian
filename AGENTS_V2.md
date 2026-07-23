# AI 开发规范 V2 — 补充约束

> 本文档是 AGENTS.md 的补充，专门约束网易云插件和V2新增功能的开发行为。
> 发给AI干活时，AGENTS.md + AGENTS_V2.md 一起发。

---

## 一、通用补充

### 1.1 不要改已有代码

```
你只负责新增功能，不要修改 P0-P12 已经写好的代码。
如果新功能需要跟已有模块交互，通过接口调用，不要改动已有模块的内部实现。

除非：
- 已有代码有明确的bug（会导致崩溃或数据丢失）
- 新功能必须追加到已有文件（比如 ipc-channels.ts 追加新通道）

遇到以上情况，改动范围必须最小化，不要顺手"重构"或"优化"。
```

### 1.2 不要加多余的东西

```
只实现文档中定义的功能，不要擅自添加：
- 不要加文档里没有的按钮/页面/选项
- 不要加"我觉得用户可能需要"的功能
- 不要加"顺便做一下"的优化
- 不要加动画/过渡效果（除非文档明确要求）

宁可做得少，不要做得乱。
```

### 1.3 每个功能独立开发

```
5个V2功能 + 网易云插件，按优先级一个一个做。
做完一个，确认能用，再做下一个。
不要同时开发多个功能。
```

---

## 二、网易云插件约束

### 2.1 iframe安全

```
- 网易云网页版通过 BrowserView 加载，不是 iframe
- 使用 partition: 'persist:music' 保持登录态
- 注入脚本通过 preload + contextBridge 通信
- 不要直接在注入脚本中访问 Electron API
- 不要修改网易云网页的DOM结构
```

### 2.2 公开API调用

```
- 歌曲信息通过网易云公开API获取（/api/song/detail, /api/song/lyric 等）
- API请求失败时静默处理，不弹错误
- 结果要缓存，同一首歌不重复请求
- 不要在API请求中携带用户隐私数据
- 不要调用需要登录的API（只用公开接口）
```

### 2.3 注入脚本边界

```
注入脚本只做：
✅ 监听URL hash变化
✅ 监听audio元素的播放/暂停/进度事件
✅ 通过preload桥接通知主进程

注入脚本不做：
❌ 不修改网易云页面的任何DOM
❌ 不拦截网易云的网络请求
❌ 不注入CSS样式
❌ 不读取网易云的cookie/localStorage
❌ 不模拟用户点击操作
```

### 2.4 歌词面板

```
- 歌词实时滚动只在用户在听歌页面时生效
- 用户切到其他页面时歌词停止滚动
- 播放进度通过注入脚本获取，500ms节流通知前端
- 歌词面板不要自动播放/切歌（那是网易云的事）
```

### 2.5 AI上下文

```
- 歌曲信息注入到AI的Prompt中，但AI不要主动提及
- 歌词只注入前10句，不注入全部
- 热门评论只注入前3条
- 用户没问歌相关的问题时，AI假装不知道用户在听歌
```

---

## 三、自定义表情包约束

### 3.1 文件管理

```
- 表情包文件存储在 data/characters/{id}/emojis/ 下
- 支持格式：png, jpg, gif, webp
- 单个文件不超过 2MB
- 总数量不超过 200个
- 文件名用UUID，不保留原文件名
```

### 3.2 AI发送表情包

```
- AI发表情包的频率跟随用户（用户发得多AI就发得多）
- AI只从用户发过的表情包里选择（AI没有自己的表情包库）
- 单条消息最多附带1个表情包
- 不要每条消息都发表情包
- 连续两条消息不发表情包（避免过度）
- 表情包是图片消息，不是文字消息里嵌入图片
```

### 3.3 不分类

```
- 所有表情包平铺在一个列表里
- 不要自动分类（搞笑/可爱/无语等）
- 不要加标签系统
- 用户可以删除表情包，但不能编辑（不裁剪、不加文字）
```

---

## 四、"在干嘛"机制约束

### 4.1 触发规则

```
- 3-4小时没聊天后触发
- 冷却时间4小时（触发后4小时内不再触发）
- 晚上8点后不主动发消息
- 用户生气时不问（换别的关心方式）
- 用户难过时不问
```

### 4.2 开场方式

```
- 从预设的7种开场方式中随机选一个
- 不要每次都用同一种
- 不要自己创造新的开场方式（只用预设的）
```

### 4.3 状态判断

```
- 用规则引擎匹配关键词判断用户状态（不调API）
- 匹配到状态后，按预设策略回复
- 匹配不到时，正常聊天即可
- 不要追问用户"你到底在干嘛"
```

---

## 五、禁词箱子约束

### 5.1 过滤方式

```
- 双重保障：Prompt注入 + 后处理过滤
- Prompt注入：在System Prompt中告诉模型不能用这些词
- 后处理：模型回复后，检查是否包含禁词，有则过滤
- 过滤后清理多余空格
```

### 5.2 UI

```
- 设置页：添加/删除禁词，选择"删除"或"替换"
- 不要预设任何禁词（用户自己添加）
- 不要建议用户添加什么禁词
```

---

## 六、自动更新约束

### 6.1 检查方式

```
- 启动时静默检查（不弹窗打扰）
- 手动检查：设置 → 关于 → 检查更新
- 使用 electron-updater
- 更新源配置在 package.json 的 build.publish 中
```

### 6.2 用户选择

```
- "立即更新" → 下载 → 重启安装
- "稍后提醒" → 关闭弹窗，不再提醒（下次启动也不提醒）
- "跳过此版本" → 记录版本号，等下个版本再一起提醒
```

### 6.3 不要做的事

```
- 不要强制更新（用户可以选择不更新）
- 不要后台自动下载（用户确认后才下载）
- 不要弹太多通知（启动时检查一次就够）
```

---

## 七、聊天记录搜索约束

### 7.1 搜索范围

```
- 默认搜索当前对话（当前角色的聊天记录）
- 搜索框在聊天窗口顶部
- Ctrl+F 快捷键打开搜索
```

### 7.2 搜索实现

```
- 使用 SQLite FTS5 全文索引
- 建表时同步创建FTS索引和触发器
- 搜索结果按时间倒序排列
- 最多显示20条结果
```

### 7.3 高亮和跳转

```
- 搜索结果中关键词用 <mark> 标签高亮
- 点击"跳转"按钮，聊天窗口滚动到该消息位置
- 跳转后目标消息短暂高亮（2秒后消失）
```

### 7.4 无结果

```
- 搜不到时显示："没有找到相关消息"
- 不要提示"去数据库查找"（那是内部实现，不要暴露给用户）
```

---

## 八、文件规范

### 8.1 新增文件命名

```
网易云插件：
  src/main/music/NeteaseDetector.ts
  src/main/music/MusicInfoService.ts
  src/main/music/MusicContextInjector.ts
  src/main/music/MusicState.ts
  src/main/music/MusicWindow.ts
  src/main/music/ipc.ts
  src/preload/music.ts
  src/renderer/components/music/MusicPage.tsx
  src/renderer/components/music/LyricsPanel.tsx
  src/renderer/components/music/SongInfoPanel.tsx
  src/renderer/components/music/HotComments.tsx
  src/renderer/components/music/NowPlaying.tsx
  src/renderer/styles/music.css

V2功能：
  src/main/updater.ts
  src/main/search/MessageSearch.ts
  src/main/filter/BannedWordFilter.ts
  src/main/emojis/EmojiManager.ts
  src/main/proactive/WhatDoingTrigger.ts
  src/renderer/components/search/SearchBar.tsx
  src/renderer/components/settings/BannedWords.tsx
  src/renderer/components/emojis/EmojiPanel.tsx
  src/renderer/components/emojis/EmojiUploader.tsx
```

### 8.2 修改已有文件

```
只允许追加，不允许删除或重写已有代码：
  src/shared/ipc-channels.ts     → 追加新的channel常量
  src/main/index.ts              → 追加初始化代码
  src/main/engine/PromptBuilder.ts → 追加禁词Prompt + 音乐上下文
  src/renderer/App.tsx           → 追加路由和导航按钮
  src/renderer/stores/chatStore.ts → 追加新状态
```

---

## 九、质量检查清单

每个功能完成后，对照检查：

```
[ ] 代码能编译：npm run build 无错误
[ ] 功能可用：按文档描述的操作流程走一遍
[ ] 无any类型：搜索代码确认
[ ] 无console.log：搜索代码确认
[ ] 错误处理：所有外部调用有try/catch
[ ] 不改已有代码：git diff确认只新增不修改
[ ] 文件大小合理：单个文件不超过300行
[ ] 无硬编码：配置项从配置文件读取
```
