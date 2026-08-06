# Toolshop QA AI Practical Assessment

## Project Overview
Manual + UI + API testing of the [PracticeSoftwareTesting Toolshop](https://practicesoftwaretesting.com/) demo ecommerce app, built as an AI-assisted QA exercise. Scope: user registration/login (AC1) and the browse -> cart -> Cash-on-Delivery checkout -> invoice flow (AC2), including the app's documented "confirm twice to generate invoice" behavior, plus the equivalent API lifecycle (register -> login -> cart -> invoice). The process — requirement analysis, risk-based scoping, exploratory verification against the live app, automation, and debugging — is documented as it actually happened in `ai-prompts/`, not reconstructed after the fact.

## Project structure
```
qa-ai-practical-assessment/
├── FunctionalTestCase.csv         # manual test suite (8 cases, 7 verified live, 1 real defect)
├── api-test-scenarios.md          # API scenario bank + verified request/response shapes
├── automation-opportunities.md    # what's automated, what's a good candidate, what should stay manual
├── exploratory-testing-notes.md   # findings from hands-on live-app/API exploration
├── defect-report.md               # DEFECT-01: invoice not retrievable after checkout confirmation
├── tool-workflow.md               # short-form AI workflow summary (points to project-info.md)
├── PrismStructure/                # Playwright UI + API automation + execution reports
├── project-info.md                # AI workflow write-up (Part A, full form)
├── readme.md                      # this file
└── ai-prompts/
    ├── requirements-and-planning.md
    ├── test-design.md
    ├── test-data.md
    ├── automation-and-debugging.md
    └── documentation-and-summary.md
```

## Framework
- Playwright + TypeScript, Page-Object-Model layout under `PrismStructure/src/pages` and `PrismStructure/src/api`
- Two Playwright projects: `ui-chromium` (against `practicesoftwaretesting.com`) and `api` (against `api.practicesoftwaretesting.com`)
- Test data generation: `PrismStructure/src/utils/testDataGenerator.ts` (Faker-based, policy-aware — see `ai-prompts/test-data.md`)

## Setup
```bash
cd PrismStructure
npm install
npx playwright install chromium
```

## Running tests
```bash
npm run test:smoke        # all @smoke tests, UI + API (Core)
npm run test:regression   # all @regression tests, UI + API (Core)
npm run test:api          # Core API suite only (7 tests; excludes @stretch)
npm run test:ui           # Core UI suite only (7 tests; excludes @stretch)
npm run test:stretch      # Stretch suite (8 tests, UI + API — see automation-opportunities.md)
npm run report             # open the last HTML report
```
Core (`test`, `test:ui`, `test:api`) always excludes `@stretch` via `--grep-invert`, so the reported count stays exactly 7 UI / 7 API regardless of how much Stretch coverage exists — this is deliberate, to keep the brief's 5-8-per-type cap unambiguous (see `ai-prompts/automation-and-debugging.md`, Entry 8). Reports are written to `PrismStructure/reports/html-report` (HTML) and `PrismStructure/reports/results.json` (JSON), per `playwright.config.ts`.

## Current execution status
- **Core UI suite: 7/7 passing.** Reached after 3 real debug cycles on an unblocked machine (this environment itself still can't launch a browser — a Windows Application Control policy blocks the downloaded Chromium binary, `browserType.launch: spawn UNKNOWN`, root-caused down to `Start-Process` itself refusing to run `chrome.exe`, Entry 4b). Run history: 4/7 -> 5/7 -> 6/7 -> **7/7**, each round fixing a different real, independently root-caused bug (a race condition in `purchase.spec.ts`, two missing navigation/confirmation steps, and out-of-stock-product selection on a live, non-static catalog) rather than the same issue lingering. Full trail: `ai-prompts/automation-and-debugging.md`, Entries 7, 9, 10.
- **Core API suite: 7/7 passing.** Executed and reports committed under `PrismStructure/reports/`.
- **Stretch API suite: 4/4 passing**, executed for real in this environment (API tests don't need a browser). One real finding along the way: two of the four were originally written expecting cart creation to require a bearer token; running them showed `POST /carts` actually succeeds anonymously (`201`, no token needed) — the tests were rewritten to assert that verified behavior instead of the wrong assumption. Full writeup: `ai-prompts/automation-and-debugging.md`, Entry 8.
- **Stretch UI suite: code-complete, not yet executed.** Run via `npm run test:stretch` to get real evidence for these 4.

## Manual test suite
`FunctionalTestCase.csv` — 8 cases, UI-layer, covering registration, login, cart, and checkout/invoice. 7 verified live and Passed; 1 (`TC-M-08`) is a documented **Failed** with a real defect (see `defect-report.md`), not a placeholder result.
