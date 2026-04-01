import { defineConfig } from 'vite'

export default defineConfig({
  base: '/GuideForWebComponent/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: 'index.html',
      output: {
        // Use stable filenames on GitHub Pages to avoid stale HTML or CDN/browser
        // cache requesting a hash that no longer exists after deployment.
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
  server: {
    host: true,
  },
})
