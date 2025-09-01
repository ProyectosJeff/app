// frontend/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': {} // evita problemas si alguna lib intenta leer process.env en el navegador
  },
  build: { target: 'es2018' }
})
