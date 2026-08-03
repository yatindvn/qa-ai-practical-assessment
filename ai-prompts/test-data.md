# AI Prompts – Test Data

(Prompts used to generate test data for UI + API.)

---

## Entry 1 — Registration & invoice data generator

**Prompt:**
> Build a test data generator (`src/utils/testDataGenerator.ts`) for the registration form and invoice payload. It must: (a) always produce a password that satisfies the site's stated policy (>=8 chars, upper+lower, >=1 number, >=1 special char), (b) provide a set of password values that each violate exactly one rule, for the negative test, (c) use a country/postcode combo that's confirmed to trigger the site's address auto-fill, (d) build an invoice payload matching the example in the brief (billing fields + cart_id + payment_method + payment_details).

**AI Response Summary:** Generated `validRegistration()` (faker-based name/phone, fixed DOB, Germany + postcode `10115`), `validPassword()` (deterministic policy-safe pattern), `invalidPasswords` map (one entry per rule violated), `uniqueEmail()` (timestamp + random suffix to avoid collisions across repeated runs), and `invoicePayload(cartId, overrides)` mirroring the brief's example body.

**Validation Notes:** The DE postcode `10115` + auto-fill behavior was verified directly in the browser before being hard-coded here (see `requirements-and-planning.md`, Entry 4, and `automation-and-debugging.md`) — confirmed the site returns a deterministic (if fictional) street/city/state for that postcode rather than doing real geocoding, so tests can assert on the auto-filled values without flakiness. `uniqueEmail()` uses `Date.now()` rather than a fixed constant specifically because the site rejects duplicate-email registration (candidate scenario UI-03/TC-M-03) — every other test that just needs *a* valid new user must not collide with that one.
