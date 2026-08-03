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
| UI-02 | Register with invalid password (parameterized: too short / no upper / no number / no special char) | @regression | UI-AC1 |
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
