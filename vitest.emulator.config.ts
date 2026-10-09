import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/emulator/**/*.test.ts'],
    env: { VITE_USE_EMULATORS: 'true', VITE_FIREBASE_PROJECT_ID: 'demo-shopping-list' },
    fileParallelism: false,
    testTimeout: 15000,
  },
});
