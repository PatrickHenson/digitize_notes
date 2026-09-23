# Security

## Secrets
- Never commit API keys or credentials (e.g. for any cloud OCR service).
- Document required env vars in [setup.md](setup.md) by name only, never
  with real values.

## Input handling
- Validate/sanitize any file paths coming from user-selected files before
  passing them to the main process.

## Electron process isolation
- Keep `contextIsolation: true` and `nodeIntegration: false` in all
  BrowserWindow configs.
- Never enable `nodeIntegration` in renderer windows; use the preload
  script's `contextBridge` for any privileged API the UI needs.
- No direct `ipcRenderer` access from the renderer — go through the
  preload-exposed API only.
