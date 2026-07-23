// src/main/music/MusicContextInjector.ts
// 将歌曲信息注入Prompt

import type { FullSongInfo } from './MusicState'

export class MusicContextInjector {
  buildContext(songInfo: FullSongInfo | null): string {
    if (!songInfo) return ''

    const lyricPreview = songInfo.lyrics
      .slice(0, 10)
      .map((l) => l.text)
      .join('\n')

    const commentPreview = songInfo.hotComments
      .slice(0, 3)
      .map((c) => `"${c.content}" (${c.likedCount}赞)`)
      .join('\n')

    return `## 用户当前听歌状态
- 歌曲：${songInfo.detail.artist}《${songInfo.detail.name}》
- 专辑：《${songInfo.detail.album}》，${songInfo.detail.releaseDate}年
${lyricPreview ? `- 歌词片段：\n${lyricPreview}` : ''}
${commentPreview ? `- 热门评论：\n${commentPreview}` : ''}

注意：不要主动提及用户在听歌，除非用户问到。如果用户问关于这首歌的问题，用以上信息自然地回答。可以引用歌词，但不要把全部歌词输出。如果歌词表达了某种情绪，可以自然地关心用户，但不要刻意。`
  }
}
