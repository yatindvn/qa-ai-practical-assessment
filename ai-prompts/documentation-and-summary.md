# AI Prompts – Documentation and Summary

(Prompts used for writing README, reports.)

---

## Entry 1 — README and project-info finalization

**Prompt:**
> Update readme.md and project-info.md to reflect what actually happened, not the planned state — including the API suite's real pass results and the UI suite's real execution blocker. Don't soften or hide the blocker; explain it precisely enough that someone else could reproduce or resolve it.

**AI Response Summary:** Rewrote `readme.md`'s "Current execution status" section to state plainly: API suite 7/7 passing with committed reports, UI suite code-complete but not executed here due to a Windows Application Control policy blocking the Chromium binary (with a pointer to the full root-cause chain in `automation-and-debugging.md`). Filled in `project-info.md`'s remaining Part-A questions (automation design, test data, debugging) with what was actually built and actually found, replacing the earlier "to be completed" placeholders.

**Edits You Made:** Removed hedging language ("should work", "probably fine") in favor of stating exactly what was verified versus what wasn't. Added explicit pointers (file + entry number) everywhere a claim is backed by evidence elsewhere in `ai-prompts/`, so nothing here has to be taken on faith.

**Reason for Edits:** The brief's own "What Good Looks Like" section names "thoughtful AI use" as the bar, and specifically warns against "copy-paste of unreviewed output." A README that quietly upgraded "not run here" to "should pass" would be exactly that failure mode in the other direction — polished-sounding but unverified.

---

## Entry 2 — FunctionalTestCase.csv status correction

**Prompt:**
> The CSV currently has every row marked Passed as a placeholder from before any live verification happened. Now that 7 of the 8 manual cases have actually been walked through by hand on the live site (and one has a real, confirmed defect), fix the Status column to match reality, with enough detail in a Notes column that the result isn't just asserted.

**AI Response Summary:** Added a `Notes` column to `FunctionalTestCase.csv`. Six rows updated with a one-line description of what was actually observed live (e.g. exact error text, exact totals after a quantity change, both invoice numbers seen in the guest and logged-in double-confirm walkthroughs). `TC-M-08` changed from a placeholder "Passed" to a real **Failed**, with the defect summary and a pointer to the full investigation in `automation-and-debugging.md`.

**Edits You Made:** Initially only TC-M-01/04/07 had been verified live (during earlier exploration); went back and actually executed TC-M-02, TC-M-03, TC-M-05, and TC-M-06 by hand rather than leaving them as unverified "Passed" guesses, since the brief's evidence requirement is about real execution, not plausible-sounding test case text.

**Reason for Edits:** Correctness — an execution report is only evidence if the status was earned. Marking a case "Passed" before it was ever run would have been indistinguishable, to a reader, from actually running it.
