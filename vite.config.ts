import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Base path for GitHub Pages - update with your repository name
  // For example, if repo is 'github.com/username/kwc-beat-app', use '/kwc-beat-app/'
  // Leave as '/' for root domain or custom domain
  base: process.env.NODE_ENV === 'production' ? '/KWC-Beat-App/' : '/',
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
