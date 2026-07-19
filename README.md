# OpenPatch

**Fix the web you have.**

OpenPatch is a safe, public repair layer for websites users do not own. A user shows Codex a broken page, describes the problem, and gets a constrained, domain-scoped patch. Everyone else can install that community repair with one click—without AI, an account, or an API key.

Built for OpenAI Build Week 2026 with Codex and GPT‑5.6.

## The demo

The bundled CivicApply portal recreates a familiar high-stakes failure: a public-benefits form that overflows on mobile, loses unfinished progress, reports generic inaccessible errors, and is covered by a survey.

OpenPatch applies 19 declarative operations that:

- Repair the complete 390px mobile layout
- Preserve non-sensitive form progress in origin-local storage
- Restore a draft after a simulated session reset
- Add specific accessible validation with `aria-invalid` and `aria-describedby`
- Add arrow-key navigation to the progress controls
- Move help into the application workflow
- Remove the blocking survey and contradictory native save state

On any page without a community patch, the extension can also create a **privacy-safe Repair Brief** for Codex. It includes the exact origin and path, viewport geometry, structural counts, accessibility signals, and bounded selector candidates—but never field values, cookies, storage, URL queries, or page text.

The validator reports **19/19 healthy operations**, **10/10 publication assertions**, and a SHA-256 publication receipt. Local drafts expire automatically after 24 hours.

| Before — fixed-width form and blocking survey | After — repaired, accessible, locally saved |
| --- | --- |
| ![Broken CivicApply form at 390px](submission-assets/civicapply-before-mobile.png) | ![OpenPatched CivicApply form at 390px](submission-assets/civicapply-after-mobile.png) |

## Why this is different

User-script tools can already inject arbitrary JavaScript. OpenPatch deliberately cannot.

```mermaid
flowchart LR
  A[User describes a broken page] --> B[Codex inspects DOM + screenshots]
  B --> C[Constrained .openpatch.json]
  C --> D[Policy validator]
  D --> E[Selector + browser tests]
  E --> F[Public patch registry]
  F --> G[One-click extension install]
  G --> H[Anyone gets the repair\nNo AI or account]
```

The patch language supports seven capabilities: allowlisted styles, safe attributes, explicit hiding, same-page reorganization, non-sensitive form persistence, local validation, and keyboard navigation. It has no operation for scripts, HTML injection, network requests, cookies, or cross-origin data.

## Judge quick start

Requirements: Node.js 22+ and Chrome/Chromium.

Prebuilt artifacts:

- `release/openpatch-extension-v0.2.0.zip` — load-unpacked Chrome extension
- `release/openpatch-codex-plugin-v0.2.0.zip` — validated Codex plugin package
- Extension SHA-256: `4CD1F70F80D69A0D5C0C7DBB9E9F0412687ED2C81C0B20E710525C59245BC52A`
- Plugin SHA-256: `ADDD9D9AFAB4CF9FB70DA19BBF6B170E0DA015B762EE333AF9051605D0054DB1`

```bash
npm install
npm run build
npm run dev -- --port 5173
```

Then:

1. Unzip `release/openpatch-extension-v0.2.0.zip`.
2. Open `chrome://extensions`, enable **Developer mode**, choose **Load unpacked**, and select the unzipped folder.
3. Open `http://localhost:5173/demo/`.
4. Try the broken form at a narrow viewport, enter sample data, and choose **Simulate timeout now**.
5. Open the OpenPatch extension and enable **CivicApply: accessible & autosaved**.
6. Enter sample data again, simulate another timeout, and watch the patch restore it.
7. Submit an invalid email to see the accessible error, then focus a progress step and use the arrow keys.

No account, test credential, API key, or external service is required.

### Test the Codex authoring path

1. Open any normal website tab that does not have a bundled repair.
2. Open OpenPatch and describe the problem in **Start a repair with Codex**.
3. Choose **Copy Codex repair brief**.
4. Open this repository in Codex and paste the brief. Codex auto-discovers `$openpatch-author` from `.agents/skills/openpatch-author`.

The same skill is packaged as a distributable Codex plugin under `plugins/openpatch`. The extension performs no model call; GPT‑5.6 operates through the user's existing Codex session only while a repair is authored.

![OpenPatch privacy-safe Repair Brief authoring UI](submission-assets/openpatch-repair-brief.png)

### Supported platforms

