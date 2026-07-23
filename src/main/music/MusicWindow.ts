// src/main/music/MusicWindow.ts
// 网易云WebView管理 — WebContentsView嵌入网易云网页版

import { BrowserWindow, WebContentsView } from 'electron'
import { join } from 'path'
import { logger } from '../utils/logger'

export class MusicWindow {
  private view: WebContentsView | null = null
  private parentWindow: BrowserWindow | null = null
  private onSongChangeCallback: ((songId: string) => void) | null = null
  private isVisible = false
  private isCreated = false
  private lastSongId: string | null = null
  private pollTimer: ReturnType<typeof setInterval> | null = null

  onSongChange(callback: (songId: string) => void): void {
    this.onSongChangeCallback = callback
  }

  hasSongChangeCallback(): boolean {
    return this.onSongChangeCallback !== null
  }

  create(parentWindow: BrowserWindow): WebContentsView {
    if (this.isCreated && this.view) {
      return this.view
    }

    this.parentWindow = parentWindow
    this.isCreated = true

    this.view = new WebContentsView({
      webPreferences: {
        partition: 'persist:music',
        contextIsolation: true,
        nodeIntegration: false,
        webSecurity: false
      }
    })

    this.view.webContents.loadURL('https://music.163.com/')

    // 页面加载完成后启动轮询
    this.view.webContents.on('did-finish-load', () => {
      logger.info('网易云页面加载完成')
      this.updateBounds()
      this.startPolling()
    })

    this.parentWindow.on('resize', () => {
      if (this.isVisible) {
        this.updateBounds()
      }
    })

    logger.info('网易云WebView已创建')
    return this.view
  }

  /**
   * 定期从页面读取当前播放的歌曲ID
   */
  private startPolling(): void {
    if (this.pollTimer) return

    this.pollTimer = setInterval(async () => {
      if (!this.view) return

      try {
        const songId = await this.view.webContents.executeJavaScript(`
          (function() {
            try {
              // 方法1: 从播放器底部栏的歌曲链接获取
              var playerLinks = document.querySelectorAll('.m-player a[href*="song?id="], .player-bar a[href*="song?id="], .m-player-footer a[href*="song?id="]');
              for (var i = 0; i < playerLinks.length; i++) {
                var href = playerLinks[i].getAttribute('href') || '';
                var m = href.match(/song\\?id=(\\d+)/);
                if (m) return m[1];
              }
              
              // 方法2: 从页面中所有song链接中获取第一个（播放列表中的歌曲）
              var allSongLinks = document.querySelectorAll('a[href*="/song?id="]');
              for (var i = 0; i < allSongLinks.length; i++) {
                var href = allSongLinks[i].getAttribute('href') || '';
                var m = href.match(/song\\?id=(\\d+)/);
                if (m) return m[1];
              }
              
              // 方法3: 从当前URL获取
              var urlMatch = window.location.hash.match(/song\\?id=(\\d+)/);
              if (urlMatch) return urlMatch[1];
              
              return null;
            } catch(e) {
              return null;
            }
          })()
        `)

        if (songId && songId !== this.lastSongId) {
          this.lastSongId = songId
          logger.info(`检测到歌曲: ${songId}`)
          this.onSongChangeCallback?.(songId)
        }
      } catch {
        // WebView可能已销毁
      }
    }, 2000)
  }

  show(): void {
    if (!this.view || !this.parentWindow) return

    if (!this.isVisible) {
      this.updateBounds()
      this.parentWindow.contentView.addChildView(this.view)
      this.isVisible = true
    }
  }

  hide(): void {
    if (!this.view || !this.parentWindow) return

    if (this.isVisible) {
      this.parentWindow.contentView.removeChildView(this.view)
      this.isVisible = false
    }
  }

  updateBounds(): void {
    if (!this.view || !this.parentWindow) return

    const { width, height } = this.parentWindow.getContentBounds()
    const sideNavWidth = 54
    const headerHeight = 52

    this.view.setBounds({
      x: sideNavWidth,
      y: headerHeight,
      width: width - sideNavWidth,
      height: height - headerHeight
    })
  }

  getWebContents(): Electron.WebContents | null {
    return this.view?.webContents || null
  }

  destroy(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer)
      this.pollTimer = null
    }
    this.hide()
    this.view = null
    this.parentWindow = null
  }
}
