import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/scenario': { target: 'http://localhost:5000', changeOrigin: true },
      '/submit-action': { target: 'http://localhost:5000', changeOrigin: true },
    },
  },
})
