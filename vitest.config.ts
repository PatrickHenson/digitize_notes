import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // No tests exist yet beyond the scaffold — this stays true until real
    // app logic lands, otherwise `npm run test` is a false negative in CI.
    passWithNoTests: true
  }
})
