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

## 2026-09-22 — Prefer permissive licenses; avoid/isolate copyleft
**Decision:** New dependencies should be permissively licensed
(Apache-2.0/MIT/BSD-family compatible); GPL/AGPL and similarly restrictive
licenses are avoided, or used only via subprocess/service isolation if truly
necessary. See [licensing.md](licensing.md).
**Why:** This project is published under Apache-2.0; copyleft dependencies
bundled into the distributed app risk relicensing the whole distributed
work.
