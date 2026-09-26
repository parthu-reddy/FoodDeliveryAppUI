import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@shared': path.resolve(__dirname, 'src/shared'),
      '@features': path.resolve(__dirname, 'src/features'),
      '@apps': path.resolve(__dirname, 'src/apps'),
    },
  },
  test: {
    // Every UI test runs in a hostile zone: -02:30/-03:30 with DST, west of Greenwich (so a UTC-midnight
    // date shows as the previous day) and nobody's laptop zone. Code that silently reads the ambient
    // zone fails here instead of in some viewer's browser. src/shared/time/time.test.ts checks it applied.
    // RandomDocuments/TimezoneCorrectness_2026-09-25.
    env: { TZ: 'America/St_Johns' },
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    globals: true
  }
})
