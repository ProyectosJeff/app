import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': {} // por si alguna lib lo mira
  },
  build: {
    sourcemap: true,
    target: 'es2018'
  }
});
