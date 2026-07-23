// src/renderer/main.tsx
// 渲染进程入口

import React from 'react'
import ReactDOM from 'react-dom/client'
import { installIPCShim } from './ipc-shim'
import App from './App'
import { ErrorBoundary } from './components/ErrorBoundary'
import './styles/global.css'

// 安装 IPC 模拟层（替代 Electron 主进程通信）
installIPCShim()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
)
