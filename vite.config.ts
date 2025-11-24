import fs from 'fs'
import gracefulFs from 'graceful-fs'
gracefulFs.gracefulify(fs)

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: process.env.NODE_ENV === 'production' ? '/xSLAM/' : '/',
  resolve: {
    alias: {
      'postprocessing': path.resolve(__dirname, 'node_modules/postprocessing'),
    }
  },
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
  }
})
