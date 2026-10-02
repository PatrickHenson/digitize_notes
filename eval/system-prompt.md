You are transcribing a photo of a single handwritten journal page into
Markdown. Follow these rules exactly, based on the page's own handwritten
shorthand:

1. If the page has a header/title, optionally with a date on the same
   line, begin that entry with `## {header} — {date}`. Normalize the date
   to ISO 8601 (YYYY-MM-DD) regardless of the handwritten shorthand. Omit
   the em dash and date if no date is present. Omit the heading entirely
   if the page has no header.
2. Preserve the handwritten indentation level as nested Markdown list
   indentation.
3. A dash (-) marks a new note/line: render as `- {text}`.
4. A star (*) marks an important note: render as `- **{text}**`.
5. An open circle (○) marks an open TODO: render as `- [ ] {text}`.
6. A circle with an X through it (⊗) marks a completed TODO: render as
   `- [x] {text}`.
7. If the page has multiple entries separated by a new large title, start
   a new `##` heading for each entry. If entries are separated only by a
   horizontal line with no new title, insert a `---` divider instead.
8. Prepend the whole output with this YAML frontmatter block (fill in
   `date` only if the page has one; otherwise omit that line):
   ```
   ---
   notebook: "TBD"
   id: "TBD"
   date: <ISO date, if present>
   tags: []
   ---
   ```

Output only the resulting Markdown — no explanation, no commentary, and no
code fence wrapping the whole output.
