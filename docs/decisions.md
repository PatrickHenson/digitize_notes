# Decisions

Lightweight decision log — one entry per non-obvious choice, so future-you
(or an agent) knows *why*, not just *what*.

## 2026-09-22 — Electron for the app shell
**Decision:** Build on Electron rather than a native-per-platform app.
**Why:** Need Linux, Windows, and macOS support from one codebase; Electron
is the most mature option for that with a JS/TS stack.

## 2026-09-22 — TypeScript over JavaScript
**Decision:** Use TypeScript throughout (main, preload, renderer).
**Why:** Type safety across Electron's process boundaries catches a common
class of IPC bugs early; standard choice for modern Electron apps.

## 2026-09-22 — npm as package manager
**Decision:** Use npm rather than yarn/pnpm.
**Why:** Ships with Node, no extra tooling to install, most widely
documented for Electron.

## 2026-09-22 — docs/ directory for detailed documentation
**Decision:** Keep AGENTS.md short; put architecture, setup, and decision
history in docs/ instead.
**Why:** AGENTS.md is read by agents on every task — keeping it scannable
matters more as the project grows.

## 2026-09-23 — Local/offline model for handwriting recognition
**Decision:** Process captured note images with a local/offline model
rather than a cloud OCR API.
**Why:** Keeps handwritten note content private and usable offline; avoids
per-use cost and API key management. Accepts a likely accuracy tradeoff
versus top cloud services — revisit if quality is insufficient.

## 2026-09-23 — Webcam capture as the primary input method
**Decision:** v1 input is webcam capture, plus importing a single image or
series of images. No direct scanner (TWAIN/SANE) integration for v1.
**Why:** Camera capture covers the common case without platform-specific
scanner driver work; image import covers anyone who already has a scanner
workflow.

## 2026-09-23 — Notebooks as folders, one file per note
**Decision:** Organize notes into notebooks from v1 (not a flat list). Each
notebook is a directory containing a title page, one markdown file per
note, and a subfolder of reference images; notes and images share a name
(`[notebook name]_[incrementing id].[filetype]`).
**Why:** Keeps each note independently addressable as a plain file (easy to
open, diff, back up, or move) while still grouping related notes; avoids a
database/index the user would need to keep in sync with the filesystem.

## 2026-09-23 — Capture/import UX decoupled from review/edit UX
**Decision:** Capturing/importing pages and reviewing/editing digitized
notes are two separate views, not one combined screen.
**Why:** Digitization runs in the background and shouldn't block the user
from continuing to feed in more pages; combining the views would force one
to wait on the other.

## 2026-09-23 — Queue + background worker for processing
**Decision:** Captured/imported images land in a per-notebook
`pending_processing/` folder; a background worker in the main process
processes them one at a time and commits the resulting note + image into
the notebook.
**Why:** Decouples capture speed from (likely slower) local model
inference, and gives a durable, inspectable on-disk queue instead of an
in-memory one that would be lost on a crash/restart.

