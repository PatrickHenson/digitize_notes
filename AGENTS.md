# AGENTS.md

## Project Overview
digitize_notes is a cross-platform desktop application (Electron + TypeScript)
that lets a user scan or import images of handwritten notes, preview them, and
digitize them into markdown files.

Status: scaffolded (electron-vite, React + TypeScript). No real
application logic yet beyond the default scaffold screen.

## Environment
- Runtime: Node.js (LTS) + Electron
- Language: TypeScript
- Package manager: npm
- Target platforms: Linux, Windows, macOS

## Setup Commands
- Install dependencies: `npm install`
- Run in development: `npm run dev`

## Build Commands
- Typecheck + build main/preload/renderer: `npm run build`
- Package an installer: `npm run build:linux` / `build:win` / `build:mac`

## Test Commands
- Unit tests: `npm run test`
- Unit tests (watch mode): `npm run test:watch`
- No end-to-end tests yet (Playwright) — deferred until there's a real UI
  flow worth testing end-to-end; see docs/setup.md.

## Lint / Format Commands
- Lint: `npm run lint`
- Format: `npm run format`
- Typecheck only (no build): `npm run typecheck`

## Code Style
- TypeScript strict mode enabled.
- ESLint (typescript-eslint) + Prettier for consistent formatting.
- Keep Electron's three process types clearly separated:
  main (`src/main`), preload (`src/preload`), renderer (`src/renderer`).

## Architecture
See [docs/architecture.md](docs/architecture.md) for how the scan → preview →
digitize pipeline is planned to fit together.

## Testing Instructions
- New logic in `src/main` or `src/shared` should have unit test coverage.
- UI flows that cross the preload bridge should get an end-to-end test.
- Run the full test suite before opening a PR.

## PR / Commit Guidelines
- Commit messages: short imperative summary line (e.g. "Add OCR preview
  pane"), body explains *why* when it's not obvious from the diff.
- Keep PRs scoped to one concern; note any manual test steps in the
  description.

## Security Considerations
See [docs/security.md](docs/security.md).

## Open Source / Dependency Licensing
This project is Apache-2.0. See [docs/licensing.md](docs/licensing.md)
before adding a new dependency or vendoring external code — prefer
permissively-licensed resources; avoid or carefully isolate copyleft ones.

## Additional Documentation
Detailed, longer-lived docs live in [docs/](docs/) rather than here, so this
file stays short:
- [docs/requirements.md](docs/requirements.md) — functional requirements and
  open product questions
- [docs/note-format.md](docs/note-format.md) — handwriting shorthand →
  markdown transcription rules
- [docs/model-pipeline.md](docs/model-pipeline.md) — VLM approach, inference
  runtime, and model candidates
- [docs/architecture.md](docs/architecture.md) — how the pieces fit together
- [docs/setup.md](docs/setup.md) — detailed dev environment setup
- [docs/security.md](docs/security.md) — security considerations
- [docs/licensing.md](docs/licensing.md) — open source dependency licensing
  policy
- [docs/decisions.md](docs/decisions.md) — lightweight decision log (why we
  chose X over Y)

## Next Steps
Scaffold is in place and verified (typecheck, lint, build all pass). Real
application logic (capture/import UX, processing queue, note format
pipeline — see docs/requirements.md) hasn't been built yet.
