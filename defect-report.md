# Defect Report

## DEFECT-01: Successful checkout confirmation does not guarantee the invoice is retrievable for the user

**Found:** 2026-08-03, during manual exploratory verification of TC-M-08 (view invoice under My Invoices).
**Severity:** High — the invoice/order record is the core deliverable of AC2; a customer being told an order succeeded when it isn't actually on their account is a trust-breaking, billing-adjacent bug.
**Status:** Open / unresolved. Root cause narrowed but not conclusively identified (would need a captured network trace of the actual failing UI request, which this session's tooling couldn't reliably capture for this cross-origin API — see "What wasn't confirmed" below).

### Steps to reproduce
1. Register and log in as a new user via the UI.
2. Add a product to the cart, proceed through checkout, select Cash on Delivery.
3. Click "Confirm" once → "Payment was successful" is shown (order not placed yet — expected, per the documented double-confirm behavior).
4. Click "Confirm" again → **"Thanks for your order! Your invoice number is INV-2026000006."**
5. Navigate to My Invoices (either via in-app nav click, or a full page reload).

### Expected result
The invoice from step 4 (INV-2026000006) appears in the My Invoices list.

### Actual result
- My Invoices table renders with headers but **zero rows**, both immediately and after a 3-second wait.
- Called `GET https://api.practicesoftwaretesting.com/invoices` directly from the browser console, using the same logged-in user's own `auth-token` from `localStorage`. Response: `{"total": 0, "data": []}` — confirms via the real API, not just the UI, that this account genuinely has no invoices on record.

### Root-cause investigation
To isolate whether the API itself was broken, the entire flow was repeated using direct authenticated `fetch()` calls instead of the UI (register → login → create cart → add item → `POST /invoices`):
- `POST /invoices` → `201`, with a real `user_id` and `invoice_number` in the response.
- The immediately-following `GET /invoices` **did** return that invoice.

**Conclusion: the API layer works correctly end-to-end when called directly.** The defect is specific to the UI checkout flow's handling of the final invoice-creation call.

**Leading hypothesis (not fully confirmed):** the login JWT for this app has a short **5-minute expiry** (decoded from the token's `iat`/`exp` claims — see `exploratory-testing-notes.md`). The manual UI walkthrough (login → profile check → browse → cart → multi-step checkout, done click-by-click) took long enough that the token likely expired mid-checkout. The UI's second "Confirm" click still displayed a success message with a plausible invoice number even though the underlying request may have failed authentication — i.e., **the UI does not appear to surface an error when the final invoice-creation call fails**, which is arguably the more serious part of this defect (silent failure with a false-positive success message) independent of what specifically caused that call to fail.

### What wasn't confirmed
- The exact HTTP status/response of the failing UI-triggered `POST /invoices` call — the available browser network-inspection tooling did not capture cross-origin XHR/fetch calls made by the Angular app reliably (confirmed: a manual `fetch()` call to the same origin also wasn't logged by the tool, so this is a tooling limitation, not evidence the call didn't happen).
- Whether this reproduces on a *fast* checkout (e.g., automated, completed in seconds, well within the 5-minute token window) — this was out of scope for this session since the UI automation suite could not execute in this build environment at all (see `ai-prompts/automation-and-debugging.md`, Entry 4b), so the "does it still happen at automation speed" question is an open follow-up, not something to assume either way.

### Recommended next steps for a real QA cycle
1. Capture a HAR/network trace of a live UI checkout (e.g., via browser DevTools rather than this session's tooling) to see the actual status code of the failing `POST /invoices` call.
2. Test whether the defect reproduces when checkout is completed quickly (well under 5 minutes) — if it doesn't, this narrows the cause to token expiry specifically; if it still reproduces, the cause is elsewhere in the UI's checkout submission logic.
3. If token expiry is confirmed as the cause: the UI should either refresh the token transparently before the final submission, or surface a clear "session expired, please retry" error instead of showing a false success message.

### Test coverage
- `FunctionalTestCase.csv`, `TC-M-08` is marked **Failed** with this defect referenced, rather than a placeholder "Passed".
- `tests/api/invoice.spec.ts` (`API-06`) includes an explicit cross-check (`GET /invoices` must list the invoice just created) specifically because this defect showed that a `201` response is not sufficient evidence an invoice was actually persisted against the user — that cross-check passes when calling the API directly, isolating the defect to the UI layer.
- `tests/ui/purchase.spec.ts` (`UI-06`) deliberately only asserts the confirmation message/invoice-number pattern, not the My Invoices listing, so the automated suite doesn't encode a known-flaky assertion as if it were reliable.
