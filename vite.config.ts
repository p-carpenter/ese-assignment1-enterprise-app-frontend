import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    pool: 'forks',
    setupFiles: './vitest.setup.ts',
    coverage: {
      reporter: ['text', 'json-summary', 'json'],
      reportOnFailure: true,
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
