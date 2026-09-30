import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Despues de cada test, limpia lo que se dibujo en pantalla
// para que un test no afecte al siguiente.
afterEach(() => {
  cleanup()
})