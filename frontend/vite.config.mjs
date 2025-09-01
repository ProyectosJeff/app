// frontend/vite.config.mjs
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    // evita crashes si alguna lib intenta leer process.env en el navegador
    'process.env': {}
  },
  build: { target: 'es2018' }
})
