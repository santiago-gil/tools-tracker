import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
      codeSplittingOptions: {
        // Default: keep loaders with components for most routes
        defaultBehavior: [
          ['loader', 'component'], // Keep loader and component together
        ],
      },
    }),
    react(),
    svgr({
      svgrOptions: {
        icon: true,
      },
    }),
    // Plugin to resolve .js imports in shared schemas to .ts files
    {
      name: 'resolve-shared-schemas',
      enforce: 'pre',
      resolveId(id, importer) {
        // If this is a shared schema import ending in .js from a .ts file in shared/schemas
        if (importer && id.endsWith('.js') && id.includes('shared/schemas')) {
          const tsPath = id.replace(/\.js$/, '.ts');
          const fullPath = path.resolve(__dirname, '..', tsPath);
          if (fs.existsSync(fullPath)) {
            return fullPath;
          }
        }
        return null;
      },
    },
  ],
  resolve: {
    alias: {
      '@shared/schemas': path.resolve(__dirname, '../shared/schemas'),
    },
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs'],
    conditions: ['import', 'module', 'browser', 'default'],
    dedupe: ['zod'],
  },
  server: {
    port: 3000,
    // Note: Vite automatically handles SPA routing - no historyApiFallback option needed
    watch: {
      ignored: ['**/.tanstack/tmp/**', '**/node_modules/**', '**/dist/**'],
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5001/tool-tracker-c8180/us-central1/api',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: process.env.NODE_ENV === 'development',
  },
});
