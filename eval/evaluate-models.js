#!/usr/bin/env node
// Sends every image in sample_images/ to every candidate Ollama model and
// saves each model's raw transcription to results/<model>/<image>.md, so
// outputs can be compared side by side. Fully local — images and results
// never leave this machine (see eval/README.md).

const fs = require('fs');
const path = require('path');

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const NUM_CTX = parseInt(process.env.NUM_CTX || '8192', 10);
const MODELS = (process.env.MODELS || 'qwen2.5vl:7b,minicpm-v')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const SAMPLES_DIR = path.join(__dirname, 'sample_images');
const RESULTS_DIR = path.join(__dirname, 'results');
const SYSTEM_PROMPT = fs.readFileSync(path.join(__dirname, 'system-prompt.md'), 'utf8');
const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png']);

async function main() {
  const images = fs
    .readdirSync(SAMPLES_DIR)
    .filter((f) => IMAGE_EXTENSIONS.has(path.extname(f).toLowerCase()));

  if (images.length === 0) {
    console.error(
      `No images found in ${SAMPLES_DIR}. Add a few .jpg/.png page photos and rerun.`
    );
    process.exit(1);
  }

  console.log(`Sample images (${images.length}): ${images.join(', ')}`);
  console.log(`Models (${MODELS.length}): ${MODELS.join(', ')}`);

  for (const model of MODELS) {
    const modelDir = path.join(RESULTS_DIR, sanitize(model));
    fs.mkdirSync(modelDir, { recursive: true });

    for (const image of images) {
      const imagePath = path.join(SAMPLES_DIR, image);
      process.stdout.write(`\n[${model}] ${image} ... `);
      const start = Date.now();
      try {
        const markdown = await transcribe(model, imagePath);
        const outPath = path.join(modelDir, `${path.parse(image).name}.md`);
        fs.writeFileSync(outPath, markdown);
        const seconds = ((Date.now() - start) / 1000).toFixed(1);
        console.log(`done (${seconds}s) -> ${path.relative(__dirname, outPath)}`);
      } catch (err) {
        console.log(`FAILED: ${err.message}`);
      }
    }
  }
  console.log('\nDone. Review results/<model>/<image>.md next to the source image.');
}

async function transcribe(model, imagePath) {
  const imageB64 = fs.readFileSync(imagePath).toString('base64');
  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      stream: false,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: 'Transcribe this page.', images: [imageB64] },
      ],
      options: { num_ctx: NUM_CTX },
    }),
  });
  if (!res.ok) {
    throw new Error(`Ollama API ${res.status}: ${await res.text()}`);
  }
  const data = await res.json();
  return data.message?.content ?? '';
}

function sanitize(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

main();
