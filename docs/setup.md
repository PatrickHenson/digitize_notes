# Setup

## Prerequisites
- Node.js (LTS) — use nvm if managing multiple versions.
- npm

## Getting started
```
npm install
npm run dev
```

## What's here
- Scaffolded with `@quick-start/electron` (electron-vite's React + TS
  template) — Electron + Vite + TypeScript with renderer hot reload.
- ESLint (`@electron-toolkit/eslint-config-ts`) + Prettier.
- `electron-builder` for packaging Linux/Windows/macOS installers
  (`npm run build:linux` / `build:win` / `build:mac`).
- Vitest for unit tests (`npm run test`). Configured with
  `passWithNoTests: true` since there's no real app logic yet to test —
  flip that off once the first real test lands, so an empty suite starts
  failing CI again.
- No end-to-end test setup (Playwright) yet — deferred until there's a
  real UI flow worth testing end-to-end, rather than scaffolding tests
  against the placeholder screen.
- `eval/` is a separate, standalone tool (not part of the shipped app) and
  is excluded from this project's ESLint config — see
  [eval/README.md](../eval/README.md).

## Environment variables
None yet. If a cloud service is ever introduced, its API key will be
documented here and must never be committed (see
[licensing.md](licensing.md) / [security.md](security.md)).