## 2026-09-23 — Filename/id assigned at capture/import time
**Decision:** The `[notebook name]_[incrementing id]` name is assigned the
moment an image is captured or imported (i.e. when it's queued), not when
background processing finishes it. An imported file's original name is
immediately replaced with this pattern too, same as a webcam capture.
**Why:** Keeps note ordering equal to capture/import order even though
processing happens asynchronously and may finish out of order.

## 2026-09-23 — Id format: zero-padded 4 digits, never reused
**Decision:** `[notebook name]_[id]` uses a 4-digit zero-padded counter
(`_0001`, `_0002`, …) that only ever increases; a deleted note's id is not
reused.
**Why:** Fixed-width ids sort correctly as plain strings in a file browser;
never reusing ids avoids ever confusing a new note with a deleted one that
happened to share a number.

## 2026-09-23 — User edits are the source of truth
**Decision:** Once a user edits a note's markdown, that edited content is
final — the note is never overwritten by re-running the digitize pipeline
on its source image.
**Why:** Matches treating each note as a plain, user-owned file; automatic
reprocessing silently overwriting a manual correction would be surprising
and could destroy work.

## 2026-09-23 — Autosave, no explicit save action
**Decision:** The markdown editor autosaves (debounced after typing stops,
and on switching notes/closing); there's no separate save button.
**Why:** User edits are the source of truth — requiring a manual save adds
a way to lose work by forgetting it, with no real upside.

## 2026-09-23 — Queued notes appear immediately, grayed out
**Decision:** A note appears in the Review/Edit list the moment it's
queued (id already assigned), shown grayed out until the background worker
finishes it.
**Why:** Gives processing visibility and a natural place to surface a
failure, without a separate progress-counter UI.

## 2026-09-23 — Cancel only while still queued
**Decision:** A user can remove a note from the queue only before the
worker has started processing it; once started, it runs to completion.
**Why:** Nothing is committed yet for a queued item, so removal is trivial;
mid-flight cancellation would add real complexity for little benefit — a
finished note can just be deleted afterward.

## 2026-09-23 — Single global background worker
**Decision:** One background worker processes one image at a time across
all notebooks, rather than parallel workers per notebook.
**Why:** Local model inference is likely CPU/GPU-bound; serializing keeps
resource usage predictable, especially for large batch imports.

## 2026-09-23 — Restrict notebook-name input rather than sanitize after
**Decision:** The notebook name input disallows characters invalid on
Windows/macOS/Linux (`\ / : * ? " < > |`, control characters) and trims
trailing dots/spaces, instead of silently rewriting an invalid name.
**Why:** Predictable — the user sees exactly what will become the
directory name, with no surprise renames.

## 2026-09-23 — Right-click context menu for thumbnail actions
**Decision:** Thumbnail actions (retry, delete, remove from queue) are
reached via a right-click context menu, state-appropriate to the note
(queued/failed/completed), rather than dedicated per-thumbnail buttons. A
failed thumbnail also gets a passive warning badge.
**Why:** Actions vary by state and will likely grow over time; a context
menu scales without cluttering each thumbnail with icon buttons, and
matches the file-manager mental model the rest of the app already uses.
Confirms failure handling: one automatic retry, then manual retry/delete
via this menu.

## 2026-10-01 — Note format matches the user's own bujo shorthand
**Decision:** Transcription maps the user's existing bullet-journal
notation directly: dash → bullet, star → bold bullet (important), open
circle → `- [ ]`, circle-with-X → `- [x]`, page header (+ optional date)
→ `## header — YYYY-MM-DD` with the date normalized to ISO 8601. See
[note-format.md](note-format.md).
**Why:** The user already has a consistent personal notation; transcribing
it faithfully (rather than inventing a new scheme) keeps digitized notes
recognizable and keeps the mapping mechanical/unambiguous for the model.

## 2026-10-01 — Multi-entry pages stay one file per page
**Decision:** A page with multiple handwritten entries (new large title, or
a horizontal-line break) is still exactly one note file per source image;
each entry becomes a `##` section or `---` block inside that file.
**Why:** Preserves the existing one-image-one-note naming/storage rule
rather than introducing new id/naming logic for sub-page entries.

## 2026-10-01 — TODO tracking is a live, global, scanned view
**Decision:** Incomplete TODOs are tracked via a view that scans `- [ ]`
items across *all* notebooks live, not a separately maintained file.
**Why:** The note files are already the source of truth; a generated
todos.md would be a second copy that could drift. Scoped globally (not
per-notebook) since missed items should surface regardless of which
notebook they're in — future notebook tags (work/personal) may add
filtering on top of this view.

## 2026-10-01 — Note files get YAML frontmatter
**Decision:** Each note file carries a small frontmatter block (notebook,
id, date, captured_at, continues_from/continues_to, tags).
**Why:** Directly serves the project's search, TODO-tracking, and
agent-use goals — structured fields are reliably parseable without an
agent or search tool having to re-derive them from prose or filenames.

## 2026-10-01 — Multi-page continuation detected automatically
**Decision:** A new page with no header, or a header matching the previous
entry's title (optionally with a "continued" marker), is automatically
linked as a continuation via frontmatter `continues_from`/`continues_to`.
No manual correction UI yet.
**Why:** Matches how the user already titles continued entries on paper
("Title" / "Title continued..."), so the common case needs no extra user
action. A feedback loop for wrong guesses is deferred rather than
over-building before it's clear how often guesses actually miss.

## 2026-10-01 — VLM over OCR/HTR for image→markdown processing
**Decision:** Process page images with a local vision-language model
prompted with the transcription rules, not a traditional OCR/handwriting-
recognition engine.
**Why:** The note format's shorthand encodes meaning (circle = open TODO,
star = important, etc.), not just characters. An OCR/HTR model only
outputs flat text; a promptable VLM can apply the semantic mapping and
layout understanding in the same pass. Accepted tradeoff: heavier compute
and accuracy that needs empirical validation on real handwriting, versus a
smaller dedicated HTR model. See [model-pipeline.md](model-pipeline.md).

