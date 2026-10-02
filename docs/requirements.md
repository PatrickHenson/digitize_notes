# Requirements

High-level functional requirements. This is a living document — update it as
decisions are made; move an "Open Questions" item into the numbered list
once it's resolved.

## Goals
The point of this project, stated directly (2026-10-01) — use these to
break ties when a design choice isn't otherwise obvious:
1. **Searchable** — digitized notes should be easy to search.
2. **Track missed TODOs** — incomplete items should surface for review,
   not get buried on a page no one reopens.
3. **Agent-usable** — an agent should be able to find information in notes
   and take action on it, not just a human reading the markdown.

## Functional requirements
1. **Notebooks** — a user creates a new notebook by choosing/configuring a
   directory for it, or opens an existing notebook directory to continue
   adding notes to it.
2. **Capture / import** — note pages can be captured via webcam (with a
   live preview shown before capture) or imported as a single image or a
   series of images. Accepted formats: jpg, png, pdf.
3. **Image → markdown processing** — the handwriting-to-markdown
   transcription rules are defined in
   [docs/note-format.md](note-format.md). Processed by a local/offline
   vision-language model (VLM), prompted with those rules, rather than a
   traditional OCR/HTR engine — see
   [docs/model-pipeline.md](model-pipeline.md). Exact model is still TBD
   (see Open Questions); the inference runtime is decided.
4. **Capture/Import UX is separate from Review/Edit UX** — two distinct
   views:
   - **Capture/Import view:** live camera preview + capture trigger, or a
     file picker/drag-and-drop for import. The user can keep capturing or
     importing continuously — this view is never blocked waiting on
     processing.
   - **Review/Edit view:** a side panel listing the notebook's full note
     list (not just the current session), a preview pane showing the
     selected note's source image, and an editable markdown pane for that
     note.
5. **Processing queue.** Capturing or importing an image queues it for
   processing rather than processing it synchronously (e.g. into a
   `pending_processing/` folder within the notebook). A background worker
   pulls from the queue, runs the digitize pipeline, writes the note's
   markdown file, and moves the image into the notebook's images folder —
   independent of what the user is doing in the UI.
6. **Storage — one file per note.** Each digitized note is its own markdown
   file.
7. **Storage — one directory per notebook.** Each notebook/collection is a
   directory containing:
   - a title page
   - the note markdown files
   - a subfolder of the reference images
   - a `pending_processing/` subfolder for queued/in-flight captures
8. **Naming convention.** A note and its source image share a name:
   `[notebook name]_[incrementing id].[filetype]`. The id is assigned at
   capture/import time, not when processing completes — this keeps capture
   order stable regardless of processing order. An imported file (which
   arrives with its own original filename) is renamed to match this pattern
   as soon as it's queued, same as a webcam capture.
9. **Title page contents:** YAML frontmatter (`title`, `date`/date range,
   `tags`) followed by a free-text description. See
   [docs/note-format.md](note-format.md).
10. **Id format:** zero-padded to 4 digits (e.g. `_0001`). The counter only
    ever increases — a deleted note's id is never reused, so gaps in the
    sequence are expected and fine.
11. **Source of truth after edits:** user edits to a note's markdown are
    the source of truth. Once a note has been edited, it is never
    overwritten by reprocessing the source image.
12. **Editing/save behavior:** autosave, debounced after the user stops
    typing (and on switching notes/closing), with a small "saved"
    indicator. No explicit save action required.
13. **Processing visibility:** a queued/processing note appears in the
    Review/Edit note list immediately (its id/filename is already
    assigned), shown grayed out until the background worker finishes it,
    then it fills in live.
14. **Cancel/remove from queue:** a note still in "queued" state (worker
    hasn't started on it yet) can be removed by the user, via the thumbnail
    context menu (see item 17). Once the worker has started processing an
    item, it runs to completion — no mid-flight cancellation.
15. **Concurrency:** one global background worker processes one image at a
    time across all notebooks (not parallel per-notebook), to keep local
    model resource usage predictable — matters especially for large batch
    imports.
16. **Notebook name → filesystem safety:** the name input itself restricts
    characters invalid on Windows/macOS/Linux (`\ / : * ? " < > |` and
    control characters) and trims trailing dots/spaces, rather than
    silently sanitizing after the fact.
17. **Thumbnail interaction:** right-click a thumbnail in the side panel
    for a context menu of state-appropriate actions — "Remove from queue"
    (queued), "Retry" / "Delete" (failed), "Delete" (completed). A failed
    thumbnail also shows a passive warning badge so the failure is
    noticeable without having to right-click every grayed-out item.
18. **Failure handling:** background processing failure gets one automatic
    retry; if that also fails, the note's slot shows the failed badge
    (item 17) and the context menu offers "Retry" (manually re-queue it)
    or "Delete" (discard it).
19. **TODO tracking.** An in-app view aggregates every incomplete (`- [ ]`)
    TODO live, scanned across *all* notebooks — not a separately
    maintained file, so it can't drift from the note files that are the
    real source of truth. Filterable by notebook tag (item 24, e.g.
    work/personal).
20. **Multi-entry pages stay one file.** A page with multiple handwritten
    entries (separated by a new large title or a horizontal line) still
    produces exactly one note file per source image — each entry becomes a
    `##` section or `---`-divided block within that file, rather than
    splitting into separate note files. See
    [docs/note-format.md](note-format.md).
21. **Multi-page notes are linked automatically.** A new page with no
    header, or a header matching the previous entry's title (optionally
    with a "continued" marker), is assumed to continue that entry; frontmatter
    `continues_from`/`continues_to` records the link. No manual override
    yet — a correction feedback loop is a future discussion. See
    [docs/note-format.md](note-format.md).
22. **Frontmatter metadata.** Each note file gets a YAML frontmatter block:
    `notebook`, `id`, `date` (from the handwritten header, if present),
    `captured_at`, `continues_from`/`continues_to`, and `tags` (starts
    empty). See [docs/note-format.md](note-format.md).
23. **Inference runtime.** The VLM runs embedded in the Electron main
    process via Node bindings to llama.cpp (`node-llama-cpp`) — CUDA
    backend on NVIDIA hardware, Metal on macOS, CPU fallback elsewhere.
    One engine for all platforms; no separate server process for the user
    to install or run. See [docs/model-pipeline.md](model-pipeline.md).
24. **Notebook tags.** When creating a new notebook, a second text input
    (alongside the title/directory field) takes comma-separated tags
    (e.g. `work, personal`), stored in the title page's frontmatter. The
    global TODO view (item 19) can filter by these tags. See
    [docs/note-format.md](note-format.md).

## Open Questions
Still need answers — flagging these so we can work through them:

- **Exact VLM to use:** shortlist is Qwen2.5-VL and MiniCPM-V (both
  Apache-2.0, both have document/OCR strengths) — needs empirical
  validation against real handwriting samples and current llama.cpp
  multimodal support before pinning one. See
  [docs/model-pipeline.md](model-pipeline.md).
- **Multi-page continuation feedback loop:** how does a user fix it when
  the automatic continuation guess (item 21) is wrong — relink two notes,
  or split a wrongly-merged one? Deferred.
