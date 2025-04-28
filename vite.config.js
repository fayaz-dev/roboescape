import { defineConfig } from 'vite'

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
  },
  server: {
    open: true
  },
  // Specify the custom entry point
  appType: 'spa',
  // Use index.htm instead of index.html
  build: {
    rollupOptions: {
      input: {
        main: '/index.htm'
      }
    }
  }
})