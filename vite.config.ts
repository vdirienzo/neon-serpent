import { defineConfig } from 'vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { securityHeadersPlugin } from './vite-plugins/security-headers';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig(({ mode }: { mode: string }) => ({
  root: '.',
  publicDir: 'public',
  base: mode === 'production' ? (process.env.VITE_BASE || './') : './',

  plugins: [securityHeadersPlugin()],

  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@core': resolve(__dirname, 'src/core'),
      '@engine': resolve(__dirname, 'src/engine'),
      '@game': resolve(__dirname, 'src/game'),
      '@ui': resolve(__dirname, 'src/ui'),
      '@config': resolve(__dirname, 'src/config'),
      '@app': resolve(__dirname, 'src/app'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@types': resolve(__dirname, 'src/types'),
      '@tests': resolve(__dirname, 'tests'),
    },
  },

  server: {
    port: 8765,
    strictPort: false,
    open: false,
    cors: true,
    host: true,
  },

  preview: {
    port: 8765,
    strictPort: false,
  },

  build: {
    target: 'es2022',
    sourcemap: true,
    outDir: 'dist',
    assetsDir: 'assets',
    cssCodeSplit: true,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 1024,
    rollupOptions: {
      external: (id: string) => id === 'three' || id.startsWith('three/')
    }
  },

  optimizeDeps: {
    exclude: ['three']
  },

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
}));

