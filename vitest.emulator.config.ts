import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/emulator/**/*.test.ts'],
    env: { VITE_USE_EMULATORS: 'true' },
    fileParallelism: false,
    testTimeout: 15000,
  },
});
