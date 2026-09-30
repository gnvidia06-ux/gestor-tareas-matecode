import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    // Simula un navegador para poder renderizar componentes.
    environment: 'jsdom',
    // Archivo que se ejecuta antes de los tests (activa los chequeos de jest-dom).
    setupFiles: './src/setupTests.ts',
  },
})