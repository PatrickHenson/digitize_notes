# Model Evaluation

Quick, fully-local comparison of candidate VLMs (see
[../docs/model-pipeline.md](../docs/model-pipeline.md)) against real sample
page images, before pinning one for the app.

Everything here runs through [Ollama](https://ollama.com) — a local wrapper
around llama.cpp, the same engine the app will embed via `node-llama-cpp`.
Images and results stay on this machine; nothing is uploaded anywhere.

## Setup
1. Install Ollama: https://ollama.com (Linux: `curl -fsSL
   https://ollama.com/install.sh | sh`).
2. Pull the candidate models (check `ollama.com/library` for current exact
   tags — these may shift over time):
   ```
   ollama pull qwen2.5vl:7b
   ollama pull minicpm-v
   ```
3. Drop a few sample page photos (`.jpg`/`.png`) into `sample_images/`.
   That folder and `results/` are git-ignored — nothing placed there ever
   gets committed, including real/confidential handwriting samples.

## Run
```
node evaluate-models.js
```
Override the model list or Ollama's URL:
```
MODELS=qwen2.5vl:7b,minicpm-v node evaluate-models.js
```

## Review
Each model's output lands in `results/<model>/<image-name>.md`. Open it
next to the source image in `sample_images/` and check against
[system-prompt.md](system-prompt.md)'s rules and
[../docs/note-format.md](../docs/note-format.md): did it get the header/
date, bullet vs. bold-important vs. TODO checkboxes, indentation, and
multi-entry sections right?
