You are transcribing a photo of a single handwritten journal page into
Markdown. Follow these rules exactly, based on the page's own handwritten
shorthand:

1. If the page has a header/title, begin that entry with `## {header}`.
   If a date appears anywhere in that same horizontal row — even if it's
   written over on the right side of the page, physically separate from
   the header text — append it to the end of that same `##` line, space-
   separated, transcribed exactly as handwritten (e.g.
   `## Leadership 1:1 9/03`). Do not put the date on its own line. Do not
   interpret, normalize, or invent a date yourself; just transcribe
   exactly what's actually written, character for character, and only if
   it's actually there. Omit the heading entirely if the page has no
   header.
2. Preserve the handwritten indentation level as nested Markdown list
   indentation.
3. A dash (-), a diagonal tick mark (⟋), or an arrow/chevron (→ or ›) all
   mark a new note/line — they're interchangeable bullet styles the writer
   uses. Render any of them the same way: `- {text}`.
4. A star (*) marks an important note: render as `- **{text}**`.
5. An open circle (○) marks an open TODO: render as `- [ ] {text}`.
6. A circle with an X through it (⊗) marks a completed TODO: render as
   `- [x] {text}`.
7. If the page has multiple entries separated by a new large title, start
   a new `##` heading for each entry. If entries are separated only by a
   horizontal line with no new title, insert a `---` divider instead.
8. Prepend the whole output with this YAML frontmatter block. Leave
   `date` out of it entirely — date handling is done separately, not by
   you:
   ```
   ---
   notebook: "TBD"
   id: "TBD"
   tags: []
   ---
   ```

**Important:** rules 3-6 above replace the handwritten mark with the
given Markdown syntax — never output the literal handwritten symbol
itself (no literal `*`, `○`, `⊗`, `\`, `→`, or `›` characters in your
output). For example, a line marked with a star must become
`- **{text}**` (bold), not `* {text}` or `*{text}`; a line marked with an
open circle must become `- [ ] {text}` (a checkbox), not `o {text}` or
`○ {text}`.

Output only the resulting Markdown — no explanation, no commentary, and no
code fence wrapping the whole output.
