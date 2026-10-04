# Model / Inference Pipeline

## Approach: VLM, not OCR/HTR
Captured page images are processed by a local/offline vision-language model
(VLM), prompted with the transcription rules in
[note-format.md](note-format.md), rather than a traditional OCR/handwriting-
recognition (HTR) engine.

**Why:** the note format's shorthand (dash/star/circle/crossed-circle,
indentation, headers) encodes *meaning*, not just characters. An OCR/HTR
model only outputs flat transcribed text — it has no way to be told "a
circle means an open TODO." A promptable VLM does recognition and semantic
interpretation in one pass, emitting the frontmatter + structured markdown
directly.

**Tradeoffs accepted:**
- VLMs are heavier (RAM/VRAM, latency per page) than a small dedicated HTR
  model.
- General-purpose VLM accuracy on messy handwriting varies and needs
  empirical validation against real samples — not assumed to "just work."
- Fallback if accuracy disappoints: a two-stage pipeline (dedicated HTR for
  raw transcription + a text LLM to reinterpret symbols/structure). Not
  pursued unless the single-pass VLM proves insufficient.

## Inference runtime: embedded, cross-platform
The VLM runs embedded directly in the Electron main process via Node
bindings to llama.cpp (`node-llama-cpp`) — not a separately installed/run
server (e.g. Ollama), and not a Python-based high-throughput engine
(vLLM, TensorRT-LLM).

**Why:** the app must support Linux, Windows, and macOS. llama.cpp is the
option that actually runs everywhere with one codebase — CUDA backend on
NVIDIA GPUs, Metal on macOS, CPU fallback elsewhere — and bundling it means
no extra software for the user to install or keep running. vLLM/TensorRT-
LLM give better *batched* throughput but are NVIDIA/Linux-first and would
need a separate solution for Mac/non-NVIDIA machines; that cost isn't
justified for a single-user desktop app whose "batch" is a few dozen
images from an import, not a multi-tenant workload.

## Model pinned: Qwen2.5-VL (7B)
Evaluated against 5 real handwritten sample pages (see "Evaluating
candidates" below) against MiniCPM-V. Qwen2.5-VL won decisively on raw
transcription accuracy — MiniCPM-V made real word-level errors
("Complicated" → "Complexated", "spill" → "spik", "Sovereign Environment"
→ "Several Environment") and on two pages hallucinated duplicate lines
that don't exist in the source. Qwen2.5-VL's raw transcription stayed
close to the source text throughout.

**Known limitation, not blocking this pin** (to address at implementation
time, not via further prompt tuning):
- Symbol-to-markdown mapping (star→bold, circle→checkbox) is applied
  inconsistently on real handwriting — sometimes the literal glyph is
  preserved or silently dropped instead of transformed. Likely needs
  few-shot examples in the real prompt, not just instructions.

**Date fabrication — solved, not a limitation.** The model would
fabricate a plausible-looking date even on pages with none, regardless of
an explicit "never invent a date" instruction — negative instructions
don't reliably suppress a strong training-data prior. The fix is
architectural, not more prompt wording: **the model is never asked to
produce a date at all.** It only transcribes the header line verbatim
(including whatever date-shaped text physically appears on it, unedited);
a date is then extracted deterministically by regex against that verbatim
text, with the year resolved from the image's actual capture timestamp
(`captured_at`) rather than guessed by the model. If the regex finds
nothing date-shaped, no date is emitted — fabrication is structurally
impossible, since nothing in the pipeline is capable of inventing text
that wasn't transcribed. Verified against all 5 real sample pages,
including the one with no date at all (stayed clean) and two with dates
(resolved to the correct year, 2026, not a guessed one). See
[eval/evaluate-models.js](../eval/evaluate-models.js)'s `postProcess`/
`normalizeDate` functions for the reference implementation; the real app
applies the same approach, using the page's actual capture time instead
of a filename-derived one.

**Rejected:**
- **MiniCPM-V** (Apache-2.0) — accuracy was consistently worse on real
  samples (see above).
- **GOT-OCR2.0** (Apache-2.0) — not tested; remains a fallback idea if
  Qwen2.5-VL proves insufficient in practice, since it's smaller/faster,
  but is less of an instruction-following chat model so applying custom
  symbol semantics would likely be harder to prompt for.

**Explicitly avoided:** Llama-vision-based models (Llama 3.2 Vision,
LLaVA-Llama variants) — Meta's community license carries usage
restrictions, conflicting with the project's Apache-2.0-first dependency
policy (see [licensing.md](licensing.md)).

This is a fast-moving space — re-verify model availability, llama.cpp
multimodal support, and licensing at implementation time rather than
trusting this list blindly.

## Evaluating candidates
See [../eval/](../eval/) for a small local harness (via Ollama) that runs
sample page images through each candidate model and saves outputs for
side-by-side comparison. Sample images and results are git-ignored —
real/confidential handwriting samples never get committed.

## Personal vocabulary / dictionary hint
The user's notes lean on shorthand and technical jargon/acronyms (e.g.
"VESTA", "MCAP", "ViQi") that a general-purpose VLM will sometimes
mis-transcribe (confirmed during evaluation — see above). A growing
personal dictionary feeds known terms back into the prompt to improve
accuracy on recurring vocabulary, and separately backs the Review/Edit
pane's spellcheck (see [note-format.md](note-format.md) / requirements).

