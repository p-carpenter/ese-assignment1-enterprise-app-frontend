import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true, // This allows you to use 'describe', 'it', 'expect' without importing them
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
  },
})
