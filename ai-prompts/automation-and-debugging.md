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
