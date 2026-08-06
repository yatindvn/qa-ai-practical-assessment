# AI Prompts – Test Design

(Prompts used to generate or refine test scenarios and test cases for UI + API.)

---

## Entry 1 — Down-select the candidate bank into the capped suite

**Prompt:**
> From the ~28-scenario candidate bank in requirements-and-planning.md (Entry 2) and the risk ranking (Entry 3), select the final test suite: no more than 5-8 manual cases, 5-8 UI-automation cases, and 5-8 API-automation cases. Guarantee coverage of risk #1 (double-confirm/duplicate invoice) and risk #3 (auth/token negative case) in both UI and API. Map each selected case to its AC and to the "create/list/view/update/error handling" state-machine categories the Core Acceptance Criteria ask for.

**AI Response (short summary):**

Selection rule applied: every case must trace to an AC (traceability requirement) and to a risk from Entry 3; scenarios that only covered risk #6 (cross-flow state consistency, ranked lowest) were dropped and documented below as a known, deliberate gap rather than silently omitted.

### Manual suite (8) — `FunctionalTestCase.csv`
| ID | Scenario | AC | Tier | Type | State-machine mapping |
|---|---|---|---|---|---|
| TC-M-01 | Register with valid details | UI-AC1 | Smoke | Positive | Create |
| TC-M-02 | Register with policy-violating password | UI-AC1 | Regression | Negative | Error handling |
| TC-M-03 | Register with duplicate email | UI-AC1 | Regression | Negative | Error handling |
| TC-M-04 | Login with valid credentials, verify profile | UI-AC1 | Smoke | Positive | View |
| TC-M-05 | Login with invalid credentials | UI-AC1 | Regression | Negative | Error handling |
| TC-M-06 | Add products to cart, update quantity, verify totals | UI-AC2 | Regression | Positive | Create / Update |
| TC-M-07 | Checkout COD, confirm once then twice — invoice only generates on 2nd click | UI-AC2 | Smoke | Positive/Edge | Update (state transition) — **double-confirm quirk** |
| TC-M-08 | Open generated invoice under My Invoices, verify details | UI-AC2 | Regression | Positive | View |

### UI automation suite (7) — Playwright, `PrismStructure/tests/ui`
| ID | Scenario | Tags | AC |
|---|---|---|---|
| UI-01 | Register new user with valid data | @smoke | UI-AC1 |
| UI-02 | Register with invalid password — one test case, iterating internally over too-short / no-upper / no-lower / no-number / no-special-char (not a Playwright-level parameterized loop, which would report 5 separate test cases and blow the per-type cap) | @regression | UI-AC1 |
| UI-03 | Register with duplicate email | @regression | UI-AC1 |
| UI-04 | Login with valid credentials, verify profile data | @smoke | UI-AC1 |
| UI-05 | Login with invalid credentials shows error, no session | @regression | UI-AC1 |
| UI-06 | E2E purchase: browse → add to cart → update qty → checkout COD → confirm **twice** → invoice visible under My Invoices | @smoke | UI-AC2 — **double-confirm quirk** |
| UI-07 | Cart quantity edge case (0 / invalid) is rejected or handled, not silently accepted | @regression | UI-AC2 |

### API automation suite (7) — Playwright `request` fixture, `PrismStructure/tests/api`
| ID | Scenario | Tags | AC |
|---|---|---|---|
| API-01 | POST /users/register, valid payload | @smoke | API-AC1 |
| API-02 | POST /users/register, duplicate email → 4xx | @regression | API-AC1 |
| API-03 | POST /users/login, valid credentials → bearer token | @smoke | API-AC1 |
| API-04 | POST /users/login, invalid credentials → 401 | @regression | API-AC1 |
| API-05 | POST /carts + add product, verify cart contents/total | @smoke | API-AC2 |
| API-06 | POST /invoices, valid billing + cart_id + cash-on-delivery → success | @smoke | API-AC2 |
| API-07 | POST /invoices twice for the same cart_id (duplicate submission) — API analogue of the double-confirm quirk | @regression | API-AC2 — **risk #1** |

**Deliberately out of scope (documented, not silently dropped):**
- Postcode-autofill edge case and cross-session cart persistence (risk #6) — kept only in the Entry 2 candidate bank, not promoted into the capped suite, since they ranked lowest in Entry 3 and the suite is already at the 5-8 cap per type.
- Swagger resource groups not mentioned in the brief's example (Report, TOTP, Favorite, Brand) — out of scope per "test a flow/component," not the whole API surface.

**Validation Notes:** Checked that every one of the brief's 8 Core Acceptance Criteria bullets has at least one covering case: scope/objectives (all), traceable mapping (AC column above), valid+invalid transitions (double-confirm pair UI-06/API-07, login pairs), create/list/view/update/error-handling (mapped column above for manual suite; same categories apply 1:1 to the UI/API automation IDs), planned test data (see `test-data.md`), ≥1 automation suite runnable from README (both UI and API suites will be), prompt history (this file + `requirements-and-planning.md`).

---

## Entry 2 — Stretch tier: extra coverage without reopening the 5-8 cap

**Prompt:** (see `automation-and-debugging.md`, Entry 8, for the full back-and-forth) — add more test coverage, but as a clearly separate `@stretch`-tagged tier outside the capped Core suite, pulling from the scenarios already identified in Entry 1 as "deliberately out of scope."

### UI Stretch (4) — `PrismStructure/tests/ui/stretch.spec.ts`
| ID | Scenario | AC |
|---|---|---|
| STRETCH-UI-01 | Product search returns matching results | UI-AC2 |
| STRETCH-UI-02 | Malformed postcode does not resolve to a fake address (edge case on the auto-fill feature) | UI-AC1 |
| STRETCH-UI-03 | Cart contents persist across sign-out and sign-in | UI-AC2 |
| STRETCH-UI-04 | An out-of-stock product cannot be added to the cart (self-skips if no OOS product exists in the current catalog) | UI-AC2 |

### API Stretch (4) — `PrismStructure/tests/api/stretch.spec.ts`
| ID | Scenario | AC |
|---|---|---|
| STRETCH-API-01 | `POST /carts` succeeds without a bearer token — anonymous/guest cart creation | API-AC1 |
| STRETCH-API-02 | Items can be added to an anonymous cart without a bearer token | API-AC1 |
| STRETCH-API-03 | Adding a cart item with an invalid `product_id` is rejected | API-AC2 |
| STRETCH-API-04 | Adding a cart item with quantity `0` is rejected, not silently accepted | API-AC2 |

**Isolation from Core:** `@stretch` is not `@smoke` or `@regression`, so `npm run test:smoke`/`test:regression` never include it. `npm run test:ui`/`test:api`/`test` (the default) explicitly run `--grep-invert @stretch`, so Core stays at exactly 7 UI / 7 API regardless of how many Stretch tests exist. Run Stretch explicitly via `npm run test:stretch`.

**Validation Notes:** STRETCH-API-01 and -02 were originally written asserting `401` (assumed cart creation required auth, by analogy with `/invoices`). Running them for real returned `201`/`200` — cart creation and item-adding both work fully anonymously. Rewrote both to assert the actual verified behavior instead of forcing the wrong assumption to pass. Full root-cause note in `automation-and-debugging.md`, Entry 8.
