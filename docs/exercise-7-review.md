# Exercise 7: Requirements Review

Review date: November 1, 2026.
Branch: `exercise-7-skill`.
Original implementation reviewed: `fd3a381453228048d7d075916fb025f6734dbf63`.

## Skill creation and inspection

Used Skill Creator to initialize the repository-scoped skill at `.agents/skills/requirements-reviewer`, then completed and validated it. This is a focused review workflow; the existing repository-wide `AGENTS.md` remains applicable.

- The description states when to use it: compare a feature specification and acceptance criteria with implementation and tests before accepting a change.
- The evidence workflow examines the specification, constraints, applicable guidance, UI, handlers, business/storage logic, tests, and relevant diffs.
- The required report covers every acceptance criterion, gaps, unsupported behavior, data/security concerns, needed tests, and a prioritized finding, with specification and code citations.
- The boundaries prohibit automatic file changes, dependency installation, commits, unsafe checks, and overwriting real test data. A report is returned in the response unless saving is requested.
- An independent static inspection found no blocking skill issues. Its suggestion to allow a clean review with no remaining findings was accepted; the skill must not manufacture a gap.

## Invocation and scope

Invoked the workflow with:

```text
$requirements-reviewer Review the priority-filter feature against docs/priority-filter-spec.md. Do not change files.
```

An independent agent read the local skill and performed the review without changing files. It inspected the specification, `AGENTS.md`, markup, styles, both source modules, tests, the static server, and the feature diff. Only the newly created `.agents/` directory was untracked before and after that review. The related test and documentation changes described below were made afterward under the assignment's instruction to respond to the finding.

## Checks and limitations

The original 24 Node tests passed. JavaScript syntax checks passed for `src/app.js`, `src/request-store.js`, and `scripts/serve.mjs`. A temporary local HTTP server returned 200 with nonempty bodies for `/`, both source modules, and `/styles.css` and was stopped afterward.

The review also executed disposable in-memory checks for mixed overdue priorities, the Normal/Medium alias, same-day timestamps, required due-date rejection, and rejecting the first invalid range without saving. All passed.

No current interactive browser, real browser refresh, or keyboard verification was completed. Browser binaries were unavailable, their download failed, and the cloud browser could not access this executor's local app. The specification's October 17 browser results remain historical evidence, not checks rerun in Exercise 7. The added Node integration harness executes actual application handlers but does not emulate native browser validation, layout, focus, or keyboard behavior.

## Acceptance-criterion evidence

Citations below refer to the original reviewed implementation. "Logic satisfied" means current executed logic checks support the criterion; it does not claim an interactive browser pass. "Partial" indicates remaining UI evidence.

| Criterion | Review status | Specification evidence | Code and test evidence |
| --- | --- | --- | --- |
| AC-01 | Partial: initial controls not browser-tested | `docs/priority-filter-spec.md:66` | `defaultFilters`, `src/request-store.js:90`; startup and control restoration, `src/app.js:28`, `:104`; `tests/priority-filter.test.js:40` |
| AC-02 | Logic satisfied | `docs/priority-filter-spec.md:67` | `filterAndSortRequests`, `src/request-store.js:121`; `tests/priority-filter.test.js:40` |
| AC-03 | Logic satisfied; browser interaction unverified | `docs/priority-filter-spec.md:68` | Membership, `src/request-store.js:125`; input handler, `src/app.js:36`; `tests/priority-filter.test.js:47` |
| AC-04 | Partial: empty-state rendering inspected | `docs/priority-filter-spec.md:69` | `src/request-store.js:125`; `renderRequests`, `src/app.js:89`; exact message, `index.html:143`; `tests/priority-filter.test.js:47` |
| AC-05 | Logic satisfied | `docs/priority-filter-spec.md:70` | Inclusive bounds, `src/request-store.js:126`; `tests/priority-filter.test.js:53` |
| AC-06 | Logic satisfied | `docs/priority-filter-spec.md:71` | Inclusive bounds, `src/request-store.js:126`; single-day test, `tests/priority-filter.test.js:55` |
| AC-07 | Logic satisfied | `docs/priority-filter-spec.md:72` | Optional bounds, `src/request-store.js:126`; `tests/priority-filter.test.js:58` |
| AC-08 | Logic satisfied | `docs/priority-filter-spec.md:73` | Conjoined restrictions, `src/request-store.js:124`; `tests/priority-filter.test.js:64` |
| AC-09 | Partial: browser visibility unverified | `docs/priority-filter-spec.md:74` | `renderRequests`, `src/app.js:89`; controls outside results, `index.html:106`; `tests/priority-filter.test.js:68` |
| AC-10 | Logic satisfied | `docs/priority-filter-spec.md:75` | Overdue groups then priority/date, `src/request-store.js:135`; `tests/priority-filter.test.js:71` |
| AC-11 | Logic satisfied; browser repetition unverified | `docs/priority-filter-spec.md:76` | Filtered copy and stable ties, `src/request-store.js:122`, `:148`; `tests/priority-filter.test.js:76` |
| AC-12 | Partial: real refresh unverified | `docs/priority-filter-spec.md:77` | Preference load/save, `src/request-store.js:152`, `:176`; restoration, `src/app.js:28`, `:104`; `tests/priority-filter.test.js:92` |
| AC-13 | Partial: native Reset/refresh unverified | `docs/priority-filter-spec.md:78` | Reset handler, `src/app.js:53`; `tests/priority-filter.test.js:100` |
| AC-14 | Partial: visible retention/recovery lacked handler coverage | `docs/priority-filter-spec.md:79` | Validation, `src/request-store.js:115`; early return, `src/app.js:44`; `tests/priority-filter.test.js:110` |
| AC-15 | Partial: displayed-detail browser comparison unverified | `docs/priority-filter-spec.md:80` | Separate storage keys, `src/request-store.js:1`; non-mutating view, `:122`; filter/Reset handlers, `src/app.js:36`; `tests/priority-filter.test.js:131` |
| AC-16 | Satisfied by inspected architecture and HTTP smoke | `docs/priority-filter-spec.md:81` | Local persistence, `src/request-store.js:65`, `:152`; static server, `scripts/serve.mjs:16`; module, `index.html:173` |
| AC-17 | Partial: actual keyboard/focus behavior unverified | `docs/priority-filter-spec.md:82` | Native labeled controls, `index.html:106`; focus rules, `styles.css:149` |
| AC-18 | Partial: creation logic passes; browser flow unverified | `docs/priority-filter-spec.md:83` | Existing submit handler, `src/app.js:61`; required date/default, `src/request-store.js:27`, `:54`; `tests/request-store.test.js:33` |