- Extension: Chrome/Chromium 120+ on Windows, macOS, and Linux; the release candidate is tested with Playwright Chromium.
- Authoring skill: ChatGPT desktop Codex, Codex CLI, and the Codex IDE extension on platforms that support repository skills.
- Demo and registry: any modern browser; no account, login, API key, or test data required.

## Verification

```bash
npx tsc --noEmit
npm test
npm run validate:patch
npm run test:browser
npm run build
```

Current results:

- 12/12 unit tests pass
- 6/6 desktop and 390px browser tests pass
- 19/19 constrained operations apply
- 10/10 publication assertions pass
- Production site and Manifest V3 extension build successfully
- Public `/registry/index.json` and versioned patch download are generated with a SHA-256 receipt

Browser tests prove both states: the original portal must be broken, and the patched portal must fit the viewport, restore a local draft after reload, expose specific accessible errors, and support arrow-key focus movement.

## Repository map

```text
.agents/skills/openpatch-author/ Codex patch-authoring workflow, auto-discovered in this repo
plugins/openpatch/               Distributable Codex plugin package
src/core/                      DSL types, domain matcher, validator, runtime
src/extension/                 Manifest V3 content script, popup, service worker
src/registry/patches/          Versioned community patches
src/site/                      Registry landing page and CivicApply demo
tests/                         Security, runtime, and browser tests
scripts/                       Build, validation, and preview tooling
```

## Safe transformation DSL

Every patch declares an exact host/path scope, plain-language capabilities, constrained operations, assertions, version, and changelog.

```json
{
  "schemaVersion": 1,
  "id": "org.openpatch.civicapply-accessible-draft",
  "match": {
    "hosts": ["localhost", "127.0.0.1"],
    "paths": ["/demo/*"]
  },
  "capabilities": ["local-storage", "validation"],
  "operations": [
    {
      "id": "persist-draft",
      "type": "persistForm",
      "selector": "#benefits-form",
      "key": "housing-support-draft-v1",
      "include": ["input", "select", "textarea"],
      "ttlMinutes": 1440,
      "statusText": "Draft saved on this device for 24 hours"
    }
  ]
}
```

The validator rejects unknown operations, event-handler attributes, network-capable CSS, broad document selectors, malformed scopes, undeclared capabilities, duplicate IDs, excessive operation counts, and sensitive persistence patterns. The runtime adds its own exclusions for password, file, authentication-code, payment, hidden, disabled, and submit fields.

See [`src/core/validator.ts`](src/core/validator.ts) for executable policy and [`.agents/skills/openpatch-author/references/dsl.md`](.agents/skills/openpatch-author/references/dsl.md) for the authoring reference.

## Codex collaboration

This project was created during the Build Week submission period in a single core Codex thread.

**Human product decisions:** the public repair-layer concept; the no-API-key distribution model; a deliberately constrained DSL instead of user scripts; the choice to demonstrate a public-benefits workflow; and the focus on agency, accessibility, and community reuse.

**Where GPT‑5.6 through Codex accelerated the work:** translating the concept into a judge-focused vertical slice; scaffolding the Manifest V3 extension and public registry; implementing and threat-modeling the DSL; authoring the CivicApply repair; building the privacy-safe extension-to-Codex Repair Brief; packaging the official repo skill and plugin; building unit and browser tests; running responsive visual QA; and turning browser failures into concrete layout and test-fixture fixes.

**Key joint tradeoff:** the hackathon MVP publishes one real, fully tested community patch instead of pretending a production-scale catalog already exists. The deployed registry is a genuine machine-readable endpoint with a version, scope, downloadable patch, operation/assertion counts, and SHA-256 receipt. Remote extension sync, publisher signing, moderation, and revocation remain explicit next milestones.

Before final Devpost submission, the project thread's `/feedback` Codex Session ID will be added to the submission as required.

## Security model

OpenPatch treats patches, websites, registry metadata, and page content as untrusted.

- Exact host and narrow path matching happens before execution.
- Operations are parsed into typed built-ins; patch code is never evaluated.
- CSS properties and attributes use allowlists.
- Critical singleton targets fail closed when selector counts drift.
- Every operation emits health data for breakage detection.
- Local draft storage stays on the page origin and excludes sensitive fields.
- Community permissions are displayed before activation.
- Patches never replace the site's actual authentication, submission, or server validation.
- Repair Briefs exclude values, cookies, storage, query strings, and page text before anything is copied to Codex.

The current MVP bundles its registry entry with the extension. Production registry transport, publisher signatures, moderation, and revocation are explicit next milestones.

## License

MIT. See [LICENSE](LICENSE).
