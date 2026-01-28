import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Base path configuration
  // For Vercel: use '/' (serves from root)
  // For GitHub Pages: use '/YOUR_REPO_NAME/' (update with your repo name)
  // This auto-detects Vercel environment
  base: process.env.VERCEL ? '/' : (process.env.NODE_ENV === 'production' ? '/KWC-Beat-App/' : '/'),
  server: {
    port: 3000,
    open: true,
    hmr: {
      overlay: true
    },
    watch: {
      usePolling: false
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Optimize for production
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'maps-vendor': ['@react-google-maps/api'],
        },
      },
    },
  },
})
