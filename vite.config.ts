import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  base: './',
  envPrefix: 'GEMINI_',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        canvas: resolve(__dirname, 'canvas.html'),
      },
      output: {
        // Single bundle, no code splitting (extension simplicity)
        manualChunks: undefined,
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
      },
    },
    target: 'chrome110',
    // No source maps in production extension build
    sourcemap: false,
  },
});
