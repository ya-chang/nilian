<p align="center">
  <img src="https://nilian.ysf.pw/icon.png" width="96" height="96" alt="拟恋 Logo" style="border-radius: 24px" />
</p>

<h1 align="center">拟恋 · NiLian</h1>

<p align="center">
  <strong>AI 虚拟伴侣桌面应用</strong><br/>
  有记忆 · 有情绪 · 越聊越懂你
</p>

<p align="center">
  <a href="https://nilian.ysf.pw"><img src="https://img.shields.io/badge/官网-nilian.ysf.pw-FF6B8A?style=flat-square" alt="官网" /></a>
  <a href="https://github.com/ya-chang/nilian/releases"><img src="https://img.shields.io/github/v/release/ya-chang/nilian?style=flat-square&color=FF6B8A" alt="版本" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-FF6B8A?style=flat-square" alt="License" /></a>
  <img src="https://img.shields.io/badge/platform-Windows%2010%2B-FF6B8A?style=flat-square" alt="平台" />
  <img src="https://img.shields.io/badge/electron-33-FF6B8A?style=flat-square" alt="Electron" />
</p>

---

## 简介

**拟恋**是一款 Windows 桌面 AI 虚拟伴侣应用。不只是聊天机器人——它有记忆、有情绪、会主动关心你，越聊越懂你。

> 支持 DeepSeek / OpenAI / 自定义 API，所有数据本地存储，隐私绝对安全。

<p align="center">
  <a href="https://github.com/ya-chang/nilian/releases">
    <img src="https://img.shields.io/badge/⬇%20免费下载-Windows%2010%2B-FF6B8A?style=for-the-badge" alt="下载" />
  </a>
</p>

---

## 核心功能

<table>
  <tr>
    <td width="50%">
      <h3>🧠 三层记忆系统</h3>
      <p>短期记忆 + 长期记忆 + 对话摘要，三重记忆让 AI 真正记住你说过的每一句话，不会聊着聊着就忘了你是谁。</p>
    </td>
    <td width="50%">
      <h3>💗 十维情感模型</h3>
      <p>幸福、悲伤、愤怒、亲密、信任……十维情感状态机，情绪会随对话自然变化。角色会生气、会冷战，也会主动和好。</p>
    </td>
  </tr>
  <tr>
    <td>
      <h3>📚 知识库系统</h3>
      <p>5 个 MD 文件自动生成——人设档案、用户画像、对话摘要、风格学习、聊天记录。AI 会持续学习你的偏好和习惯。</p>
    </td>
    <td>
      <h3>🎵 音乐感知</h3>
      <p>内嵌网易云音乐，AI 实时感知你在听什么歌，陪你聊歌词、聊歌手、聊心情。</p>
    </td>
  </tr>
  <tr>
    <td>
      <h3>⏰ 主动关心</h3>
      <p>早安晚安、饭点提醒、太久没说话会主动想你。7 个时间段识别 + 50+ 个节日感知（公历+农历+网络节日）。</p>
    </td>
    <td>
      <h3>💬 真人感聊天</h3>
      <p>流式逐句输出、打字延迟、偶尔打错字、只回一个表情——像真人一样自然，不暴露 AI 身份。</p>
    </td>
  </tr>
  <tr>
    <td>
      <h3>🎭 人设模板</h3>
      <p>内置温柔体贴、高冷傲娇、活泼搞笑三种人设模板，一键创建，自由修改。支持自定义人设描述。</p>
    </td>
    <td>
      <h3>🔌 插件系统</h3>
      <p>支持社区开发插件，17 个已上架插件覆盖情感互动、性格扩展、功能增强、主题美化、趣味游戏、语音对话六大分类。</p>
    </td>
  </tr>
  <tr>
    <td>
      <h3>🛡️ 自动备份 & 崩溃恢复</h3>
      <p>每天凌晨 3 点自动备份，保留最近 7 份；锁文件检测 + 数据完整性检查，异常退出自动恢复。</p>
    </td>
    <td>
      <h3>🔒 数据本地化</h3>
      <p>所有聊天记录、记忆、情感数据存储在本地，不需要联网也能用，隐私绝对安全。</p>
    </td>
  </tr>
</table>

---

## 快速开始

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 打包 Windows exe
npm run build:win
```

### 配置 API

1. 复制 `.env.example` 为 `.env`
2. 填入你的 API Key：

```env
DEEPSEEK_API_KEY=sk-xxx
MIMO_API_KEY=sk-xxx
OPENAI_API_KEY=sk-xxx
```

3. 或在应用内设置页为每个角色单独配置 API Key

---

## 技术栈

| 层 | 技术 |
|---|---|
| 框架 | Electron 33 |
| 前端 | React 19 + TypeScript + Zustand |
| 构建 | electron-vite |
| 配置 | YAML |
| 打包 | electron-builder (NSIS) |

---

## 项目结构

```
src/
├── main/                    # Electron 主进程
│   ├── engine/              # 对话引擎、模型路由、人类化
│   ├── memory/              # 短期/长期记忆、摘要
│   ├── knowledge/           # 知识库生成（5 个 MD 文件）
│   ├── learning/            # 规则引擎、模型分析器
│   ├── emotion/             # 情感状态机
│   ├── character/           # 角色管理、人设模板
│   ├── proactive/           # 主动消息调度
│   ├── social/              # 朋友圈生成
│   ├── ipc/                 # IPC 通信处理
│   └── store/               # 数据持久化
├── renderer/                # React 前端
│   ├── components/          # UI 组件
│   ├── stores/              # 状态管理
│   └── hooks/               # 自定义 Hook
├── preload/                 # 预加载脚本
└── shared/                  # 共享类型和常量
```

---

## 数据存储

所有数据存储在本地：

| 环境 | 路径 |
|------|------|
| 打包后 | `%APPDATA%/ni-lian/` |
| 开发模式 | `./data/` |

包含角色配置、聊天记录、知识库、情感状态等。

---

## 相关链接

| 链接 | 说明 |
|------|------|
| [官网](https://nilian.ysf.pw) | 产品宣传网站 + 插件市场 |
| [插件仓库](https://github.com/ya-chang/nilian-plugins) | 插件数据 & 开发文档 |
| [使用指南](https://nilian.ysf.pw) | 角色塑造 & 调教指南 |
| [下载页面](https://github.com/ya-chang/nilian/releases) | GitHub Releases |

---

## License

MIT © ya-chang

---

<p align="center">
  <sub>Made with ❤️ by the community</sub>
</p>