import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.spec.ts'],
    clearMocks: true,
    restoreMocks: true,
    mockReset: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      include: ['src/controllers/**/*.ts', 'src/middleware/**/*.ts'],
      exclude: ['src/**/*.spec.ts'],
      thresholds: {
        lines: 82,
        functions: 82,
        statements: 82,
        branches: 70,
      },
    },
  },
});
