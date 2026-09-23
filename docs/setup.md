# Setup

Status: pre-scaffold. Nothing below has been run yet — this is the plan.

## Prerequisites
- Node.js (LTS)
- npm

## Scaffolding plan
1. Scaffold with `electron-vite` using its TypeScript template (bundles
   Electron + Vite + TS with hot reload for the renderer already wired up).
2. Add ESLint (`typescript-eslint`) + Prettier.
3. Add Vitest for unit tests and Playwright for end-to-end/Electron tests.
4. Add `electron-builder` for packaging Linux/Windows/macOS installers.
5. Replace the "Proposed" command markers in [AGENTS.md](../AGENTS.md) with
   the real, verified commands once this is done.

## Environment variables
None yet. If a cloud OCR service is chosen (see
[architecture.md](architecture.md) open questions), its API key will be
documented here and must never be committed.
