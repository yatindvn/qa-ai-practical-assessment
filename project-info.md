Primary AI Tool(s) Used: Claude Code (requirement analysis, risk analysis, test scenario design) + Cursor with Playwright (automation build, per assessment tool requirement)
Application Under Test: PracticeSoftwareTesting Toolshop – Checkout & Application Flow
Assessment Start Date: 2026-08-04 / Submission Date: TBD

## Project Summary
Manual + UI + API testing of the Toolshop ecommerce demo app, focused on registration/login and the end-to-end browse → cart → Cash on Delivery checkout → invoice flow, including the app's known "confirm twice to generate invoice" behavior, plus the equivalent API lifecycle (register → login → cart → invoice).

## Scope

### UI scope
- User registration, login, and profile validation (`TC-M-01..05`, `UI-01..05`).
- End-to-end purchase: browse -> add/update cart -> checkout via Cash on Delivery -> invoice, including the app's "confirm twice to generate invoice" behavior (`TC-M-06..08`, `UI-06..07`).

### API scope
- User registration, login, bearer token generation, cart creation (`API-01..04`).
- Product fetch -> add to cart -> validate cart -> invoice generation, including a duplicate-submission check (`API-05..07`).

Full scenario-level detail (one row per case, with AC traceability): `ai-prompts/test-design.md` (all three suites) and `api-test-scenarios.md` (API, standalone view). Full candidate bank before risk-based down-selection: `ai-prompts/requirements-and-planning.md`, Entry 2.

### Coverage breakdown
| Suite | Total | Smoke | Regression | Positive | Negative | Edge |
|---|---|---|---|---|---|---|
| Manual (`FunctionalTestCase.csv`) | 8 | 3 | 5 | 5 | 3 | 1 |
| UI automation (`tests/ui/`) | 7 | 3 | 4 | 3 | 3 | 1 |
| API automation (`tests/api/`) | 7 | 4 | 3 | 4 | 2 | 1 |

(A case can carry more than one of Positive/Negative/Edge where relevant, e.g. the double-confirm checkout case — counts above reflect each case's primary classification, not a strict partition. All three suites are within the brief's 5-8-per-type cap; see `ai-prompts/automation-and-debugging.md`, Entry 6 for a case where the UI suite briefly exceeded it and how that was caught and fixed.)

## Tools Used
- Browser: Chromium (via automated browser tooling for exploration; Playwright for automation)
- Automation: Playwright (Prism framework structure), TypeScript/JavaScript
- API tooling: Swagger UI (`api.practicesoftwaretesting.com`) for schema reference, Playwright `request` fixture for API tests
- AI tools: Claude Code (planning/analysis phase), Cursor (automation build phase, per assignment requirement)
- Version control: Git (public repo, iterative commits)

## Setup Summary

1. **Project and system-under-test context provided to the tool:** Gave the AI the full assessment brief (PDF) verbatim first, then had it extract deliverables/constraints/ambiguities before any test design started — see `ai-prompts/requirements-and-planning.md`, Entry 1. Grounded scenario design in the *live* app (registration form fields, password policy, Swagger resource list) rather than relying on the model's general knowledge of the demo site — see Entry 4.
2. **Requirement analysis:** Broke each high-level AC (UI register/login, UI purchase, API auth/cart, API product/invoice) into a candidate bank of 5–8 numbered scenarios each (positive/negative/edge, tagged UI/API and Smoke/Regression) — Entry 2. Deliberately over-generated candidates because the brief both says "test all possible flows" and caps the final suite at 5–8 per type; the risk ranking (Entry 3) is what does the down-selection, not the AI's first pass.
3. **Test planning and strategy:** UI vs API split follows the brief's own AC1/AC2 split. Smoke vs Regression assigned per scenario based on whether it's on the critical happy path (register→login, browse→cart→checkout→invoice, register→token→cart→invoice) vs a supporting validation/edge case.
4. **Manual test case design:** `FunctionalTestCase.csv` holds 8 cases pulled from the Entry 2 candidate bank, prioritized by the Entry 3 risk ranking (double-confirm/invoice, auth, cart quantity, registration validation guaranteed coverage). 7 were verified live and Passed; 1 (`TC-M-08`, invoice under My Invoices) is a documented **Failed** with a real defect, not a placeholder — see `ai-prompts/automation-and-debugging.md`, Entry 3.
5. **Automation design:** Playwright + TypeScript under `PrismStructure/`, Page-Object-Model (`src/pages`, `src/api`, `src/utils`), two Playwright projects (`ui-chromium`, `api`), `@smoke`/`@regression` tags matching `test-design.md`. Locators and API endpoints were pulled from live DOM/network inspection, not guessed — see `ai-prompts/automation-and-debugging.md`, Entries 1-2.
6. **Validating and refining AI-generated test cases/scripts:** Every AI-generated claim about the app (field names, password rules, endpoint groups, request/response shapes) was checked against the live site/API rather than accepted at face value. This caught two real issues before they shipped: an invoice-payload validation rule (`billing_city`/`billing_state` must belong to `billing_country` — Faker-random data triggered a real `422`, fixed by using the brief's own verified-valid combo) and a UI defect (checkout shows an invoice-number confirmation that isn't actually retrievable via the user's own `GET /invoices` afterwards). See `ai-prompts/automation-and-debugging.md`, Entries 3-4a.
7. **Test data generation / environment assumptions / API payloads:** `PrismStructure/src/utils/testDataGenerator.ts` — Faker-based names/streets, a deterministic policy-compliant password generator, a fixed DE postcode confirmed to trigger the site's address auto-fill, and an invoice payload builder using the brief's example fields. Full log in `ai-prompts/test-data.md`.
8. **Debugging failing tests / interpreting logs:** Two real debugging episodes, both root-caused with actual evidence rather than assumption: the invoice `422` (fixed by inspecting the real response body) and the UI suite's inability to launch a browser in this build environment (root-caused down to a Windows Application Control policy blocking `chrome.exe`, confirmed independently of Playwright via `Start-Process`). Full write-up in `ai-prompts/automation-and-debugging.md`, Entries 4a-4b.
9. **Information avoided when sharing with AI tools:** No real personal data — all registration/checkout data used is synthetic (fake names, non-routable/test addresses, disposable-style test emails). No credentials, tokens, or API keys are ever pasted into prompts even though this is a public demo app with no real secrets at stake.
10. **Reusing this QA workflow in a real project:** Same shape — (a) extract deliverables/constraints from any requirements doc *before* writing tests, explicitly flagging ambiguities instead of guessing silently; (b) generate a wide candidate scenario bank, then risk-rank and cap it rather than "testing everything"; (c) verify any AI claim about system behavior against the real system before trusting it; (d) keep a running, honest prompt log (including what was wrong or had to be corrected) rather than a cleaned-up transcript.
