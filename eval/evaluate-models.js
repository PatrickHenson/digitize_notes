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
        const raw = await transcribe(model, imagePath);
        const capturedAt = capturedAtFromFilename(image) ?? fs.statSync(imagePath).mtime;
        const markdown = postProcess(raw, capturedAt);
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

// Pixel camera filenames encode real capture time: PXL_YYYYMMDD_HHMMSSmmm.jpg
// Used as ground truth for the capture date — never trust the model to guess it.
function capturedAtFromFilename(filename) {
  const m = filename.match(/PXL_(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})/);
  if (!m) return null;
  const [, y, mo, d, h, mi, s] = m;
  return new Date(`${y}-${mo}-${d}T${h}:${mi}:${s}`);
}

// The model is never trusted to produce a date directly (it hallucinates one
// even when told not to — negative instructions don't reliably suppress a
// strong training-data prior). Instead it transcribes the header verbatim,
// and a date is extracted here via regex: either the exact text it saw
// contains a date-shaped substring, or no date is emitted. No fabrication
// is possible because nothing here *invents* anything, it only matches.
const DATE_RE = /\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/;

function postProcess(raw, referenceDate) {
  let markdown = stripCodeFence(raw.trim());

  let firstIsoDate = null;
  const lines = markdown.split('\n').map((line) => {
    if (!line.startsWith('## ')) return line;
    const match = line.match(DATE_RE);
    if (!match) return line;

    const iso = normalizeDate(match, referenceDate);
    if (!iso) return line;
    if (!firstIsoDate) firstIsoDate = iso;

    const headerText = line.slice(3).replace(DATE_RE, '').trim().replace(/[—-]\s*$/, '').trim();
    return `## ${headerText} — ${iso}`;
  });
  markdown = lines.join('\n');

  return setFrontmatterFields(markdown, {
    date: firstIsoDate,
    captured_at: referenceDate.toISOString(),
  });
}

function normalizeDate([, monthStr, dayStr, yearStr], referenceDate) {
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  let year = yearStr
    ? (yearStr.length === 2 ? 2000 + parseInt(yearStr, 10) : parseInt(yearStr, 10))
    : referenceDate.getFullYear();

  const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return Number.isNaN(Date.parse(iso)) ? null : iso;
}

function stripCodeFence(text) {
  const fenced = text.match(/^```[a-z]*\n([\s\S]*?)\n```$/);
  return fenced ? fenced[1].trim() : text;
}

function setFrontmatterFields(markdown, fields) {
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n?/);
  const body = match ? markdown.slice(match[0].length) : markdown;
  const existing = match ? match[1] : '';

  const kept = existing
    .split('\n')
    .filter((line) => line.trim() && !/^(date|captured_at):/.test(line.trim()));

  const inserted = Object.entries(fields)
    .filter(([, value]) => value !== null && value !== undefined)
    .map(([key, value]) => `${key}: "${value}"`);

  return `---\n${[...inserted, ...kept].join('\n')}\n---\n\n${body.trim()}\n`;
}

main();