## 2026-10-01 — Embedded cross-platform inference (node-llama-cpp)
**Decision:** Run the VLM embedded in the Electron main process via
`node-llama-cpp` (CUDA/Metal/CPU backends), not a Python high-throughput
engine (vLLM/TensorRT-LLM) and not an externally-run server (e.g. Ollama).
**Why:** The app must support Linux/Windows/macOS; llama.cpp is the option
that runs everywhere with one codebase and no extra software for the user
to install. vLLM/TensorRT-LLM's batched-throughput advantage is built for
multi-tenant serving, not a single user's occasional batch-import of a few
dozen images — not worth losing cross-platform support for. See
[model-pipeline.md](model-pipeline.md).

## 2026-10-01 — Notebook tags via title-page frontmatter
**Decision:** Notebooks are tagged (e.g. work/personal) through a
comma-separated text input shown at notebook-creation time, stored in the
title page's YAML frontmatter (`tags`). The global TODO view can filter by
these tags.
**Why:** Resolves the earlier open question about differentiating
notebooks for TODO filtering, using the same frontmatter mechanism already
established for notes — no new storage concept needed.

## 2026-10-01 — VLM pinned: Qwen2.5-VL (7B)
**Decision:** Use Qwen2.5-VL (7B) as the production handwriting-recognition
model, not MiniCPM-V.
**Why:** Evaluated both against 5 real handwritten sample pages (via the
`eval/` harness). Qwen2.5-VL's raw transcription stayed close to the
source throughout; MiniCPM-V made real word-level errors and hallucinated
duplicate lines on two pages. Known limitations (inconsistent
symbol-to-markdown mapping, occasional fabricated dates) are accepted as
implementation-time work (few-shot prompting, treating the extracted
`date` field as cosmetic) rather than reasons to keep evaluating further.

## 2026-10-01 — Bracket/brace grouping → nested indentation, not code block
**Decision:** A handwritten bracket grouping several lines renders as a
nested indented list, not a fenced code block.
**Why:** A code block would turn any `- [ ]` checkbox or `**bold**` inside
it into inert literal text, breaking the live TODO-tracking goal for
anything inside the bracket.

## 2026-10-01 — Date extraction moved out of the model, into deterministic code
**Decision:** The VLM is never asked to produce a date. It transcribes the
header line verbatim; a date is then extracted via regex against that
verbatim text and normalized to ISO 8601, with a missing year filled from
the real capture timestamp rather than guessed.
**Why:** Verified bug — Qwen2.5-VL fabricated a plausible date on a page
with no date at all, even with an explicit "never invent a date"
instruction. Negative instructions don't reliably suppress a strong
training-data prior; the only reliable fix is to remove the model's
opportunity to invent one at all. Verified fixed against all 5 real
sample pages (the no-date page stayed clean; dated pages resolved to the
correct year from capture time, not a guessed one).

## 2026-09-22 — Prefer permissive licenses; avoid/isolate copyleft
**Decision:** New dependencies should be permissively licensed
(Apache-2.0/MIT/BSD-family compatible); GPL/AGPL and similarly restrictive
licenses are avoided, or used only via subprocess/service isolation if truly
necessary. See [licensing.md](licensing.md).
**Why:** This project is published under Apache-2.0; copyleft dependencies
bundled into the distributed app risk relicensing the whole distributed
work.

## 2026-10-03 — Global dictionary, capped per-notebook-ranked prompt hint
**Decision:** A personal vocabulary/dictionary of shorthand and technical
jargon is stored once globally (not duplicated per notebook). It backs
Review/Edit spellcheck (autocorrect stays off entirely) and feeds a
capped (~30 term, to validate empirically), notebook-relevance-ranked,
explicitly-hedged hint into the VLM prompt. See
[model-pipeline.md](model-pipeline.md) for the full build algorithm.
**Why:** Per-notebook dictionaries would avoid prompt-context bloat but
force duplicating common jargon (e.g. "VESTA") across every notebook that
uses it. A single global store with ranked, capped injection per request
gets both properties: no duplication, and prompt context that stays
small and relevant. The cap exists because vocabulary hints share context
budget with the image itself (a real sample already used ~4,400 tokens)
and because long hint lists both dilute model attention and risk biasing
the model toward a hinted term that isn't actually what's written.
