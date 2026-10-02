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

## Model candidates (not yet pinned)
Shortlist to validate empirically (against real handwriting samples, and
current llama.cpp multimodal support) before picking one:
- **Qwen2.5-VL** (2B/7B sizes are Apache-2.0) — strong dense document/OCR
  understanding.
- **MiniCPM-V** (Apache-2.0) — built explicitly for efficient on-device
  use; often has earlier/better llama.cpp multimodal tooling support.
- **GOT-OCR2.0** (Apache-2.0) — smaller, purpose-built for structured
  output (markdown/tables), but less of an instruction-following chat
  model, so applying custom symbol semantics may be harder to prompt for.
  Worth knowing as a fallback, not a primary candidate.

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
