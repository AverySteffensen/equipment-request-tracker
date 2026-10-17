# Equipment Request Priority Filter Specification

Status: Implemented. Browser verification: 17 Pass; AC-16 Partial; AC-09 and AC-20 Not applicable.

## Goal

Help managers quickly find equipment requests that need attention by filtering existing priorities and an optional due-date range, with overdue requests first. Preserve all existing requests and work without a login or database.

## User Need

As a manager, I need to narrow the request list to one or more priorities and optionally a due-date range, so that I can focus on relevant requests. I need upcoming deadlines to be easy to find, my filters to survive a refresh, and a Reset button to return to the complete list.

## Functional Rules

The following rules record the manager's decisions:

1. **Priority filtering:** Use the existing Low, Medium, and High priority values. Managers can select multiple levels together; a request matches when its priority is one of the selected levels.
2. **Default view:** On the first visit, show every request without a date-range restriction, using ascending due-date order. After a refresh, restore the saved filter settings instead of replacing them with the first-visit defaults.
3. **Default due-date ordering:** In due-date sort mode, show overdue requests first, in ascending due-date order, then requests due today or later in ascending due-date order. An overdue request has a due date before today's calendar date; a request due today is not overdue.
4. **Priority sorting:** Provide an option to sort by priority in addition to the default due-date sort. Overdue requests still appear first across all priorities. Selecting a sort order does not change which requests match the filters.
5. **Optional date range:** Managers can restrict results by due date. Priority and date-range filters apply together: a request must satisfy both active restrictions.
6. **No matches:** If no requests match, show this exact message: "No requests fit those specifications." Keep the filter controls and Reset button available.
7. **Persistence:** Keep the selected priority levels and date-range values after refreshing the page in the same browser on the same device, without requiring a login or database.
8. **Reset:** Provide a visible button labeled "Reset" that removes all priority and date-range restrictions and restores the default due-date sort. Reset must not delete or modify requests.

The following details define the remaining edge-case behavior for this implementation:

9. **Priority sort direction:** Use High, then Medium, then Low. In priority sort mode, first show overdue requests sorted by priority and then by ascending due date within each priority. Group all remaining requests by priority and show them in ascending due-date order within each priority. For an otherwise exact tie, preserve the requests' existing relative order.
10. **Priority control states:** Select all three priorities by default and after Reset. Selecting none matches no requests and displays the no-matches message. Do not treat an empty selection as a request to show all priorities.
11. **Range boundaries:** Provide optional start and end dates. Include both boundaries. A start date alone means on or after that date; an end date alone means on or before that date. Leaving both blank removes the date restriction. A start date equal to the end date matches that single day.
12. **Date-range matching and defensive handling:** Overdue requests appear only when they also satisfy the active filters. Submitted requests require a due date. Existing safeguards for empty dates remain as defensive behavior outside required browser acceptance: active date ranges exclude undated records; without a range, due-date sorting places them last overall and priority sorting places them after dated records of the same priority.
13. **Invalid ranges:** If the start date is later than the end date, show "Start date must be on or before end date." Keep the last valid results visible and do not save or apply the invalid range. If no valid range was previously applied, retain the unrestricted date view. Do not display the no-matches message as a substitute for this validation error.
14. **Date comparisons and ties:** Compare calendar dates using the browser's local date. Ignore time-of-day differences when classifying a request as overdue or matching a date range. In the default due-date sort, preserve existing relative order for requests with the same due date.
15. **Applying and remembering controls:** Apply valid filter and sort changes as the controls change, without requiring a page refresh or an Apply button. Remember the sort selection along with valid filters. After Reset, save the cleared settings so that refreshing continues to show the default view.

## Constraints

- Continue the Exercise 5 application and reuse its existing request data and priority values.
- Exercise 5 compatibility: the existing middle priority is stored as `Normal`. Display it as Medium and treat `Normal` and `Medium` as the same filter/sort level without rewriting stored records or changing the existing creation default. The existing `neededBy` field is the due date; request creation continues to require it.
- Do not introduce authentication, accounts, a database, or a backend service for this feature.
- Preserve every existing request and every stored request field. Filtering and sorting change the displayed view, not the stored records or their canonical order. Saved preferences must remain separate from request data.
- Preserve existing request creation, editing, deletion, and other behavior wherever those capabilities already exist. Avoid unrelated changes.
- Store filter preferences only on the current browser/device; cross-device synchronization is not required.
- Use the existing interface conventions. Label the priority, date-range, and sort controls, and allow keyboard operation.
- Limit implementation to these filters, sorting, preference persistence, Reset, and associated tests and specification updates.

## Acceptance Criteria

