# Open Source Licensing Policy

This project is published under Apache License 2.0. Dependency and resource
choices should keep the project's licensing clean and compatible.

## Priority order for new dependencies
1. Permissive, Apache-2.0-compatible: Apache-2.0, MIT, BSD-2-Clause,
   BSD-3-Clause, ISC, 0BSD.
2. Public-domain-equivalent: CC0, Unlicense.
3. Weak copyleft (MPL-2.0, LGPL) — usable with care (see below); prefer a
   permissive alternative if one exists.
4. Avoid: strong/network copyleft (GPL-2.0, GPL-3.0, AGPL-3.0) and
   source-available-but-restrictive licenses (SSPL, BUSL, non-commercial
   clauses).

## Why GPL/AGPL are avoided
- GPLv2 is generally treated as incompatible with Apache-2.0; GPLv3 permits
  combining with Apache-2.0 code, but the combined work becomes GPL.
- AGPL's network-use clause can force source disclosure even for a hosted
  integration (relevant if any backend/service is ever added).
- Bundling GPL/AGPL code into the distributed Electron binary risks putting
  the whole distributed work under GPL terms.

## If a copyleft resource is genuinely the best option
- Shell out to it as a separate, unmodified subprocess/CLI (e.g. invoke a
  GPL-licensed tool as an external binary) rather than linking it into the
  codebase — keeps it "mere aggregation," not a combined work.
- Put it behind a network/service boundary rather than importing its
  library directly.
- Make it an optional, user-installed dependency rather than something
  bundled in the distributed app.
- If none of the above is possible, don't use it — find a permissively
  licensed alternative, or write the small amount of code needed instead.

## Process
- Check a new dependency's license before adding it (e.g. `npm view <pkg>
  license`).
- Record any exception (a copyleft or unusual license used anyway) in
  [decisions.md](decisions.md), including the isolation approach taken.
- Keep a NOTICE / THIRD_PARTY_NOTICES file up to date for attribution, as
  Apache-2.0 (and most permissive licenses) requires for bundled code.

This is engineering guidance, not legal advice — when a real edge case comes
up, don't guess.
