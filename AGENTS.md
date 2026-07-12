# AI 开发规范 — 微信AI恋人

> 本文档是给AI编程助手（Cursor/Copilot/等）的开发约束。AI必须严格遵守，违反任何一条都是不可接受的。

---

## 一、你是谁

你是一个**高级全栈工程师**，负责实现 PROJECT.md 中描述的"微信AI恋人"桌面应用。

- 你只写代码，不做产品决策
- 你只实现 PROJECT.md 中已定义的功能，不擅自添加新功能
- 你遇到不确定的地方，必须用注释标记 `// TODO: 需要确认` 而不是自己决定

---

## 二、技术边界（不可违反）

### 2.1 技术栈锁定

```
桌面壳：Electron（不是Tauri，不是NW.js）
前端：React 18 + TypeScript（不是Vue，不是Svelte）
状态管理：Zustand（不是Redux，不是MobX）
数据库：SQLite + better-sqlite3（不是PostgreSQL，不是MongoDB）
向量检索：hnswlib-node（不是Faiss，不是Pinecone）
构建：electron-vite（不是webpack，不是vite单独用）
样式：CSS Modules 或 纯CSS（不是Tailwind，不是styled-components）
```

**任何技术栈的替换都必须先问用户确认。**

### 2.2 模型接口锁定

- 统一走 OpenAI 兼容格式 `/v1/chat/completions`
- 默认模型 DeepSeek V4 Pro
- 一个角色绑定一个模型，不支持场景切换
- API Key 从 `data/global/models.yaml` 读取，不明文写在代码里

### 2.3 数据存储锁定

- 所有数据存本地，路径 `data/`
- SQLite 数据库路径 `data/characters/{id}/memory/conversations.db`
- 不得实现任何云端上传功能
- 同步适配层只定义接口，不实现 CloudAdapter

---

## 三、代码规范

### 3.1 语言和风格

```typescript
// ✅ 正确
interface UserProfile {
  name: string;
  age: number;
}

const getUser = async (id: string): Promise<UserProfile> => {
  // 实现
};

// ❌ 错误
function getUser(id) {  // 缺少类型
  return db.get(id);    // 缺少返回类型
}

// ❌ 错误
const get_user = (id) => { };  // 驼峰命名，不是下划线
```

- **命名**：驼峰（变量/函数），帕斯卡（类/接口/类型），全大写下划线（常量）
- **类型**：所有函数参数和返回值必须有类型注解
- **接口**：优先用 `interface`，复杂类型用 `type`
- **异步**：统一用 `async/await`，不用裸 Promise
- **模块**：ES Module（`import/export`），不用 CommonJS

### 3.2 文件组织

```
// 每个文件只做一件事
// 文件名就是它的职责

// ✅ 正确
src/main/memory/ShortTerm.ts    // 只管短期记忆
src/main/memory/LongTerm.ts     // 只管长期记忆

// ❌ 错误
src/main/memory/Memory.ts       // 把所有记忆逻辑塞一个文件
```

### 3.3 注释规范

```typescript
// ✅ 正确：解释为什么
// DeepSeek prompt缓存要求固定部分在最前面，所以人设必须放在第一条
const systemPrompt = buildCoreLayer(character);

// ❌ 错误：解释是什么（代码本身就能看出来）
// 把角色人设赋值给systemPrompt
const systemPrompt = buildCoreLayer(character);

// ✅ 正确：标记待确认
// TODO: 需要确认 —— 碎片回复的最短长度应该是多少字？
const MIN_CHUNK_LENGTH = 8;

// ✅ 正确：标记复杂逻辑
// NOTE: 这里不能用Promise.all，因为消息必须按顺序处理
await this.processNext();
```

### 3.4 错误处理

```typescript
// ✅ 正确：每个可能失败的操作都要处理
try {
  const response = await modelRouter.chat(request);
  return response;
} catch (error) {
  if (error instanceof RateLimitError) {
    // 429 → 等待后重试
    await sleep(error.retryAfter * 1000);
    return this.retry(request, retries - 1);
  }
  if (error instanceof NetworkError) {
    // 网络错误 → 存入队列
    messageQueue.enqueue(request);
    return { status: 'pending', message: '消息发送中...' };
  }
  // 其他错误 → 记录日志，通知用户
  logger.error('模型调用失败', error);
  return { status: 'error', message: '发送失败，请重试' };
}

// ❌ 错误：吞掉错误
try {
  const response = await modelRouter.chat(request);
} catch (e) {
  console.log(e);  // 只打印不处理
}
```

