import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: process.env.NODE_ENV === 'production' ? '/web-slam/' : '/',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          fiber: ['@react-three/fiber'],
          drei: ['@react-three/drei'],
        }
      }
    }
  },
  optimizeDeps: {
    exclude: ['@react-three/fiber', '@react-three/drei']
  }
})
