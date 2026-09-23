# Architecture

Status: planned, not yet implemented. This describes the intended shape of
the system so future decisions have something to react to — update it as the
real structure diverges.

## Processes (Electron)
- **Main** (`src/main`) — owns the app lifecycle, filesystem access, and any
  scanner/camera device integration. Only place with unrestricted Node access.
- **Preload** (`src/preload`) — the only bridge between renderer and main.
  Exposes a narrow, explicit API via `contextBridge`; no direct `ipcRenderer`
  access from the UI.
- **Renderer** (`src/renderer`) — the UI: import/scan a note, preview it,
  trigger digitization, edit/save the resulting markdown.

## Pipeline (planned)
1. **Ingest** — user imports an image (file picker or connected scanner).
2. **Preview** — show the source image alongside a working area.
3. **Digitize** — run handwriting recognition (OCR/handwriting model, TBD —
   local vs. cloud is an open decision) to produce draft text.
4. **Edit & export** — user corrects the draft, then saves it as a `.md` file.

## Open questions
- Local OCR/handwriting model vs. a cloud API (cost, privacy, offline use).
- Where digitized notes and their source images are stored by default.
- Whether scanner/camera input is v1 scope or file-import-only first.
