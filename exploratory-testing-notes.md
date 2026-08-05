# Exploratory Testing Notes

Notes from hands-on exploration of the live app and API, done before/alongside writing formal test cases, to ground test design in real behavior rather than assumption. (Full prompt-by-prompt trail is in `ai-prompts/requirements-and-planning.md` Entry 4 and `ai-prompts/automation-and-debugging.md` Entries 1-3 — this file is the QA-readable summary.)

## Registration form (`/auth/register`)
- Fields: First name, Last name, Date of Birth, Country, Postcode, House number, Phone, Email, Password.
- **Street/City/State auto-fill from Postcode + House number** — and it's asynchronous (~1s lookup delay). Automation must wait for it, not race it.
- Auto-fill is **not real geocoding**: the same postcode (`10115`, a real Berlin postcode) always returns the same fictional address (`Eckertplatz`, `Heidenheim an der Brenz`, `Rheinland-Pfalz`) regardless of the country selected. This is a deterministic fake dataset, not a live address service — safe to assert on exactly, but not meaningful as "real" address validation.
- Password policy is shown live on the page: ≥8 chars, upper+lowercase, ≥1 number, ≥1 special char, with a strength meter (Weak → Excellent).
- Duplicate email registration is blocked (stays on `/auth/register`, no redirect).

## Login (`/auth/login`)
- Invalid credentials show the exact text **"Invalid email or password"** and stay on the login page. No token is written to `localStorage`.

## Cart / Checkout (`/checkout`)
- Cart and checkout live on a single stepper page: CART(1) → SIGN IN(2) → BILLING ADDRESS(3) → PAYMENT(4).
- Quantity input has `min="1" max="99"` (HTML attribute) — a real, enforced boundary, not a guess.
- Changing quantity correctly recalculates line price and cart total (verified: 2 → 5 units of a $14.15 item updated the total to $70.75).
- Guest checkout is supported (`guest-email`/`guest-first-name`/`guest-last-name`) as an alternative to signing in.
- **The double-confirm quirk, reproduced directly:**
  - 1st click of "Confirm": shows "Payment was successful" text, but stays on the payment step — no order is placed yet.
  - 2nd click: shows "Thanks for your order! Your invoice number is INV-xxxxxxxxxx." — this is the actual order-placement action.
  - Reproduced identically for both a guest checkout (INV-2026000005) and a logged-in checkout (INV-2026000006).

## Account (`/account`, logged in)
- Profile page (`/account/profile`) correctly reflects the exact data entered at registration (verified field-by-field).
- **My Invoices (`/account/invoices`) did not show the invoice from a just-completed logged-in checkout** — see `defect-report.md` for the full investigation.

## API (`api.practicesoftwaretesting.com`)
- Real endpoints confirmed by calling them directly (not just read from Swagger): `POST /users/register` (nested `address` object, **full country name** e.g. `"Germany"` — different from the UI form's ISO code), `POST /users/login` → `{ access_token }`, `POST /carts` → `{ id }`, `POST /carts/{cartId}` with `{ product_id, quantity }` to add an item, `GET /carts/{cartId}`, `POST /invoices` (requires a bearer token — the brief's example payload doesn't show this), `GET /invoices`.
- Invoice creation validates that `billing_city`/`billing_state` actually belong to `billing_country` against the API's own fake-geo dataset — a randomized city/state for country `"TG"` was rejected with `422`, while the brief's own example combo (`Hesselbury`/`Florida`/`TG`) was accepted. This directly shaped `testDataGenerator.ts`'s `invoicePayload()`.
- Decoded a real login JWT: **5-minute expiry** (`exp - iat = 300s`). Relevant to both the API test design (don't hold a token across a long-running flow) and the invoice defect below.
