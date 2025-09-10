import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    testTimeout: 900000, // 15 minutes for long-running tests
    disableConsoleIntercept: true,
    // Disable parallel execution to prevent file system conflicts
    maxConcurrency: 1,
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      extension: ['.ts'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/index.ts', 'src/**/*.test.ts'],
      all: true,
      clean: true,
      reportOnFailure: true,
    },
  },
  resolve: {
    extensions: ['.ts', '.js', '.json'],
  },
});
