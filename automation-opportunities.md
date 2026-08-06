# Automation Opportunities

Assessment of what's already automated, what's a good candidate for automation but wasn't in scope for this exercise's capped suite, and what's better left manual.

## Automated in this exercise

### Core (capped at 5-8 per type, per the brief)
- UI: registration (valid + 4 password-policy negatives + duplicate email), login (valid + invalid), full E2E purchase with the double-confirm quirk, cart quantity boundary — `PrismStructure/tests/ui/`.
- API: register/login (valid + negative), cart creation + item add + contents verification, invoice generation, duplicate invoice submission — `PrismStructure/tests/api/`.

### Stretch (outside the cap, `@stretch` tag, `npm run test:stretch`)
Promoted from the "good candidates" list below once there was room to build them without risking the Core cap (see `ai-prompts/automation-and-debugging.md`, Entry 8):
- Product search, malformed-postcode edge case, cross-session cart persistence, out-of-stock handling — `tests/ui/stretch.spec.ts`.
- Anonymous/guest cart creation and item-adding (verified live: no bearer token required — this corrected a wrong initial assumption, see Entry 8), invalid `product_id`, zero-quantity rejection — `tests/api/stretch.spec.ts`.

## Still good candidates, not yet built
These remain in the Entry 2 candidate bank (`ai-prompts/requirements-and-planning.md`) without a corresponding test yet:
- **Cross-country postcode formats** beyond the single DE postcode used throughout — the malformed-format edge case is now covered (Stretch), but different valid formats (US ZIP, UK postcode, etc.) aren't.
- **Full product catalog flows** beyond search and out-of-stock: category filters, sort, pagination, favorites/compare.
- **The invoice-under-My-Invoices defect (`defect-report.md`, DEFECT-01)**, once root-caused: a regression test that fails loudly if the checkout confirmation and the actual persisted invoice ever disagree again. Not automatable *yet* because the root cause (likely token-expiry-related) isn't confirmed — an automated assertion here today would either pass for the wrong reason (fast execution outruns the 5-minute token) or need to hard-code a delay to force the failure, neither of which is good regression coverage.
- **API contract/schema checks** on `/invoices`, `/carts`, `/users` responses (e.g. via a JSON schema or Zod validator) — would catch breaking API changes independent of the specific assertions in `invoice.spec.ts`/`auth.spec.ts`.

## Deliberately left manual
- **Visual/layout review** (spacing, responsive breakpoints) — no visual regression tooling was in scope for this exercise; would need a dedicated tool (Percy, Playwright's own screenshot comparison) rather than the functional assertions used here.
- **First-time exploratory passes on new features** — exploratory testing (see `exploratory-testing-notes.md`) is what *found* DEFECT-01 in the first place; a scripted test would only have encoded the assumption that "Confirm twice → invoice appears," not questioned it. Exploratory testing stays valuable precisely because it isn't automated.
