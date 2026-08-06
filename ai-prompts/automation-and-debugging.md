# AI Prompts – Automation and Debugging

(Prompts used for automation structure, assertions, and analyzing failures/logs.)

---

## Entry 1 — Ground the page objects/API client in real selectors and endpoints instead of guessing

**Prompt:**
> Before writing any Playwright locators or API calls, go inspect the live app's actual `data-test` attributes for the register, login, product, cart/checkout, account, profile and invoices pages, and the actual request/response shape of the register/login/cart/invoice API calls. Don't rely on memory of what this demo app "usually" looks like.

**AI Response Summary:** Used direct DOM inspection (`querySelectorAll('[data-test]')`) and live `fetch()` calls from the browser page context (not the Swagger examples) to confirm:
- The app uses `data-test`, not Playwright's default `data-testid` → set `testIdAttribute: 'data-test'` in `playwright.config.ts`.
- Exact selectors for register (`first-name`, `last-name`, `dob`, `country`, `postal_code`, `house_number`, `street`, `city`, `state`, `phone`, `email`, `password`, `register-submit`), login (`email`, `password`, `login-submit`), product listing/detail (`product-<ULID>`, `quantity`, `increase-quantity`, `add-to-cart`), cart/checkout stepper (`proceed-1`, guest fields + `guest-submit` + `proceed-2-guest`, `country`/`postal_code`/`house_number`/`street`/`proceed-3`, `payment-method`, `finish`), and account (`nav-my-profile`, `nav-my-invoices`, profile field ids).
- The cart quantity input has `min="1" max="99"` — used directly in the UI-07 boundary test instead of guessing a limit.
- Postcode → street/city/state auto-fill is **asynchronous** (~1s delay via a lookup call) — page objects wait on the `street` field instead of proceeding immediately, which would otherwise race the network call and intermittently fail.
- Real API endpoints and payload shapes, confirmed by calling them directly: `POST /users/register` (nested `address` object, **full country name** e.g. `"Germany"`, not the ISO code the UI form uses), `POST /users/login` → `{ access_token }`, `POST /carts` (Bearer-authed) → `{ id }`, `POST /carts/{cartId}` with `{ product_id, quantity }` to add an item (not `/carts/{id}/items` as the brief's high-level example implies), `GET /carts/{cartId}`, `POST /invoices` (Bearer-authed — **not anonymous**, despite the brief's example payload showing no auth header), `GET /invoices`.

**Debugging Outcome:** This caught two things that would otherwise have produced confidently-wrong automation: (1) the API's country field format differs from the UI's, which would have caused every API registration to silently use a mismatched format if copied from the UI test data; (2) invoice creation genuinely requires a bearer token — attempting it without one returns `401`, which the brief's example payload doesn't make obvious.

---

## Entry 2 — Manually reproduce the double-confirm quirk before automating it

**Prompt:**
> Before writing the assertion for the double-confirm checkout quirk, actually perform a real checkout on the live site (both as a guest and as a logged-in user) and record exactly what happens after the first Confirm click vs. the second, so the Playwright assertions match real behavior instead of the brief's one-line description of it.

**AI Response Summary:** Performed a real guest checkout and a real logged-in checkout against `practicesoftwaretesting.com`:
- **1st click of Confirm (`data-test="finish"`):** page shows the text "Payment was successful", but stays on the payment step and the Confirm button remains visible/enabled. No invoice is created yet.
- **2nd click:** page shows "Thanks for your order! Your invoice number is INV-2026000005" (guest) / "...INV-2026000006" (logged-in). This is the actual order-placement action.

This exact two-step behavior is what `CheckoutPage.clickConfirmOnce()` / `clickConfirmAgainToGenerateInvoice()` assert on, rather than a single generic "click twice and hope."

**Validation Notes:** Reproduced twice (guest + logged-in) to make sure it wasn't session-specific.

---

## Entry 3 — Defect found while verifying "My Invoices" for a logged-in checkout

**Prompt:**
> Now verify the logged-in checkout's invoice actually appears under My Invoices, the way TC-M-08/UI-06 expect. If it doesn't, don't just retry silently — figure out why before deciding how to automate the assertion.

