# AI Prompts – Requirements and Planning

(Record of prompts and responses used for understanding the Toolshop flow, identifying risks, and drafting the test plan. Each entry follows the doc's template: Prompt / AI Response (short summary) / Validation Notes.)

---

## Entry 1 — Decode the assessment brief

**Prompt:**
> I'm attaching a QA AI Capability Exercise brief for practicesoftwaretesting.com. Read it and extract:
> 1. The exact required deliverables and file/folder structure
> 2. Hard constraints (test case limits, required tools, commit style, deadline)
> 3. What's Core vs Stretch, and how each is weighted
> 4. Any ambiguous or contradictory instructions I should flag as assumptions
> Output as a structured checklist I can use to track completeness.

**AI Response (short summary):**

**1. Required deliverables / folder structure**
```
qa-ai-practical-assessment/
├── FunctionalTestCase.csv
├── PrismStructure/            (Playwright — API + UI + execution report)
├── project-info.md
├── readme.md
├── ai-prompts/
│   ├── requirements-and-planning.md
│   ├── test-design.md
│   ├── test-data.md
│   ├── automation-and-debugging.md
│   └── documentation-and-summary.md
└── .cursor/                   (Rules, Skills, agent/mcp — optional)
```
Also required (content, not files): requirement & risk analysis, manual test suite, test data strategy doc, execution evidence (logs/reports/screenshots), README with setup + run instructions, full prompt history.

**2. Hard constraints**
- Tooling: Playwright ("Prism Framework" structure), driven via Cursor AI; must stay within Cursor's **monthly usage limit** (use Auto/lighter models for planning, Sonnet only for code/debugging).
- **Cap: no more than 5–8 test cases per type** (manual, UI, API) — this includes `@Smoke` and `@regression` combined, i.e. a *hard ceiling*, not per-AC.
- **Execution reports must show every included test case as "Passed."**
- **Git**: public repo, **iterative commits** — explicitly *not* a single commit.
- App quirk that must shape design: **Confirm must be clicked twice** to generate an invoice in the UI.
- Timeline: self-paced, ~1 week; Core scoped for **5–10 focused hours**; submission date is set externally ("agreed submission date" — not stated in the doc itself).
- Weighting: **Part A (AI Workflow Foundation) = 30%**, **Part B (QA Mini Project) = 70%**.

**3. Core vs Stretch**
- The doc defines **Core Acceptance Criteria** explicitly (8 bullet points: scope/traceability, valid+invalid transitions, UI+API CRUD-style coverage, planned test data, ≥1 automation suite runnable from README, prompt history showing thoughtful use).
- **"Stretch" is named but never given its own content list.** The only guidance is: *"A clean, well-documented Core alone is a strong result. Both Core and Stretch are looked at the same way; the difference is the depth of evidence you show."* → Stretch reads as *more depth/evidence on the same Core scope*, not a separate feature set. No separate weight is given to Stretch beyond the Part A/B 30/70 split.

**4. Ambiguities / contradictions flagged as assumptions**
- **Scope vs cap tension**: brief says "include all the possible flows that can be tested," but also caps at 5–8 test cases per type. Read as: build a *wide candidate scenario bank* first, then risk-prioritize down to 5–8 per type for the actual automated/manual suite.
- The AC1/AC2 examples for UI and API are explicitly labeled **"High Level Flow example"** / **"suggestion to use like ACs"** — illustrative, not the literal exhaustive scope.
- **"Prism Framework"** is referenced as the required Playwright structure but not documented in this brief — treating it as "a specific folder/pattern convention to follow for Playwright API+UI+reporting," to be confirmed against any reference repo/template if provided; otherwise a reasonable Page-Object + fixtures + reporter structure will be used and documented as an assumption.
- Numbering in the `project-info.md` spec repeats "2." twice and the top-level requirements list skips from 8 to 10 — read as a doc formatting artifact, not a hidden missing requirement.
- "All test cases should be Passed" is interpreted as: **negative/edge-case tests pass when the system correctly produces the expected error/rejection** — not that only happy-path cases are allowed.
- No literal deadline is in the doc ("agreed submission date" is external) — needs to be confirmed with whoever assigned the exercise.

**Validation Notes:** Cross-checked the checklist against the doc's own "What Counts as Complete" and "Submission Templates" sections page-by-page; all 12 "Common QA Requirements" items and all 8 "Core Acceptance Criteria" items are accounted for above. Flagged ambiguities are the ones that would change scope or file structure if guessed wrong.

---

## Entry 2 — Turn the ACs into a real test scope

**Prompt:**
> Here are the high-level acceptance criteria for the Toolshop app: AC1 (UI) User registration & login, AC2 (UI) End-to-end purchase (browse → cart → Cash on Delivery checkout → invoice, confirm clicked twice), AC1 (API) register/login/token/cart, AC2 (API) products/cart/invoice generation. Break each AC into 5-8 numbered, testable scenarios. For each specify UI or API, Smoke or Regression, positive/negative/edge, and flag any scenario affected by the double-confirm quirk.

**AI Response (short summary):** Candidate scenario bank (to be risk-prioritized down to the 5–8-per-type cap in `test-design.md`, per Entry 1's scope-vs-cap resolution). Grounded against the live site's actual registration form fields and password policy (First/Last name, DOB, Country → Postcode + House number with **auto-filled Street/City/State**, Phone, Email, Password with min 8 chars, upper+lowercase, ≥1 number, ≥1 special char) and the Swagger resource groups at `api.practicesoftwaretesting.com` (User, Cart, Product, Invoice, Payment, Postcode).

**AC1 (UI) — Registration & Login**
| # | Scenario | Type | Tier | Notes |
|---|---|---|---|---|
| 1 | Register with all valid fields, unique email | UI | Smoke / Positive | |
| 2 | Register with password violating policy (short / no uppercase / no number / no special char) | UI | Regression / Negative | 4 sub-cases collapse to 1 parameterized test |
| 3 | Register with an already-registered email | UI | Regression / Negative | |
| 4 | Register with postcode that auto-fills street/city/state — verify autofill is correct | UI | Regression / Edge | |
| 5 | Log in with valid registered credentials | UI | Smoke / Positive | |
| 6 | Log in with invalid password / non-existent email | UI | Regression / Negative | |
| 7 | View profile after login, verify it matches registration data | UI | Regression / Positive | |

**AC2 (UI) — End-to-end purchase**
| # | Scenario | Type | Tier | Notes |
|---|---|---|---|---|
| 1 | Browse products, view product detail | UI | Smoke / Positive | |
| 2 | Add product to cart, verify cart count/total | UI | Smoke / Positive | |
| 3 | Add multiple products, update quantity of one line item | UI | Regression / Positive | |
| 4 | Set cart quantity to 0 / negative / above available stock | UI | Regression / Edge | |
| 5 | Checkout with Cash on Delivery, click Confirm **once** | UI | Smoke / Negative-ish | **Double-confirm quirk** — must assert invoice is *not yet* generated, not treat this as a bug |
| 6 | Checkout with Cash on Delivery, click Confirm **twice** | UI | Smoke / Positive | **Double-confirm quirk** — the actual success path |
| 7 | Attempt checkout with an empty cart | UI | Regression / Edge | |
| 8 | Open the generated invoice under My Invoices, verify line items/totals/billing address | UI | Regression / Positive | Depends on #6 |

**AC1 (API) — Auth & Cart Creation**
| # | Scenario | Type | Tier | Notes |
|---|---|---|---|---|
| 1 | POST /users/register, valid unique payload | API | Smoke / Positive | |
| 2 | POST /users/register, missing required field / bad email format | API | Regression / Negative | |
| 3 | POST /users/register, duplicate email | API | Regression / Negative | |
| 4 | POST /users/login, valid credentials → bearer token | API | Smoke / Positive | |
| 5 | POST /users/login, invalid credentials | API | Regression / Negative | |
| 6 | POST /carts with valid token | API | Smoke / Positive | |
| 7 | POST /carts with missing/invalid/expired token | API | Regression / Negative | |

**AC2 (API) — Product Selection & Invoice Generation**
| # | Scenario | Type | Tier | Notes |
|---|---|---|---|---|
| 1 | GET /products | API | Smoke / Positive | |
| 2 | Add product to cart, verify cart contents/total | API | Smoke / Positive | |
| 3 | Add item with invalid product_id or qty ≤ 0 | API | Regression / Negative | |
| 4 | POST /invoices with valid billing fields + cart_id + `cash-on-delivery` | API | Smoke / Positive | |
| 5 | POST /invoices missing a required billing field / invalid cart_id | API | Regression / Negative | |
| 6 | POST /invoices **twice for the same cart_id** (duplicate submission) | API | Regression / Edge | **API-side analogue of the UI double-confirm quirk** — high-value scenario |

**Validation Notes:** Field names and password rules were verified directly against the live registration page (not assumed from memory); Swagger resource groups confirmed the API surface matches the brief's example. Total candidate bank (~28 scenarios) intentionally exceeds the 5–8-per-type cap — final selection happens in `test-design.md` using the Entry 3 risk ranking.

---

## Entry 3 — Risk analysis

**Prompt:**
> Given the flows above, list the top risk areas a senior QA would prioritize, with reasoning: data validation gaps, state/race conditions (e.g. double-click on Confirm), auth/token edge cases, cart quantity boundaries, and invoice generation failure modes. Rank them by likelihood × impact.

**AI Response (short summary):**

| Rank | Risk area | Likelihood | Impact | Reasoning |
|---|---|---|---|---|
| 1 | Invoice double-confirm / duplicate-submission behavior (UI **and** API) | High | High | Explicitly called out by the brief as required behavior; classic ecommerce bug class (double order / double charge). Directly testable via scenarios UI-AC2-#5/#6 and API-AC2-#6. |
| 2 | Cart quantity boundaries (zero, negative, above stock, add-vs-update semantics) | Med-High | High | Wrong totals or silent over-sell directly corrupt the checkout/invoice numbers that AC2 depends on. |
| 3 | Auth/token edge cases (missing/expired/invalid bearer token, cart ownership isolation between users) | Medium | High | Security/data-isolation failures are high severity even if less frequently hit in happy-path testing. |
| 4 | Registration data validation gaps (password policy, duplicate email, postcode autofill correctness, DOB handling) | High | Medium | Large number of field/rule permutations = high chance of a gap, but a bad registration is recoverable and doesn't corrupt other users' data. |
| 5 | Invoice generation failure modes (missing billing fields, invalid cart_id, country/postal format edge cases like the sample payload's `"TG"` country + `"1234AA"` postcode) | Medium | High | Invoice generation is the literal success criterion for AC2 on both UI and API — a silent failure here fails the exercise's own acceptance bar. |
| 6 | Cross-flow state consistency (cart persists across session/login, UI total matches API-computed total) | Low-Med | Medium | Real but less likely to surface within the exercise's narrow scope (single session, no multi-tab/multi-device testing required). |

**Validation Notes:** Ranking used to drive which of the ~28 candidate scenarios from Entry 2 make the final 5–8-per-type cut in `test-design.md` — risks 1–3 get guaranteed coverage; risks 4–5 get at least one representative case each; risk 6 is documented as a known gap/out-of-scope rather than force-fit into the capped suite.

---

## Entry 4 — Live site/API exploration

**Prompt:**
> I'm pasting the checkout/registration page structure and the API's Swagger documentation. Identify every field with validation rules, every state transition, and the negative/edge cases implied. List them as candidate test cases, not full scripts yet.

**AI Response (short summary):** Performed directly against the live app (`practicesoftwaretesting.com/auth/register` and `api.practicesoftwaretesting.com` Swagger UI) instead of pasted HTML.

- Registration form fields confirmed: First name, Last name, Date of Birth, Country (dropdown), Postcode, House number (Street/City/State **auto-filled** from these — an edge case in itself: what happens with a postcode that doesn't resolve to a real address), Phone, Email, Password.
- Password policy is explicit and displayed on-page: **≥8 chars, upper+lowercase, ≥1 number, ≥1 special char**, with a live strength meter (Weak → Excellent) — gives 4 clean negative sub-cases plus a strength-meter UI assertion if wanted.
- Swagger UI confirms top-level resource groups: **Brand, Cart, Category, Contact, Favorite, Image, Invoice, Payment, Postcode, Product, Product Spec, Report, TOTP, User** — matches the brief's example endpoints (`/users`, `/carts`, `/invoices`, `/products`) and shows extra surface (Report, TOTP, Favorite) that is explicitly **out of scope** per the brief's "test a flow/component" instruction, not the whole API.
- These findings are already folded into the Entry 2 scenario tables (autofill edge case, 4 password sub-cases, invoice payload field checks).

**Validation Notes:** Read directly off the rendered page (`get_page_text`), not guessed from general knowledge of the demo app — so field names/labels are exact. Did not expand every Swagger endpoint (time-boxed); request/response schemas for the specific endpoints used (register, login, carts, invoices) will be pulled during automation design in `automation-and-debugging.md` when writing the actual API client/fixtures.

---

## Entry 5 — What makes a submission fail despite passing tests

**Prompt:**
> Re-read the brief and tell me what would make a submission fail the 70% threshold even if all tests pass — i.e. what "thoughtful AI use" vs "copy-paste of unreviewed output" looks like in practice for this exercise.

**AI Response (short summary):**
- **No traceability**: test cases/scenarios not mapped back to an AC or a stated risk — the brief explicitly asks for a "traceable mapping."
- **Prompt history that's just final polished prompts** with no visible iteration, correction, or validation notes — reads as reconstructed-after-the-fact, not real usage. The brief specifically warns against "copy-paste of unreviewed outputs."
- **Automation that passes trivially**: negative-path tests that don't actually assert the expected rejection/error (they'd "pass" even if the app silently accepted bad data).
- **Mishandling the double-confirm quirk**: automating a single Confirm click and either getting a flaky test or never actually verifying invoice generation.
- **A single squashed git commit** instead of iterative commits — this is an explicit hard requirement, not a style preference.
- **Missing or thin risk analysis** — the brief requires requirement *and* risk analysis as a named deliverable, separate from the test cases themselves.
- **`project-info.md` that's a tool list, not a workflow explanation** — the evaluated dimension is *how* context was given and *how* AI output was validated/refined, not just which tools were used.
- **Over-building automation surface area at the expense of documentation/reflection artifacts** — the brief explicitly says not to do this; a smaller, well-documented Core beats a large superficial one.
- **Missing execution evidence** (no screenshots/reports/logs) — explicit requirement, and all included test cases must show "Passed" in the report.
- **Not matching the required stack** (Playwright + Cursor + Prism-style structure).

**Validation Notes:** Cross-referenced against the brief's own "What Good Looks Like" section and the 8 Core Acceptance Criteria — every point above maps to a specific line in the doc rather than being generic QA advice.
