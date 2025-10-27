import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [
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
