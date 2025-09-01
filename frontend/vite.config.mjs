// frontend/vite.config.mjs
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  define: {
    // Algunos paquetes referencian process o global; con esto evitamos errores.
    "process.env": {},
    global: "window",
  },
  build: {
    target: "es2018",
    // si necesitas depurar en producción, habilita temporalmente source maps:
    // sourcemap: true,
  },
});
