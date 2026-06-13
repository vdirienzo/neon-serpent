import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      globals: true,
      environment: 'node',
      include: ['tests/**/*.{test,spec}.{js,ts}', 'src/**/*.{test,spec}.{js,ts}'],
      exclude: ['node_modules', 'dist', 'build', '**/*.bak'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html', 'json', 'lcov'],
        reportsDirectory: './coverage',
        include: ['src/**/*.{ts,js}'],
        exclude: [
          'src/**/*.d.ts',
          'src/**/*.test.{ts,js}',
          'src/**/*.spec.{ts,js}',
          'src/types/**',
          'src/main.ts',
        ],
        thresholds: {
          global: {
            branches: 70,
            functions: 70,
            lines: 70,
            statements: 70,
          },
        },
      },
    },
  })
);