These criteria describe observable tests for the implemented feature. Automated coverage and outstanding browser checks are recorded under Verification Results below; automated logic checks alone do not establish a full browser acceptance pass.

Scope correction from the manager, October 17, 2026: a due date is required to submit a request, so undated-request scenarios are not needed for browser acceptance. AC-09 and AC-20 are marked Not applicable and their identifiers are retained for traceability. The remaining 18 criteria are applicable; their latest verification outcomes are recorded below. Defensive empty-date handling and its existing automated tests are retained.

For the ordering examples below, let **T** be today's date in the browser's local calendar. Use disposable test data in the following existing order; do not replace or delete real requests to create the fixture. Unless a criterion specifies otherwise, begin with this fixture, all priorities selected, no date range, and the default due-date sort.

| Request | Priority | Due date |
| --- | --- | --- |
| A | High | T minus 3 days |
| B | Low | T minus 1 day |
| C | Medium | T |
| D | Low | T plus 2 days |
| E | High | T plus 5 days |
| F | Medium | T plus 8 days |

| ID | Observable behavior and test | Pass/Fail |
| --- | --- | --- |
| AC-01 | With no saved preferences, open the list. All three priorities are selected, both date boundaries are blank, and all six requests appear in order A, B, C, D, E, F. | Pass |
| AC-02 | In the default sort, verify A and B appear before C through F, C is treated as due today, and future dates progress from earliest to latest. | Pass |
| AC-03 | With no date range, select only High. Only A and E appear. Add Medium without deselecting High. The results become A, C, E, F. | Pass |
| AC-04 | Deselect all priorities. No request rows appear and the exact no-matches message is visible. Selecting all three priorities restores every request. | Pass |
| AC-05 | With all priorities selected, set the start to T and end to T plus 5 days. Only C, D, and E appear, demonstrating that both endpoints are included. | Pass |
| AC-06 | Set both boundaries to T plus 2 days. Only D appears. | Pass |
| AC-07 | With all priorities selected, use only a start date of T plus 2 days. D, E, and F appear. Use only an end date of T instead. A, B, and C appear. Clear both boundaries; all requests reappear. | Pass |
| AC-08 | Select High and Medium and set the range from T through T plus 5 days. Only C and E appear. The filters combine rather than overriding each other. | Pass |
| AC-09 | **Not applicable:** undated-request date-range scenarios are excluded from required browser acceptance because submission requires a due date. | Not applicable |
| AC-10 | With all priorities selected, choose a range from T plus 20 days through T plus 21 days. No request rows appear; the exact message "No requests fit those specifications." appears, and the controls and Reset remain usable. | Pass |
| AC-11 | With all priorities selected and no date range, choose priority sorting. The order is A, B, E, C, F, D: overdue requests A and B remain first, and the remaining requests are sorted High, Medium, Low, then by ascending due date within each priority. Switching back to due-date sorting restores A, B, C, D, E, F. | Pass |
| AC-12 | Add two disposable requests with the same priority and due date. Their relative order remains the same when sorted repeatedly in either mode. In default due-date mode, requests sharing a due date retain their existing relative order even if their priorities differ. | Pass |
| AC-13 | Select High and Medium, set a range from T through T plus 8 days, and choose priority sorting. Refresh. The controls retain these settings and the results remain E, C, F. | Pass |
| AC-14 | After applying filters and priority sorting, click Reset. All priorities are selected, dates are blank, due-date sorting is active, and every request appears in the default order. Refresh; the reset view remains. | Pass |
| AC-15 | Apply a valid range, then enter a start date later than the end date. The stated validation error appears and the last valid results remain visible. Refresh; the saved valid range is restored instead of the invalid values. Correct the range; the error clears and matching results update. | Pass |
| AC-16 | Capture all stored request records and their original order before filtering. Change priorities, ranges, and sort modes; refresh; then Reset. The same records, field values, and canonical order remain in storage, and all requests are available again. | Partial |
| AC-17 | Load the existing request list and exercise filtering, sorting, refresh persistence, and Reset without signing in or configuring a database or backend service. | Pass |
| AC-18 | Use only the keyboard to reach and change priority, date-range, and sort controls and activate Reset. Each control has an understandable label. | Pass |
| AC-19 | Exercise the request creation, editing, deletion, and other workflows that existed in Exercise 5. They continue to work as before, with the list respecting the active filters and sort order. Do not require workflows that the existing application does not provide. | Pass |
| AC-20 | **Not applicable:** the undated High request example is excluded from required browser acceptance because submission requires a due date. | Not applicable |

### Verification Results

Verification date: October 17, 2026.

