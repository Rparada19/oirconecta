import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    host: true,
    strictPort: false,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  optimizeDeps: {
    force: true, // Forzar reoptimización de dependencias
    include: ['@mui/material/styles', '@mui/material', 'react', 'react-dom'],
  },
  resolve: {
    dedupe: ['@mui/material', '@emotion/react', '@emotion/styled'],
  },
})
