import { defineConfig } from 'vite'

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    // Merged the rollupOptions from the second build key
    rollupOptions: {
      input: {
        main: '/index.htm'
      }
    }
  },
  server: {
    open: 'index.htm'
  },
  // Specify the custom entry point
  appType: 'spa'
})