import { defineConfig } from 'vite'

export default defineConfig({
  base: '/GuideForWebComponent/',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: 'index.html',
    },
  },
  server: {
    host: true,
  },
})
