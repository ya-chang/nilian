// src/preload/music.ts
// 注入到网易云页面的preload桥接

import { ipcRenderer } from 'electron'

// 定期检查 URL hash 变化
let lastHash = ''

function checkHash(): void {
  const hash = window.location.hash
  if (hash !== lastHash) {
    lastHash = hash
    const match = hash.match(/song\?id=(\d+)/) || hash.match(/id=(\d+)/)
    if (match) {
      const songId = match[1]
      ipcRenderer.send('music:song-changed-from-webview', songId)
    }
  }
}

// 每秒检查一次
setInterval(checkHash, 1000)

// 监听 hashchange 事件
window.addEventListener('hashchange', () => {
  checkHash()
})

// 初始检查
setTimeout(checkHash, 1000)
