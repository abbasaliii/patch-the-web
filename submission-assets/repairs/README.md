# Community repair visual evidence

Generated before/after screenshots for publication-ready community patches are stored here by the browser test suite.

`nu-karachi-*-chromium-*` files use the deterministic structural fixture. `nu-karachi-*-live-*` files are captures of `https://nu.edu.pk/Degree-Programs` taken before and after the same constrained runtime was applied. The live receipt measured 22 retained Karachi rows, 15 excluded rows, two visible columns, and no page or table overflow at 390px.

`punjab-zakat-hospitals-*-chromium-*` files prove the quarantined Punjab Zakat hospital finder against its privacy-safe structural fixture. The patch passes policy, behavior, responsive, keyboard, and WCAG checks, but is intentionally absent from the public registry because the target returned HTTP 500 to automated compatibility monitoring.
