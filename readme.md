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
npm run test:smoke        # all @smoke tests, UI + API
npm run test:regression   # all @regression tests, UI + API
npm run test:api          # API suite only
npm run test:ui           # UI suite only
npm run report             # open the last HTML report
```
Reports are written to `PrismStructure/reports/html-report` (HTML) and `PrismStructure/reports/results.json` (JSON), per `playwright.config.ts`.

## Current execution status
- **API suite: 7/7 passing.** Executed and reports committed under `PrismStructure/reports/`.
- **UI suite: code-complete, not executed in this environment.** The machine this project was built on blocks launching the downloaded Chromium binary via a Windows Application Control policy (`browserType.launch: spawn UNKNOWN`, root-caused down to `Start-Process` itself refusing to run `chrome.exe` — see `ai-prompts/automation-and-debugging.md`, Entry 4b for the full investigation). This is a machine/policy restriction, not a code issue — the same `npm run test:ui` should run normally on a developer machine or in CI. Every UI scenario the suite encodes was independently verified by hand against the live site first (see `exploratory-testing-notes.md` and `ai-prompts/automation-and-debugging.md` Entries 2-3) before being automated, including the real defect in `defect-report.md`.

## Manual test suite
`FunctionalTestCase.csv` — 8 cases, UI-layer, covering registration, login, cart, and checkout/invoice. 7 verified live and Passed; 1 (`TC-M-08`) is a documented **Failed** with a real defect (see `defect-report.md`), not a placeholder result.
