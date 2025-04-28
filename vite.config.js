import { defineConfig } from 'vite'

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    // Merged the rollupOptions from the second build key
    rollupOptions: {
      input: {
        main: '/home.html'
      }
    }
  },
  server: {
    open: 'home.html'
  },
  // Specify the custom entry point
  appType: 'spa'
})