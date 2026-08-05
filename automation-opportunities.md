# Automation Opportunities

Assessment of what's already automated, what's a good candidate for automation but wasn't in scope for this exercise's capped suite, and what's better left manual.

## Automated in this exercise
- UI: registration (valid + 4 password-policy negatives + duplicate email), login (valid + invalid), full E2E purchase with the double-confirm quirk, cart quantity boundary — `PrismStructure/tests/ui/`.
- API: register/login (valid + negative), cart creation + item add + contents verification, invoice generation, duplicate invoice submission — `PrismStructure/tests/api/`.

## Good candidates for automation beyond this exercise's 5-8-per-type cap
These were identified in the Entry 2 candidate bank (`ai-prompts/requirements-and-planning.md`) but deliberately not promoted into the capped suite — listed here so the reason ("didn't fit the cap," not "not worth automating") is explicit:
- **Postcode-autofill edge cases** (postcode that doesn't resolve, cross-country postcode formats) — good regression coverage for a real bug class (bad address data reaching checkout), currently only covered as a documented assumption in `exploratory-testing-notes.md`.
- **Cross-session cart persistence** (add to cart, log out, log back in, cart still has items) — a common real-world regression source after auth changes.
- **Full product catalog flows**: search, category filters, sort, pagination, out-of-stock handling, favorites/compare — the brief scoped this exercise to a single flow/component, but these are natural next additions to the same page-object structure.
- **The invoice-under-My-Invoices defect (`defect-report.md`, DEFECT-01)**, once root-caused: a regression test that fails loudly if the checkout confirmation and the actual persisted invoice ever disagree again. Not automatable *yet* because the root cause (likely token-expiry-related) isn't confirmed — an automated assertion here today would either pass for the wrong reason (fast execution outruns the 5-minute token) or need to hard-code a delay to force the failure, neither of which is good regression coverage.
- **API contract/schema checks** on `/invoices`, `/carts`, `/users` responses (e.g. via a JSON schema or Zod validator) — would catch breaking API changes independent of the specific assertions in `invoice.spec.ts`/`auth.spec.ts`.

## Deliberately left manual
- **Visual/layout review** (spacing, responsive breakpoints) — no visual regression tooling was in scope for this exercise; would need a dedicated tool (Percy, Playwright's own screenshot comparison) rather than the functional assertions used here.
- **First-time exploratory passes on new features** — exploratory testing (see `exploratory-testing-notes.md`) is what *found* DEFECT-01 in the first place; a scripted test would only have encoded the assumption that "Confirm twice → invoice appears," not questioned it. Exploratory testing stays valuable precisely because it isn't automated.