**AI Response Summary — real defect found, not assumed:**
1. Completed a full logged-in checkout (double-confirm included) → UI showed "Thanks for your order! Your invoice number is INV-2026000006."
2. Navigated to My Invoices (`/account/invoices`, both via in-app nav click and a full page reload) — the table rendered with headers but **zero rows**, immediately and again after a 3-second wait.
3. Called `GET https://api.practicesoftwaretesting.com/invoices` directly from the browser console using the logged-in user's own `auth-token` from `localStorage` → `{"total": 0, "data": []}`. Confirmed via the real API, not just the UI, that this user genuinely has no invoices on record — the "successful" order from step 1 does not exist for this account.
4. To isolate whether the *API* itself was broken, repeated the whole flow (register → login → create cart → add item → create invoice) using direct authenticated `fetch()` calls instead of the UI. Result: `POST /invoices` returned `201` with a real `user_id` and `invoice_number`, and the immediately-following `GET /invoices` **did** return that invoice. So the API layer works correctly end-to-end when called directly.
5. Decoded the JWT from the earlier UI login (`iat`/`exp` claims) — the token's lifetime is only **5 minutes** (300s). The manual UI walkthrough (login → profile check → browse → cart → multi-step checkout, done click-by-click through the browser tool) took noticeably longer than that.

**Conclusion (documented as a found defect, not silently worked around):** The UI's checkout confirmation shows a success message with a plausible-looking invoice number even when the underlying `POST /invoices` call is failing/unauthenticated (most likely due to the short-lived token expiring mid-checkout, though the exact mechanism wasn't confirmed further — that would need a captured network trace of the failing UI request, which the available browser tooling couldn't reliably capture for this cross-origin API). Either way, the invoice show on screen and the invoice actually recorded for the user can disagree, and the UI gives no visible error when that happens.

**Automation impact:**
- `UI-06`'s Playwright test asserts only what was independently verified as reliable: the two-click behavior and the `INV-\d+` confirmation text pattern. Playwright automation runs the whole flow in seconds (not the several minutes the manual click-by-click browser exploration took), so it should not hit the same token-expiry window — but this is flagged as a watch-item, not assumed safe.
- `API-06` includes an explicit cross-check (`GET /invoices` after `POST /invoices` must list the new invoice) specifically because this defect showed that "the endpoint returned 201" is not sufficient evidence the invoice was really persisted against the user.
- This defect is logged here rather than silently patched into the test (e.g. by weakening the assertion) or silently ignored (by not checking at all) — both would hide a real bug from the report.

---

## Entry 4a — Fixing a real 422 on invoice generation (API-06/API-07)

**Prompt:**
> The API suite's invoice tests are failing with 422, not the expected 201. Don't guess — get the actual response body and figure out what's actually wrong before changing the assertion.

**AI Response Summary:** Reproduced the failure outside the test runner with a standalone script that logged the raw response body:
```
422 {"billing_country":["The billing_country does not match the entered address. The city does not belong to the selected country."]}
```
Root cause: `invoicePayload()` was generating `billing_city`/`billing_state` with Faker (random real-world-sounding names) while keeping `billing_country: 'TG'` fixed. The API validates that the three fields form a consistent (if fictional) combination against its own dataset — the brief's own example (`Hesselbury` / `Florida` / `TG`) happens to be a validated combination, but an arbitrary Faker city is not.

