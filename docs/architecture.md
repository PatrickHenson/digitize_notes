# Architecture

Status: planned, not yet implemented. This describes the intended shape of
the system so future decisions have something to react to — update it as the
real structure diverges.

## Processes (Electron)
- **Main** (`src/main`) — owns the app lifecycle, filesystem access, the
  webcam/camera device, the processing queue, and the background worker
  that runs the digitize pipeline. Only place with unrestricted Node access.
- **Preload** (`src/preload`) — the only bridge between renderer and main.
  Exposes a narrow, explicit API via `contextBridge` (e.g. capture/import,
  open/create notebook, list notes, read/write a note's markdown, queue
  status) plus events for background-processing progress; no direct
  `ipcRenderer` access from the UI.
- **Renderer** (`src/renderer`) — two views (see below), talking to main
  only through the preload API.

## UI (planned)
Capture/import is deliberately decoupled from reviewing/editing, so a user
can keep feeding in pages while earlier ones are still processing:
- **Capture/Import view** — live webcam preview + capture trigger, or a
  file picker/drag-and-drop for import (jpg/png/pdf). Every capture/import
  is handed off to the queue immediately; this view never waits on
  processing.
- **Review/Edit view** — side panel with the open notebook's full note
  list, a preview pane for the selected note's source image, and an
  editable markdown pane for that note. A note appears in the list the
  moment it's queued (its id/filename already exists), shown grayed out
  until the background worker finishes it, then fills in live. Edits
  autosave (debounced). Right-clicking a thumbnail opens a context menu of
  state-appropriate actions (remove from queue, retry, delete); a failed
  thumbnail also shows a passive warning badge.

## Pipeline (planned)
1. **Ingest** — a captured or imported image is written into the notebook's
   `pending_processing/` folder (queued), not processed synchronously.
2. **Background processing** — a worker in the main process pulls the next
   queued image and runs it through a local VLM (**Qwen2.5-VL, 7B**),
   embedded via `node-llama-cpp` (CUDA/Metal/CPU backend depending on
   platform — see [model-pipeline.md](model-pipeline.md)), prompted with
   the transcription rules in [note-format.md](note-format.md) to produce
   markdown including YAML frontmatter and automatic multi-page
   continuation linking.
3. **Commit** — the worker writes the note's `.md` file and moves the
   source image into the notebook's images folder, both under the shared
   `[notebook name]_[incrementing id]` name. This flips the note's already-
   visible (grayed out) list entry to its finished state.
4. **Edit** — user corrects the markdown in the editable pane; each note
   stays a plain `.md` file inside its notebook directory. Edits are the
   source of truth and are never overwritten by reprocessing.

## TODO tracking (planned)
A view, reachable independent of which notebook is open, scans every
notebook's committed notes live for incomplete (`- [ ]`) items and lists
them — not a separately stored file, so it can't drift from the notes.

## Open questions
See [requirements.md](requirements.md)'s "Open Questions" section for the
current list (processing model, continuation-correction feedback loop,
notebook tagging, etc.).
