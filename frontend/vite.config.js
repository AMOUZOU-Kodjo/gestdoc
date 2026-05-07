import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Diviser le bundle en chunks pour charger seulement ce qui est nécessaire
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor':  ['react', 'react-dom', 'react-router-dom'],
          'query-vendor':  ['@tanstack/react-query'],
          'ui-vendor':     ['lucide-react'],
          'axios-vendor':  ['axios'],
        },
      },
    },
    // Compresser davantage
    minify: 'esbuild',
    chunkSizeWarningLimit: 600,
  },
  // Précharger les modules critiques
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@tanstack/react-query', 'axios'],
  },
})