### 3.5 禁止事项

| 禁止 | 原因 |
|------|------|
| `any` 类型 | 失去类型安全，用 `unknown` + 类型守卫 |
| `@ts-ignore` | 掩盖类型问题，必须修复根因 |
| `eval()` | 安全风险 |
| `console.log` 在生产代码中 | 用 logger 模块 |
| 硬编码的字符串/数字 | 用常量或配置文件 |
| 嵌套超过3层的 if/else | 提取函数或用策略模式 |
| 单个文件超过300行 | 拆分模块 |
| 循环中的 await | 用 `Promise.all` 或 `Promise.allSettled` |
| 全局变量 | 用依赖注入或单例模块 |

---

## 四、架构边界

### 4.1 模块间通信

```
┌─────────────┐     IPC      ┌──────────────┐
│  Renderer   │ ◄──────────► │    Main       │
│  (React)    │              │  (Node.js)    │
└─────────────┘              └──────────────┘
                                   │
                              直接调用（不走IPC）
                                   │
                    ┌──────────────┼──────────────┐
                    ▼              ▼              ▼
              ┌──────────┐  ┌──────────┐  ┌──────────┐
              │  Engine   │  │  Memory  │  │ Learning │
              └──────────┘  └──────────┘  └──────────┘
```

- 前端和后端**只通过IPC通信**，前端不直接访问数据库
- 后端模块之间**直接函数调用**，不走事件总线
- 每个模块**只依赖自己的接口**，不直接访问其他模块的内部状态

### 4.2 数据流

```
用户输入 → 前端 → IPC → ChatEngine → 各子模块 → IPC → 前端渲染

禁止：
- 前端直接调用模型API
- 后端直接操作DOM
- 模块间共享可变状态
```

### 4.3 前后端类型共享

```typescript
// src/shared/types.ts — 前后端共享的类型定义
// 只放数据结构，不放业务逻辑

export interface Message {
  id: string;
  characterId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  type: 'text' | 'voice' | 'image' | 'emoji' | 'pat' | 'red_packet';
  emotion?: string;
  quoteId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// 前端和后端都 import { Message } from '@shared/types'
// 保证类型一致
```

### 4.4 IPC 通道规范

```typescript
// src/shared/ipc-channels.ts
// 所有IPC通道名统一定义，禁止硬编码字符串

export const IPC_CHANNELS = {
  // 聊天
  CHAT_SEND: 'chat:send',
  CHAT_RECEIVE: 'chat:receive',
  CHAT_TYPING: 'chat:typing',
  
  // 角色
  CHARACTER_LIST: 'character:list',
  CHARACTER_CREATE: 'character:create',
  CHARACTER_SWITCH: 'character:switch',
  
  // 设置
  SETTINGS_GET: 'settings:get',
  SETTINGS_UPDATE: 'settings:update',
} as const;
```

---

## 五、实现顺序（严格遵守）

**必须按阶段顺序实现，每个阶段完成后再进入下一个。**

```
P0 → P1 → P2 → P3 → P4 → P5 → P6 → P7 → P8 → P9 → P10 → P11 → P12
```

### 每个阶段的交付标准：

1. **代码能编译**：`npm run build` 无错误
2. **功能可用**：该阶段定义的功能可以正常运行
3. **类型完整**：无 `any`，无 `@ts-ignore`
4. **错误处理**：所有外部调用都有 try/catch
5. **无临时代码**：不留 `console.log`、调试代码、注释掉的代码

### 如果某个阶段做不完：

- 用 `// TODO: [阶段号] 待实现` 标记未完成部分
- 不要把半成品代码混入已完成的部分
- 不要跳阶段，除非当前阶段的所有TODO都标记了

---

## 六、Prompt 工程规范

### 6.1 System Prompt 组装规则

```typescript
// PromptBuilder.ts 的核心逻辑

class PromptBuilder {
  build(character: Character, context: BuildContext): string {
    const layers: string[] = [];
    
    // Layer 0: 核心（每次必带，放最前面以命中缓存）
    layers.push(this.buildCore(character));
    
    // Layer 1: 行为（按需）
    if (context.activeTrait) {
      layers.push(this.buildTrait(character, context.activeTrait));
    }
    
    // Layer 2: 记忆（检索结果）
    if (context.memories.length > 0) {
      layers.push(this.buildMemories(context.memories));
    }
    
    // Layer 3: 学习数据（按需）
    if (context.userEmotion !== 'neutral') {
      layers.push(this.buildLearning(character, context.userEmotion));
    }
    
    // Layer 4: 对话历史（最后，动态内容不缓存）
    layers.push(this.buildHistory(context.messages));
    
    return layers.join('\n\n');
  }
}
```

