import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

const root = resolve(__dirname)

export default defineConfig({
  plugins: [react()],
  root: resolve(root, 'src/renderer'),
  base: './',
  build: {
    outDir: resolve(root, 'dist'),
    emptyOutDir: true
  },
  resolve: {
    alias: {
      '@shared': resolve(root, 'src/shared'),
      '@': resolve(root, 'src/renderer')
    }
  },
  server: {
    port: 5173
  }
})