**Storage:** one global `dictionary.json` in the app's user-data
directory (not per-notebook — avoids duplicating common terms across
notebooks). Each entry: `{ term, usageCount, addedAt, lastUsedAt }`.
Adding a term that already exists increments `usageCount` rather than
creating a duplicate — reusing a term across notebooks reinforces it
instead of re-entering it.

**Why not inject the whole dictionary every time:** both a hard limit
(the image itself already consumes significant context — a real sample
page hit ~4,400 tokens before raising `num_ctx`) and a soft one
(long lists dilute model attention — "lost in the middle" — and can bias
the model toward false-positive matches on a hinted term that isn't
actually what's written). No hard data for this specific model/task yet;
default cap is 30 terms per request, to be validated empirically via
`eval/` once built, not assumed.

**Building the capped hint list, per page processed:**
1. Dictionary is loaded once into memory by the background worker at
   startup (not re-read from disk per page); writes update both the file
   and the in-memory cache.
2. Each notebook gets an in-memory (session-scoped, not persisted)
   `Set<string>` of dictionary terms that already appear in that
   notebook's committed notes — built once on notebook open via a cheap
   word-boundary match against its existing note text, then updated
   incrementally (just the newly-committed note, not a full rescan) each
   time a page finishes processing.
3. Rank candidates for the page about to be processed: **tier 1** —
   terms in that notebook's relevant-term set, sorted by `usageCount`
   descending; **tier 2** — remaining dictionary terms, sorted by
   `usageCount` descending, filling any slots left after tier 1.
4. Take the top 30 (tier 1 first, then tier 2) and format as an
   explicitly hedged hint — not a command — e.g.: "Terms that may appear
   on this page, for reference only — transcribe literally what's written
   even if it doesn't match one of these: VESTA, MCAP, ViQi, …". The
   hedge is the guard against false-positive bias.
5. Include that hint alongside the existing system prompt and image in
   the same VLM call used today.

**Closing the loop:** the Review/Edit pane's "Add to dictionary" action
(on a spellcheck-flagged word) is what writes to `dictionary.json` — new
term inserted at `usageCount: 1`, existing term's `usageCount`
incremented and `lastUsedAt` updated. The current notebook's in-memory
relevant-term set is updated immediately too, so the next page processed
in that notebook benefits without waiting for anything to rebuild.

**Editor behavior this pairs with:** autocorrect (silent text rewriting)
is off entirely — too risky for shorthand/jargon in notes meant to stay
searchable and agent-readable. Spellcheck (underline-only) stays on,
backed by this same dictionary so recognized terms stop being flagged.
