# API Test Scenarios

Standalone view of the API-layer test scenarios — selected from the full candidate bank in `ai-prompts/requirements-and-planning.md` (Entry 2), down-selected using the risk ranking (Entry 3), and implemented in `PrismStructure/tests/api/`. See `ai-prompts/test-design.md` for the selection reasoning.

## AC1 (API) — User Authentication & Cart Creation
| ID | Scenario | Tags | Type | Implemented in |
|---|---|---|---|---|
| API-01 | `POST /users/register` with a valid, unique payload | `@smoke` | Positive | `tests/api/auth.spec.ts` |
| API-02 | `POST /users/register` with a duplicate email → rejected | `@regression` | Negative | `tests/api/auth.spec.ts` |
| API-03 | `POST /users/login` with valid credentials → bearer token returned | `@smoke` | Positive | `tests/api/auth.spec.ts` |
| API-04 | `POST /users/login` with invalid credentials → `401` | `@regression` | Negative | `tests/api/auth.spec.ts` |

## AC2 (API) — Product Selection & Invoice Generation
| ID | Scenario | Tags | Type | Implemented in |
|---|---|---|---|---|
| API-05 | Create a cart, add a product, verify cart contents/total | `@smoke` | Positive | `tests/api/invoice.spec.ts` |
| API-06 | `POST /invoices` with valid billing fields + `cart_id` + `cash-on-delivery` → invoice created **and** independently retrievable via `GET /invoices` | `@smoke` | Positive | `tests/api/invoice.spec.ts` |
| API-07 | `POST /invoices` submitted twice for the same `cart_id` (duplicate submission) — API-side analogue of the UI double-confirm quirk | `@regression` | Edge | `tests/api/invoice.spec.ts` |

## Candidate scenarios not promoted into the capped suite
(Full bank in `ai-prompts/requirements-and-planning.md`, Entry 2 — kept here as a pointer, not duplicated, since the cap is 5-8 API cases total.)
- `POST /carts` with a missing/invalid/expired bearer token → `401`.
- Adding a cart item with an invalid `product_id` or `quantity <= 0` → validation error.

## Verified request/response shapes
Endpoints and payload shapes below were confirmed by calling the live API directly (not assumed from the brief's example alone) — see `exploratory-testing-notes.md` and `ai-prompts/automation-and-debugging.md` Entry 1 for the full investigation, including the `billing_city`/`billing_state`/`billing_country` consistency validation that a naive random-data approach fails against (`422`).

- `POST /users/register` — nested `address` object, **full country name** (e.g. `"Germany"`), not the ISO code the UI form uses.
- `POST /users/login` → `{ access_token }` (JWT, ~5 minute expiry).
- `POST /carts` (Bearer-authed) → `{ id }`.
- `POST /carts/{cartId}` with `{ product_id, quantity }` — adds/updates a line item (not `/carts/{id}/items`).
- `GET /carts/{cartId}` → cart with `cart_items[]`.
- `POST /invoices` (Bearer-authed — required, despite the brief's example payload not showing an auth header) → invoice with `invoice_number`, `user_id`, `total`.
- `GET /invoices` (Bearer-authed) → paginated list for the authenticated user.
