import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@tourism-map/shared-types': path.resolve(__dirname, '../../packages/shared-types/src/index.ts'),
      '@tourism-map/map-engine': path.resolve(__dirname, '../../packages/map-engine/src/index.ts'),
    },
  },
  envDir: path.resolve(__dirname, '../../'),
  server: {
    port: 5173,
    host: true,
  },
});
