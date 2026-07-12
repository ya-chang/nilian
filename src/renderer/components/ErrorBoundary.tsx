// src/renderer/renderer/components/ErrorBoundary.tsx
// React Error Boundary — 捕获渲染错误，防止白屏闪退

import React, { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('[ErrorBoundary] 渲染错误:', error.message, errorInfo.componentStack)
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '20px',
          color: '#ff4d4f',
          fontFamily: 'monospace',
          fontSize: '13px',
          background: '#fff',
          height: '100vh',
          overflow: 'auto'
        }}>
          <h3 style={{ margin: '0 0 8px' }}>应用遇到了错误</h3>
          <pre style={{
            background: '#f5f5f5',
            padding: '12px',
            borderRadius: '4px',
            overflow: 'auto',
            whiteSpace: 'pre-wrap'
          }}>
            {this.state.error?.message}
            {'\n\n'}
            {this.state.error?.stack}
          </pre>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null })
              window.location.reload()
            }}
            style={{
              marginTop: '12px',
              padding: '6px 16px',
              cursor: 'pointer',
              border: '1px solid #d9d9d9',
              borderRadius: '4px',
              background: '#fff'
            }}
          >
            重新加载
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
