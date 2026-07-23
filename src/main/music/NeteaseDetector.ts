// src/main/music/NeteaseDetector.ts
// 注入脚本检测网易云歌曲变化

import { WebContents } from 'electron'
import { logger } from '../utils/logger'

export class NeteaseDetector {
  private currentSongId: string | null = null
  private songChangeListeners: Set<(songId: string) => void> = new Set()
  private pauseListeners: Set<() => void> = new Set()

  /**
   * 注入脚本到网易云网页
   */
  async start(webContents: WebContents): Promise<void> {
    // 等页面加载完成
    webContents.on('did-finish-load', () => {
      this.injectScript(webContents)
    })

    // 页面刷新后重新注入
    webContents.on('did-navigate', () => {
      setTimeout(() => this.injectScript(webContents), 1000)
    })
  }

  private async injectScript(webContents: WebContents): Promise<void> {
    try {
      await webContents.executeJavaScript(`
        // 避免重复注入
        if (window.__nilian_music_injected) return;
        window.__nilian_music_injected = true;

        let lastSongId = null;

        // 从URL提取歌曲ID
        function getSongId() {
          const hash = window.location.hash;
          const match = hash.match(/\\/song\\?id=(\\d+)/);
          return match ? match[1] : null;
        }

        // 检测歌曲变化
        function detectSong() {
          const songId = getSongId();
          if (songId && songId !== lastSongId) {
            lastSongId = songId;
            if (window.__nilian_onSongChange) {
              window.__nilian_onSongChange(songId);
            }
          }
        }

        // 监听 hash 变化
        window.addEventListener('hashchange', detectSong);

        // 监听 audio 元素
        const audioObserver = new MutationObserver(() => {
          const audio = document.querySelector('audio');
          if (audio && !audio.__nilian_listening) {
            audio.__nilian_listening = true;
            audio.addEventListener('play', detectSong);
            audio.addEventListener('pause', () => {
              if (window.__nilian_onPause) {
                window.__nilian_onPause();
              }
            });
            audio.addEventListener('playing', detectSong);
          }
        });
        audioObserver.observe(document.body, { 
          childList: true, 
          subtree: true 
        });

        // 初始检测
        detectSong();
      `)
      logger.info('注入脚本成功')
    } catch (err) {
      logger.warn('注入脚本失败:', err)
    }
  }

  onSongChange(callback: (songId: string) => void): void {
    this.songChangeListeners.add(callback)
  }

  onPause(callback: () => void): void {
    this.pauseListeners.add(callback)
  }

  notifySongChange(songId: string): void {
    if (songId !== this.currentSongId) {
      this.currentSongId = songId
      this.songChangeListeners.forEach((cb) => cb(songId))
    }
  }

  notifyPause(): void {
    this.pauseListeners.forEach((cb) => cb())
  }

  getCurrentSongId(): string | null {
    return this.currentSongId
  }
}