- **Browser results: 17 Pass, 1 Partial, 2 Not applicable.** No functional failures were observed. AC-16 has a remaining direct storage comparison and must not yet be marked fully verified.
- **Automated checks: Pass.** The existing 24 Node tests, JavaScript syntax checks, and HTTP smoke test passed for the unchanged implementation. No feature code changed during this browser-verification step.
- **Browser method:** Tested the running application in Chrome through the manager-provided GitHub Codespaces preview. The browser's local calendar date, T, was October 17, 2026.
- **Test data:** The initial visible list was empty. Added requests A–F using the actual form, then added High requests “Tie 1” and “Tie 2” and a newer Low request “Date tie Low,” all due T+3, to test ties and creation. Nine disposable records were present at the end. No undated records were needed.
- **Coverage:** Interacted with the actual controls and form, refreshed the actual page, compared complete displayed rows before and after filter/reset cycles, and operated controls with native keyboard input. No application errors appeared in the captured preview error logs.

| Criterion | Pass/Fail | Evidence |
| --- | --- | --- |
| AC-01 | Pass | Fresh browser defaults: all priorities selected, dates blank, due-date sort, and A–F displayed in order. |
| AC-02 | Pass | Overdue A and B precede today C and future D, E, F in ascending due-date order. |
| AC-03 | Pass | High alone displays A, E; adding Medium displays A, C, E, F immediately. |
| AC-04 | Pass | No priorities produces the exact no-results message; selecting all restores A–F. |
| AC-05 | Pass | T through T+5 includes both endpoints and displays C, D, E. |
| AC-06 | Pass | Both boundaries at T+2 display only D. |
| AC-07 | Pass | Start-only displays D, E, F; end-only displays A, B, C; clearing both restores all. |
| AC-08 | Pass | High and Medium combined with T through T+5 display only C, E. |
| AC-09 | Not applicable | Undated-request scenarios were excluded because request submission requires a due date. |
| AC-10 | Pass | An unmatched range displays the exact message, hides the empty table, and retains working controls and Reset. |
| AC-11 | Pass | Priority sorting displays A, B, E, C, F, D; switching back restores A–F. |
| AC-12 | Pass | Two tied High requests keep their relative order through repeated sorting and refresh. A newer Low request with the same due date stays ahead of those High requests in due-date mode, preserving original tie order. |
| AC-13 | Pass | A real browser refresh retains High/Medium selections, T through T+8, priority sorting, and E, C, F results. |
| AC-14 | Pass | Reset restores all priorities, blank dates, due-date sorting, and all records; another refresh retains this reset view. |
| AC-15 | Pass | An invalid range shows the exact validation error and retains valid results. Refresh restores the saved valid range; correction clears the error. |
| AC-16 | Partial | All displayed fields and ordering survived filter, sort, refresh, and Reset cycles, including all nine records and mixed-priority ties. Automated raw-storage preservation tests pass. Direct raw browser-storage comparison remains unverified because this browser connection does not expose localStorage. |
| AC-17 | Pass | The application needs no application login or database configuration. GitHub sign-in protected the private Codespace preview and was not an application feature. |
| AC-18 | Pass | Used Tab, Space, and ArrowDown to reach and operate every priority, both date fields, sorting, and Reset. The visible gold focus outline was confirmed. |
| AC-19 | Pass | Required-field validation and a specifically missing due date reject submission. Valid creation saves and respects active filters, resets the form and Medium default, and returns focus to Requester. Editing/deletion do not exist in this app. |
| AC-20 | Not applicable | The undated High example was excluded because request submission requires a due date. |

#### Finish AC-16

In an application browser window containing test requests, open the browser's developer console and capture the exact stored request JSON before changing filters:

```js
sessionStorage.setItem(
  "exercise6-request-data-before",
  JSON.stringify(localStorage.getItem("mis4173-equipment-requests"))
);
```

Change priorities, date-range boundaries, and sorting; refresh; then click Reset. Do not add requests between the two snapshots. Run this comparison:

```js
sessionStorage.getItem("exercise6-request-data-before") !== null &&
JSON.parse(sessionStorage.getItem("exercise6-request-data-before")) ===
  localStorage.getItem("mis4173-equipment-requests");
```

A result of `true` confirms that the stored request JSON, including every field and canonical record order, is unchanged. Record the actual outcome before changing AC-16 from Partial to Pass. Neither command changes stored requests.

## Out of Scope

- Undated-request scenarios in required browser acceptance. Existing defensive handling is retained.
- New priority levels, automatic priority assignment, or changes to stored priorities or due dates.
- New request-management workflows or unrelated interface redesigns.
- Login, user roles, shared saved views, cross-device synchronization, databases, or new backend services.
- Notifications, reminders, exports, dashboards, bulk actions, or automatic deletion or archiving of requests.
- Opening or merging a pull request and creating Canvas submission materials are later assignment steps.