## Gaps and most important finding

No functional mismatch was established. The most important supported finding was a **verification gap**: the existing tests exercised `request-store.js` but did not execute the actual `src/app.js` event handlers responsible for invalid-range result retention, Reset, no-match rendering, and preference-save warnings.

Evidence: AC-12 through AC-18 specify observable UI behavior (`docs/priority-filter-spec.md:77` through `:83`). The corresponding handlers are in `src/app.js:36`, `:53`, `:61`, and `:120`, while the two original test files import only the store module (`tests/priority-filter.test.js:4`; `tests/request-store.test.js:4`). Passing store tests alone cannot prove these handlers work together correctly.

## Unsupported behavior

None found. Undated legacy-record fallbacks (`src/request-store.js:110`, `:146`) do not establish a specification violation: acceptance examples require due dates (`docs/priority-filter-spec.md:51`), creation still requires them (`:31`, `:39`), and preserving readable records is consistent with the data-preservation constraint (`:41`). The baseline does not provide edit/delete workflows, so those are not new requirements under AC-18.

## Data or security concerns

None established in the reviewed feature. Preferences and requests use separate keys (`src/request-store.js:1`), filtering sorts a new array (`:122`), and filter/Reset handlers do not call `saveRequests` (`src/app.js:36` through `:58`). The original preservation test checks all fields, extra fields, and unchanged request-storage bytes (`tests/priority-filter.test.js:131`). Normal remains stored as Normal while displayed/matched as Medium (`src/request-store.js:54`, `:106`). User-supplied cells use `textContent` (`src/app.js:140`). Preference-save failures display a warning (`src/app.js:120`).

## Decision and response

**Decision: Accept the coverage finding.** Its narrower conclusion is supported: automated handler coverage was missing. It does not establish that the implemented feature is broken, so a feature-code rewrite is not justified.

Added `tests/app.test.js` to execute the real application module and its event handlers using a minimal disposable DOM/FormData/storage fixture with no added dependencies. The fixture is test infrastructure, not a browser substitute. The tests check invalid-range retention and recovery, a first invalid range, Reset and preference restoration, request-data preservation, no-match behavior, and preference-save failure feedback.

The skill's read-only review and the later authorized response are separate steps. No production source code or Exercise 6 requirements were changed. Final `npm test` result: **29 passed, 0 failed** (24 existing tests plus five new handler integration tests). The Skill Creator validator, JavaScript syntax checks, and `git diff --check` also passed.

## Tests still needed

Use a disposable browser profile to repeat actual refresh, native form submission under filters, exact message visibility, and keyboard/focus checks. In particular, rerun AC-12 through AC-18 in an interactive browser. The new handler tests reduce the automated gap but do not close this browser-verification limitation or justify marking every criterion as freshly browser-verified.
