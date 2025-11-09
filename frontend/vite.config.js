import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

const shouldUseManualChunk = (id, keyword) => id.includes(`node_modules/${keyword}`)

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'automatic'
    })
  ],
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return
          }

          if (
            shouldUseManualChunk(id, '@stripe') ||
            shouldUseManualChunk(id, '@heroicons') ||
            shouldUseManualChunk(id, '@supabase') ||
            shouldUseManualChunk(id, 'react') ||
            shouldUseManualChunk(id, 'react-dom')
          ) {
            return 'vendor-react'
          }

          if (shouldUseManualChunk(id, 'chart.js') || shouldUseManualChunk(id, 'react-chartjs-2')) {
            return 'vendor-chartjs'
          }

          if (shouldUseManualChunk(id, 'axios') || shouldUseManualChunk(id, 'lucide-react')) {
            return 'vendor-utils'
          }

          return 'vendor-others'
        }
      }
    }
  }
})
