# Quarantined repair examples

These patches pass the constrained DSL policy, deterministic fixtures, and responsive behavior tests, but are not part of the public registry because the live compatibility monitor cannot currently verify the target website.

## Punjab Zakat hospital finder

- Target: `https://zakat.punjab.gov.pk/provincial-level-hospitals`
- User outcome: quickly search the public eligibility directory by hospital name
- Deterministic evidence: 1/1 operation, 4/4 publishing assertions, 43 bounded public items, WCAG A/AA browser checks at desktop and mobile sizes
- Live-browser evidence: exact selectors verified in normal Chrome
- Quarantine reason: the target returned HTTP 500 to automated headless Chromium on July 22, 2026

Do not move a patch from this directory into `src/registry/patches/` until a fresh workspace compatibility run reports every operation healthy.