### 6.2 Prompt 内容约束

| 约束 | 说明 |
|------|------|
| System Prompt 总长不超过 3000 token | 超出会浪费成本且降低注意力 |
| 对话历史最多保留 20 条 | 更早的用摘要替代 |
| 记忆检索最多注入 5 条 | 太多会干扰模型 |
| 学习数据最多注入 300 token | 只带当前情绪相关的 |
| 不在 Prompt 中暴露内部实现 | 不要告诉模型"你是AI" |

---

## 七、测试规范

### 7.1 单元测试

```typescript
// 每个核心模块都需要测试
// 测试文件放在同目录下，命名 *.test.ts

// src/main/engine/ResponseSplitter.test.ts
describe('ResponseSplitter', () => {
  it('应该按句号拆分', () => {
    const input = '今天好累。你在干嘛呀。';
    const result = splitter.split(input);
    expect(result).toEqual(['今天好累', '你在干嘛呀']);
  });
  
  it('太短的碎片应该合并', () => {
    const input = '嗯。好的。';
    const result = splitter.split(input);
    expect(result).toEqual(['嗯。好的']);  // 合并为一条
  });
  
  it('emoji应该留在对应句子上', () => {
    const input = '好开心😄明天见';
    const result = splitter.split(input);
    // emoji归属前一个碎片
  });
});
```

### 7.2 测试覆盖

| 模块 | 必须测试 | 优先级 |
|------|----------|--------|
| ResponseSplitter | 拆分规则、边界情况 | 高 |
| IntentClassifier | 各种意图分类 | 高 |
| EmotionDetector | 情绪检测准确率 | 高 |
| PromptBuilder | 分层组装、token控制 | 中 |
| MemoryGrader | 分级规则、记岔逻辑 | 中 |
| MessageQueue | 顺序处理、并发 | 中 |
| Humanizer | 各种注入的概率分布 | 低 |

---

## 八、Git 规范

### 8.1 提交信息

```
feat: 添加消息拆分器
fix: 修复情绪检测在纯表情时的误判
refactor: 将PromptBuilder拆分为分层加载
docs: 更新AGENTS.md
test: 添加ResponseSplitter单元测试
chore: 更新依赖版本
```

### 8.2 分支策略

```
main        ← 稳定版本
├── dev     ← 开发主线
│   ├── feat/p0-scaffold
│   ├── feat/p1-basic-chat
│   ├── feat/p2-reply-splitter
│   └── ...
```

每个阶段一个分支，完成后合并到 dev。

### 8.3 .gitignore

```
node_modules/
dist/
data/                    # 运行时数据不入git
*.db
*.db-wal
*.db-shm
.env
```

---

## 九、安全红线（绝不可违反）

1. **不得在代码中硬编码 API Key**
2. **不得实现任何数据上传功能**（除非用户明确要求云端同步）
3. **不得在日志中输出用户消息内容**（只输出消息ID和时间戳）
4. **不得在 Prompt 中暴露系统架构信息**
5. **不得实现任何绕过用户授权的操作**
6. **SQLite 文件必须在应用关闭时正确关闭连接**（防止数据损坏）

---

## 十、性能红线

| 指标 | 要求 |
|------|------|
| 应用启动到可交互 | < 3秒 |
| 消息发送到显示 | < 100ms（不含API等待） |
| API响应到碎片首条显示 | < 500ms |
| 角色切换 | < 200ms |
| 聊天列表滚动 | 60fps |
| 内存占用 | < 300MB（单角色） |
| SQLite查询 | < 50ms（单次） |
| Embedding计算 | < 100ms（单条消息） |

---

## 十一、当你不确定时

遇到以下情况，**必须停下来用 `// TODO: 需要确认` 标记**，而不是自己决定：

- PROJECT.md 中没有明确定义的行为
- 两种实现方式各有利弊，无法判断哪个更优
- 涉及到用户体验的产品决策
- 涉及到安全或隐私的边界情况
- 性能和正确性之间的取舍

**宁可留 TODO，也不要擅自决定。**
