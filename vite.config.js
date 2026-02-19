import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  root: './vue',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'vue/src'),
      '@plugins': resolve(__dirname, 'plugins')
    },
    dedupe: ['pinia', 'vue']
  },
  server: {
    middlewareMode: false,
    proxy: {
      '/api': {
        target: process.env.VITE_BACKEND_URL || 'http://host.docker.internal:5000',
        changeOrigin: true
      },
      '/socket.io': {
        target: process.env.VITE_BACKEND_URL || 'http://host.docker.internal:5000',
        ws: true
      }
    }
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true
  }
})
