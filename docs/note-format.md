# Note Format

How a captured page's handwritten shorthand (the user's own bullet-journal
/ "bujo"-style notation) maps to the generated markdown, and how a note
file is structured. Serves the project's goals (see "Goals" in
[requirements.md](requirements.md)): searchable, TODO-trackable,
agent-usable.

## Title page
Each notebook's title page carries its own YAML frontmatter:

```yaml
---
title: <notebook title>
date: <date or date range>
tags: [work, personal]   # comma-separated input at notebook creation
---

<free-text description>
```

`tags` is how a notebook gets categorized (e.g. work/personal) — set once
at notebook-creation time via a second text input (comma-separated) next
to the title/directory field, editable later by hand since it's a plain
file. These tags are what the global TODO view (see requirements.md) can
filter by.

## Page header
A handwritten page header, with an optional date on the same line, becomes:

```
## {header} — {date}
```

**The date is never produced by the model.** The VLM only transcribes the
header line verbatim (date text included, unedited); a date is then
extracted deterministically by regex against that verbatim text and
normalized to ISO 8601 (`YYYY-MM-DD`) — a missing year is filled in from
the image's real capture timestamp, never guessed. If no date-shaped text
is found in the verbatim transcription, no date is emitted. This is a
blocking-bug fix, not a style choice: asking the model to produce the
date directly caused it to fabricate a plausible one even on pages with
no date at all, despite explicit instructions not to — moving date
extraction out of the model and into deterministic code makes that
fabrication structurally impossible. See
[model-pipeline.md](model-pipeline.md).

## Shorthand → markdown
| Handwritten mark                                         | Meaning          | Markdown              |
|------------------------------------------------------------|------------------|------------------------|
| `-` (dash), `\` (diagonal tick), `→`/`›` (arrow/chevron)    | New note/line    | `- {text}`             |
| `*` (star)                    | Important note   | `- **{text}**`         |
| `○` (open circle)              | Open TODO        | `- [ ] {text}`         |
| `⊗` (circle with X)            | Completed TODO   | `- [x] {text}`         |
| New large title mid-page       | New section      | New `##` heading       |
| Horizontal line mid-page       | Visual break     | `---`                  |

Dash, diagonal tick, and arrow/chevron are bullet-point variants the user
writes interchangeably — all mean the same thing. (The user also sometimes
uses an arrow to visually link two items on the page; that linking
relationship isn't captured in the markdown output — it still just renders
as a plain bullet.)

Indentation in the handwritten text is preserved as nested list
indentation at the matching level.

A bracket/brace drawn alongside several lines to visually group them is
rendered as a nested indented list (extending the indentation rule above),
never as a fenced code block — a code block would turn any `- [ ]`
checkbox or `**bold**` inside it into inert literal text, breaking the
TODO-tracking goal for anything caught inside the bracket.

## One note file per page
Each captured/imported page image produces exactly one note markdown file
— this keeps the one-image-one-note naming rule
(`[notebook name]_[id].[filetype]`). When a page has multiple handwritten
entries (a new large title, or a horizontal-line break), those become
multiple `##` sections / `---`-divided blocks *within that one file*, not
separate note files.

## Multi-page notes
A single logical entry can span more than one physical page/image.
Continuation is detected automatically when a new page is processed,
compared against the last header-bearing entry on the previous page in
that notebook:
- **No header on the new page** → assume it continues the previous entry.
- **Header matches the previous entry's title** (exactly, or with a
  trailing "continued"/"cont." marker) → assume it continues.
- **Otherwise** → treat it as a new, unrelated entry.

A continuation sets `continues_from` in the new page's frontmatter (and
backfills `continues_to` on the page it continues). This is a page-level
link — if a page has multiple entries (see "One note file per page"
above), continuation is evaluated against that page's last entry.

This is an automatic first guess with no manual override yet — a feedback
loop (relink/split a wrongly-guessed continuation) is deferred to a later
discussion.

## Frontmatter metadata
Each note file gets a small YAML frontmatter block:

```yaml
---
notebook: <notebook name>
id: "0007"
date: 2026-10-01        # from the handwritten header, if present
captured_at: 2026-10-01T14:32:00  # always set, from capture/import time
continues_from: "0006"  # omitted if this entry doesn't continue another
continues_to: "0008"    # omitted/backfilled if a later page continues this one
tags: []
---
```

`tags` starts empty; per-note tags and the future notebook-level
work/personal tag (see requirements.md) are expected to build on this
field later.
