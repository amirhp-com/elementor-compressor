
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Ensures relative paths for cPanel and GitHub Pages
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});
