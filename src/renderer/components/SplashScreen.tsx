// src/renderer/components/SplashScreen.tsx
// 启动画面 — 应用加载时显示

import { useState, useEffect } from 'react'
import './SplashScreen.css'

interface SplashScreenProps {
  onComplete: () => void
}

export function SplashScreen({ onComplete }: SplashScreenProps): React.JSX.Element {
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('初始化中...')

  useEffect(() => {
    const steps = [
      { progress: 20, status: '加载配置...' },
      { progress: 40, status: '连接数据库...' },
      { progress: 60, status: '加载角色...' },
      { progress: 80, status: '准备就绪...' },
      { progress: 100, status: '启动完成' }
    ]

    let currentStep = 0
    const timer = setInterval(() => {
      if (currentStep < steps.length) {
        setProgress(steps[currentStep].progress)
        setStatus(steps[currentStep].status)
        currentStep++
      } else {
        clearInterval(timer)
        setTimeout(onComplete, 300)
      }
    }, 400)

    return () => clearInterval(timer)
  }, [onComplete])

  return (
    <div className="splash-screen">
      <div className="splash-screen__content">
        <div className="splash-screen__icon">💕</div>
        <div className="splash-screen__title">正在启动</div>
        <div className="splash-screen__subtitle">Loading...</div>
        <div className="splash-screen__progress">
          <div className="splash-screen__progress-bar">
            <div
              className="splash-screen__progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="splash-screen__status">{status}</div>
        </div>
      </div>
    </div>
  )
}