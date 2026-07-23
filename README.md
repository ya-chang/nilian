<p align="center">
  <strong>🇬🇧 English</strong> | <a href="#-中文文档">中文</a>
</p>

**Moli（茉莉）** is an open-source AI companion desktop app with **persistent memory**, a **10-dimension emotion model**, and a **learning engine** that adapts to you over time.

> Your AI companion remembers everything you say, gets emotional, and becomes more like a real person the longer you chat.

| Feature | Description |
|:---|:---|
| 🧠 Memory System | Short-term + long-term + vector search + auto-summarization |
| 💗 Emotion Model | 10 dimensions: happiness, sadness, anger, trust, intimacy, patience... |
| 📖 Learning Engine | Learns your communication style, interests, and preferences |
| ⏰ Proactive Messages | Good morning, good night, "I miss you", holiday awareness (50+ holidays) |
| 🎵 Music Awareness | Detects what you're listening to, adapts conversation context |
| 🎤 Voice Messages | MiMo TTS with voice cloning support |
| 🔌 Multi-Provider | MiMo / DeepSeek / OpenAI / Ollama, OpenAI-compatible format |
| 💾 Privacy First | 100% local storage, no cloud, no data collection |
| 🔌 Plugin System | Extensible with community plugins, sandboxed execution |

