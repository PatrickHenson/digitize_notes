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

## Known Linux dev-environment gotchas
Hit on an NVIDIA/Wayland machine (nvm-installed Node, npm 11) — likely to
recur on similar setups:

- **Electron's binary doesn't download on `npm install`.** npm 11's
  install-scripts allowlist blocks `electron`'s postinstall (the script
  that downloads the actual Electron binary) by default. Symptom:
  `electron-vite dev`/`build` fails with `Error: Electron uninstall`.
  Fix: `node node_modules/electron/install.js` once, or `npm
  install-scripts approve electron` — `package.json`'s `allowScripts`
  already allowlists the installed version, so a fresh `npm install`
  should no longer need this, but if the electron version changes without
  updating that list, it can resurface.
- **GPU process segfaults under native Wayland + NVIDIA's proprietary
  driver.** Symptom: the Electron window never appears;
  `electron.dist/electron exited with signal SIGSEGV` in the logs. Fix:
  force X11/XWayland instead of native Wayland —
  `electron --ozone-platform=x11` (or `ELECTRON_OZONE_PLATFORM_HINT=x11`
  as an env var) when launching directly against built output
  (`npm run build && node_modules/.bin/electron --ozone-platform=x11
  out/main/index.js`). **Not yet resolved for `npm run dev`** (the
  electron-vite hot-reload dev server) — that path exits quickly without
  an obvious crash, even with the same override set. Needs more
  investigation; building and launching the static output directly is the
  reliable fallback in the meantime.
