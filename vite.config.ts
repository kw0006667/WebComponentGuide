import { defineConfig } from 'vite'

const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1]
const githubPagesBase = repoName ? `/${repoName}/` : '/'

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? githubPagesBase : '/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // Keep backdrop-filter declarations intact for GitHub Pages production builds.
    // Vite's default Lightning CSS minifier currently collapses the topbar rule
    // down to only -webkit-backdrop-filter, which breaks the blur effect in
    // browsers expecting the standard property.
    cssMinify: false,
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