[⬇️ Download](https://nilian.ysf.pw) · [📖 Docs](https://nilian.ysf.pw)

---

<a id="-中文文档"></a>


<div align="center">

<img src="resources/preview.png" alt="Moli 预览" width="600" />

# 🌸 Moli（茉莉）

### AI 虚拟伴侣桌面应用 —— 茉莉花开，模拟恋人的温度

[![Electron](https://img.shields.io/badge/Electron-33-47848F?logo=electron&style=flat-square)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&style=flat-square)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&style=flat-square)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
[![Version](https://img.shields.io/badge/Version-1.4.0-blue?style=flat-square)](https://github.com/ya-chang/nilian/releases)
[![Platform](https://img.shields.io/badge/Platform-Windows-0078D6?logo=windows&style=flat-square)](https://nilian.ysf.pw)

[官网](https://nilian.ysf.pw) · [下载](https://nilian.ysf.pw) · [使用指南](https://nilian.ysf.pw)

</div>

---

## 📖 项目简介

**Moli（茉莉）** 是一款基于 Electron 的 AI 虚拟伴侣桌面应用，模拟微信 PC 端 UI。名字取自「模拟恋人」的谐音，也是茉莉花的名字。所有数据本地存储，支持多角色切换，拥有完整的记忆系统、情感模型和学习能力。

> 🎯 **核心定位**：有记忆、有情绪、越聊越懂你的 AI 恋人。不是简单的 chatbot，而是能记住你说过的话、会生气会和好、会主动关心你的虚拟伴侣。

---

## ✨ 功能特性

### 🧠 记忆系统

| 层级 | 说明 |
|------|------|
| 🟢 短期记忆 | 当前对话上下文，自动滑动窗口管理 |
| 🔵 长期记忆 | 关键词检索 + 向量匹配，跨会话回忆 |
| 🟣 记忆评分 | 自动评估记忆重要性，优先保留关键信息 |
| 🟡 对话摘要 | 异步生成摘要，注入 System Prompt |

### 📚 知识库系统（5 个 MD 文件）

| 文件 | 说明 |
|------|------|
| `persona.md` | 人设定义（手动编辑，AI 不会修改） |
| `user_profile.md` | 用户画像（AI 自动提取更新） |
| `chat_summary.md` | 对话摘要（异步生成） |
| `style_learning.md` | 风格学习（用户的说话方式） |
| `chat_logs.md` | 聊天记录（精选关键对话） |

### 💗 十维情感模型

| 维度 | 说明 |
|------|------|
| 开心 😊 | 积极情绪，影响回复语气 |
| 悲伤 😢 | 消极情绪，触发安慰行为 |
| 生气 😠 | 愤怒程度，会生气也会和好 |
| 焦虑 😰 | 不安情绪，影响主动消息频率 |
| 好感 💕 | 对用户的喜欢程度 |
| 亲密度 🔥 | 关系亲密程度 |
| 信任 🤝 | 对用户的信任度 |
| 精力 ⚡ | 活跃度，影响回复长度 |
| 思念 💭 | 想念程度，触发主动消息 |
| 耐心 🧘 | 容忍度，影响冲突处理 |

### 🔧 核心功能

| 功能 | 说明 |
|------|------|
| 🤖 **多角色** | 支持创建多个 AI 角色，傲娇女友 / 温柔姐姐 / 搞笑担当 |
| 📡 **流式输出** | SSE 流式对话，模拟真人打字节奏 |
| 🎭 **情感状态机** | EmotionFSM，10 维情感实时变化，会生气、会和好 |
| 📖 **学习系统** | RuleEngine（实时规则）+ ModelAnalyzer（周期分析） |
| 🎯 **意图分类** | IntentClassifier，自动识别用户意图 |
| ⏰ **主动消息** | 早安晚安、想你提醒、节假日感知（50+ 节日） |
| 👋 **拍一拍** | 4 种人设 × 8 句回应，跟随角色设定 |
| 🎵 **音乐感知** | 内嵌网易云音乐，AI 可识别听歌状态 |
| 🎤 **语音合成** | MiMo TTS，精品音色 / 音色设计 / 音色克隆 |
| 🎁 **社交互动** | 红包、表情包、消息引用、朋友圈自动生成 |
| 🔌 **插件系统** | 社区插件，PluginSandbox 安全隔离 |
| 💾 **自动备份** | 每天凌晨 3 点备份，保留最近 7 份 |
| 🛡️ **崩溃恢复** | 锁文件检测 + 数据完整性检查 |
| 🌐 **多 Provider** | MiMo / DeepSeek / OpenAI / Ollama，统一 OpenAI 兼容格式 |

---

## 🚀 快速开始

### 环境要求

- Node.js 18+
- Windows 10 及以上

### 安装运行

```bash
# 克隆仓库
git clone https://github.com/ya-chang/nilian.git
cd nilian

# 安装依赖
npm install

# 开发模式
npm run dev
```

### 打包

```bash
# 打包 Windows 安装程序
npm run build:win
```

---

## ⚙️ API 配置

### 方式一：环境变量

```bash
cp .env.example .env
# 编辑 .env 填入 API Key
```

```env
DEEPSEEK_API_KEY=sk-xxx
MIMO_API_KEY=sk-xxx
OPENAI_API_KEY=sk-xxx
```

### 方式二：应用内设置

每个角色可独立配置 API Provider / Model / API Key，全局配置不参与。

---

## 📁 项目结构

```
ni-lian/
├── src/
│   ├── main/                    # Electron 主进程
│   │   ├── engine/              # 对话引擎、模型路由、人类化
│   │   ├── memory/              # 短期/长期记忆、摘要
│   │   ├── knowledge/           # 知识库生成（5 个 MD 文件）
│   │   ├── learning/            # 规则引擎、模型分析器
│   │   ├── emotion/             # 情感状态机（EmotionFSM）
│   │   ├── character/           # 角色管理、人设模板
│   │   ├── proactive/           # 主动消息调度
│   │   ├── social/              # 朋友圈生成
│   │   ├── music/               # 音乐感知（网易云）
│   │   ├── tts/                 # 语音合成（MiMo TTS）
│   │   ├── plugins/             # 插件系统
│   │   ├── backup/              # 自动备份 + 崩溃恢复
│   │   ├── awareness/           # 节假日 + 时间感知
│   │   ├── filter/              # 敏感词过滤
│   │   └── store/               # 数据持久化
│   ├── renderer/                # React 前端
│   │   ├── components/          # UI 组件（chat/character/settings/plugins...）
│   │   ├── stores/              # Zustand 状态管理
│   │   ├── hooks/               # 自定义 Hook
│   │   └── services/            # 前端服务层
│   ├── preload/                 # 预加载脚本
│   └── shared/                  # 共享类型和常量
├── resources/                   # 图标等资源
├── electron.vite.config.ts      # 构建配置
└── package.json
```

---

## 🛠️ 技术栈

| 技术 | 用途 |
|------|------|
| [Electron 33](https://www.electronjs.org/) | 桌面应用框架 |
| [React 19](https://react.dev/) | UI 框架 |
| [TypeScript 5.8](https://www.typescriptlang.org/) | 类型安全 |
| [Zustand](https://github.com/pmndrs/zustand) | 状态管理 |
| [electron-vite](https://electron-vite.org/) | 构建工具 |
| [electron-builder](https://www.electron.build/) | 应用打包 |
| [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) | 数据库 |
| [hnswlib-node](https://github.com/yoshoku/hnswlib-node) | 向量检索 |

---

## 🔒 数据安全

- 所有数据存储在本地（`%APPDATA%/ni-lian/`）
- API Key 按角色隔离，不明文写在代码中
- 数据不经过云端，不上传服务器
- 日志不输出用户消息内容

---

## 📄 许可证

本项目基于 [MIT License](LICENSE) 开源。

---

<div align="center">

**Moli（茉莉）—— 茉莉花开，模拟恋人的温度**

</div>