**Fix:** `testDataGenerator.ts`'s `invoicePayload()` now hard-codes `billing_city`/`billing_state` to the brief's verified-valid combination and only randomizes `billing_street` (confirmed free-text, not validated against the others). Re-ran the suite: `API-06` and `API-07` now pass (7/7 total, see Entry 5's execution evidence).

**Validation Notes:** This is exactly the kind of "AI-generated code confidently wrong in a way that looks right" the brief warns about — the original code was plausible (real-looking fake data) and passed a code read, but failed the moment it touched the real API. Root-caused with the actual response body rather than loosening the assertion to make the red go away.

---

## Entry 4b — UI suite cannot launch a browser in this execution environment

**Prompt:**
> Run the UI suite the same way you ran the API suite and capture real execution evidence.

**AI Response Summary — real environment failure, root-caused rather than worked around:**
1. `npx playwright test tests/ui` failed every test with `browserType.launch: spawn UNKNOWN`, even though `npx playwright install chromium` had completed successfully and both the regular Chrome-for-Testing and headless-shell binaries were confirmed present on disk.
2. Isolated whether it was test-runner-specific by calling `chromium.launch()` directly from a standalone Node script (bypassing Playwright's test runner entirely) — same `spawn UNKNOWN` error.
3. Tried forcing the full Chrome-for-Testing binary via `launchOptions.executablePath` instead of the default headless-shell binary — same error, ruling out a headless-shell-specific bug.
4. Went one layer lower: attempted to launch `chrome.exe` directly via PowerShell's `Start-Process`, completely outside Node/Playwright. This returned the real root cause: **"This command cannot be run due to the error: An Application Control policy has blocked this file."**

**Conclusion:** This is a Windows Application Control policy on the machine/session this automation was built in, blocking execution of the downloaded browser binary outright — not a bug in the page objects, config, or test code. It is not something to work around (bypassing an OS-level application control policy is out of scope for what an automated agent should attempt); it needs to be run in an environment where the policy allows Chromium to execute (a normal developer machine, Cursor's own terminal, or CI).

**Impact on submission:** The UI suite (`tests/ui/*.spec.ts`) is code-complete, built against selectors and behavior verified live on the real site (Entries 1–2), but has **not been executed by Playwright's own runner in this environment**, so no Playwright HTML report exists for it here. Every UI scenario it encodes *was* independently verified by hand against the real site during Entries 1–3 (real registration, login, profile check, cart, checkout with the double-confirm quirk, and the invoices defect) — but that is manual verification, not the automated execution evidence the brief asks for. This is flagged explicitly here rather than fabricating a report or silently shipping the suite unrun. See `readme.md` for how to run it in an unrestricted environment.

---

## Entry 5 — Scaffold decisions (Prism-style structure, config)

**Prompt:**
> Scaffold a Playwright + TypeScript project under PrismStructure/ with a Page-Object-Model layout (src/pages, src/api, src/utils) and separate UI/API Playwright projects, HTML+JSON reporting, and path aliases. The brief names "Prism Framework" but doesn't document it, so use a conventional, defensible POM structure and note that as an assumption.

**AI Response Summary:** Created `package.json`/`tsconfig.json`/`playwright.config.ts` with two Playwright projects (`ui-chromium` against the app origin, `api` against the API origin), `src/pages/*` page objects, `src/api/ToolshopApiClient.ts`, `src/utils/testDataGenerator.ts`, and `tests/ui` / `tests/api` spec folders with `@smoke`/`@regression` tags matching `test-design.md`.

**Validation Notes:** This structural assumption (documented already in `requirements-and-planning.md`, Entry 1) is called out again here at the point it actually gets built, per the "iterative development" instruction — not silently decided once and left unstated.

---

## Entry 6 — Self-review against the 5-8-test-case cap found a real overflow

**Prompt:**
> Evaluate this whole submission against the brief's own hard constraints, not just "does it look complete." Specifically check whether the UI suite actually reports 7 test cases the way test-design.md claims, or something else.

**AI Response Summary:** Counted actual `test()` call sites versus what Playwright would report at execution time. `registration.spec.ts`'s UI-02 was written as a `for` loop wrapping a single `test()` call — one call site in the source, but 5 separate named test cases at runtime (one per entry in `invalidPasswords`). Confirmed with `npx playwright test --list` (a dry run that doesn't need a browser, so it worked in this environment despite the Chromium launch being blocked): the UI suite was reporting **11 test cases**, not the 7 planned — over the brief's 5-8-per-type cap.

**Fix:** Rewrote UI-02 as a single `test()` that iterates over `invalidPasswords` *internally*, asserting each rule inside the same test case (with the specific rule name included in the assertion message, so a failure still says which rule broke) instead of registering 5 separate Playwright tests. Re-ran `npx playwright test --list`: **7 tests total**, matching `test-design.md`.

**Debugging Outcome:** This is the kind of gap that's invisible from reading the code (a `for` loop around a `test()` call looks completely reasonable) and only shows up by checking what the test *runner* actually reports — which is exactly what an evaluator counting rows in an execution report would see. Caught by deliberately auditing against the brief's literal constraint rather than trusting that "the code looks like it does 7 things."

---

## Entry 7 — Debugging 3 real UI failures from the first execution on an unblocked machine

**Prompt:**
> The UI suite ran on an unblocked machine: 4/7 passed, 3/7 failed (login-with-valid-credentials, E2E-purchase, cart-quantity-minimum). Don't guess — pull the actual screenshots and error output for each failure and find the real cause before changing anything.

**AI Response Summary:** Read `reports/results.json` for the exact error per failing test, and the `test-failed-1.png` screenshot each captured, rather than assuming "flaky" and just retrying.

1. **`login.spec.ts` (UI-04)** — screenshot shows the registration form fully and correctly filled, Register button ready, but `expect(page).toHaveURL(/auth\/login/)` timed out at 8s waiting for the redirect. This looks like genuine latency on the live public demo backend (a shared, rate-limited environment, not a dedicated test server) rather than a code defect.
2. **`purchase.spec.ts` (UI-06)** — a real code bug, not site slowness. Screenshot shows the *login* page displaying "Email is required" / "Password is required" — meaning `loginPage.login()` ran against empty fields. Root cause: `purchase.spec.ts` called `loginPage.login(...)` immediately after `registerPage.register(data)` with no wait for the register→login navigation to finish. `getByTestId('email')` matches an element on *both* pages, so a `.fill()` mid-navigation can land on the about-to-disappear register page and be lost, leaving the login form empty when submit is finally clicked. `login.spec.ts` happened to already have this wait; `purchase.spec.ts` didn't — that inconsistency is what exposed the bug.
3. **`purchase.spec.ts` (UI-07, cart quantity)** — screenshot shows a product detail page whose header/footer/"Related products" section rendered, but the entire main product content area (name, price, Add to Cart) never appeared in 30s. Points to either a slow/failed product-detail fetch on the live site, or the `ProductsPage` selector landing on a product whose detail page doesn't render reliably. Root cause not fully isolated (would need a captured network trace of that specific product fetch) — treated as a real, if intermittent, live-site reliability issue rather than dismissed.

**Fix (engineering choice, not just "increase timeouts"):**
- Added `RegisterPage.registerExpectingSuccess()` — the postcondition (successfully landed on `/auth/login`) now lives in the page object itself, not left to each call site to remember. Every caller that needs a successful registration (`registration.spec.ts` UI-01/UI-03's first call, `login.spec.ts`, `purchase.spec.ts`) now uses it; the negative-path callers (UI-02, UI-03's duplicate-email attempt) still use raw `register()` since they intentionally expect to stay on the register page. This directly fixes UI-06's root cause — it's structural, not timing.
- `ProductsPage.openFirstProduct()` now explicitly waits for the product name to be visible before proceeding, with one reload-and-retry for a transient failed fetch, instead of only waiting on Add to Cart later with no diagnostic. A genuinely broken product page now fails fast with a clear cause instead of a generic 30s timeout.
- Bumped `playwright.config.ts`'s default `expect.timeout` (8s → 12s) and test `timeout` (30s → 45s) to give real network round-trips against a live public site reasonable headroom, on top of (not instead of) the structural fixes above.

**Validation Notes:** Re-ran `npx playwright test --list` after the changes: still 7 UI tests (the fix didn't reintroduce the Entry 6 overflow). Re-ran the API suite: still 7/7 passing (config change didn't regress it). The actual UI suite still needs to be re-run on the unblocked machine to confirm these fixes hold — this environment still can't launch Chromium (Entry 4b), so this fix was validated by root-causing the real captured evidence, not by re-running it here.
