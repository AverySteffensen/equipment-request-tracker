# Equipment Request Priority Filter Specification

Status: Implemented. Automated business and storage checks pass; full browser acceptance verification remains pending.

## Goal

Help managers quickly find equipment requests that need attention by filtering existing priorities and an optional due-date range, with overdue requests first. When sorting by priority, keep undated requests at the bottom of their own priority group. Preserve all existing requests and work without a login or database.

## User Need

As a manager, I need to narrow the request list to one or more priorities and optionally a due-date range, so that I can focus on relevant requests. I need upcoming deadlines to be easy to find, my filters to survive a refresh, and a Reset button to return to the complete list.

## Functional Rules

The following rules record the manager's decisions:

1. **Priority filtering:** Use the existing Low, Medium, and High priority values. Managers can select multiple levels together; a request matches when its priority is one of the selected levels.
2. **Default view:** On the first visit, show every request without a date-range restriction, using ascending due-date order. After a refresh, restore the saved filter settings instead of replacing them with the first-visit defaults.
3. **Default due-date ordering:** In due-date sort mode, show overdue requests first, in ascending due-date order, then requests due today or later in ascending due-date order. Show requests without due dates at the bottom. An overdue request has a due date before today's calendar date; a request due today is not overdue.
4. **Priority sorting:** Provide an option to sort by priority in addition to the default due-date sort. Overdue requests still appear first across all priorities. Among the remaining requests, place requests without due dates after every dated request of the same priority and before the next lower priority group. For example, an undated High request follows all dated High requests, including three dated High requests if present, and precedes non-overdue Medium and Low requests. Selecting a sort order does not change which requests match the filters.
5. **Optional date range:** Managers can restrict results by due date. Priority and date-range filters apply together: a request must satisfy both active restrictions.
6. **No matches:** If no requests match, show this exact message: "No requests fit those specifications." Keep the filter controls and Reset button available.
7. **Persistence:** Keep the selected priority levels and date-range values after refreshing the page in the same browser on the same device, without requiring a login or database.
8. **Reset:** Provide a visible button labeled "Reset" that removes all priority and date-range restrictions and restores the default due-date sort. Reset must not delete or modify requests.

The following details define the remaining edge-case behavior for this implementation:

9. **Priority sort direction:** Use High, then Medium, then Low. In priority sort mode, first show overdue requests sorted by priority and then by ascending due date within each priority. Group all remaining requests by priority; within each priority, show dated requests in ascending due-date order followed by undated requests. Undated requests do not form a separate group at the bottom of the complete list in priority sort mode. For an otherwise exact tie, preserve the requests' existing relative order.
10. **Priority control states:** Select all three priorities by default and after Reset. Selecting none matches no requests and displays the no-matches message. Do not treat an empty selection as a request to show all priorities.
11. **Range boundaries:** Provide optional start and end dates. Include both boundaries. A start date alone means on or after that date; an end date alone means on or before that date. Leaving both blank removes the date restriction. A start date equal to the end date matches that single day.
12. **Undated requests and ranges:** When either date boundary is active, exclude requests without due dates from the results because their due dates cannot be compared. They must reappear when the range is cleared and their priority is selected. Overdue requests appear only when they also satisfy the active filters.
13. **Invalid ranges:** If the start date is later than the end date, show "Start date must be on or before end date." Keep the last valid results visible and do not save or apply the invalid range. If no valid range was previously applied, retain the unrestricted date view. Do not display the no-matches message as a substitute for this validation error.
14. **Date comparisons and ties:** Compare calendar dates using the browser's local date. Ignore time-of-day differences when classifying a request as overdue or matching a date range. In the default due-date sort, preserve existing relative order for requests with the same due date and for undated requests.
15. **Applying and remembering controls:** Apply valid filter and sort changes as the controls change, without requiring a page refresh or an Apply button. Remember the sort selection along with valid filters. After Reset, save the cleared settings so that refreshing continues to show the default view.

## Constraints

- Continue the Exercise 5 application and reuse its existing request data and priority values.
- Exercise 5 compatibility: the existing middle priority is stored as `Normal`. Display it as Medium and treat `Normal` and `Medium` as the same filter/sort level without rewriting stored records or changing the existing creation default. The existing `neededBy` field is the due date; request creation continues to require it. Use disposable saved records with an empty `neededBy` string to verify undated-request behavior.
- Do not introduce authentication, accounts, a database, or a backend service for this feature.
- Preserve every existing request and every stored request field. Filtering and sorting change the displayed view, not the stored records or their canonical order. Saved preferences must remain separate from request data.
- Preserve existing request creation, editing, deletion, and other behavior wherever those capabilities already exist. Avoid unrelated changes.
- Store filter preferences only on the current browser/device; cross-device synchronization is not required.
- Use the existing interface conventions. Label the priority, date-range, and sort controls, and allow keyboard operation.
- Limit implementation to these filters, sorting, preference persistence, Reset, and associated tests and specification updates.

## Acceptance Criteria

These criteria describe observable tests for the implemented feature. Automated coverage and outstanding browser checks are recorded under Verification Results below; automated logic checks alone do not establish a full browser acceptance pass.

For the ordering examples below, let **T** be today's date in the browser's local calendar. Use disposable test data in the following existing order; do not replace or delete real requests to create the fixture. Unless a criterion specifies otherwise, begin with this fixture, all priorities selected, no date range, and the default due-date sort.

| Request | Priority | Due date |
| --- | --- | --- |
| A | High | T minus 3 days |
| B | Low | T minus 1 day |
| C | Medium | T |
| D | Low | T plus 2 days |
| E | High | T plus 5 days |
| F | Medium | T plus 8 days |
| G | High | No due date |
| H | Low | No due date |

| ID | Observable behavior and test |
| --- | --- |
| AC-01 | With no saved preferences, open the list. All three priorities are selected, both date boundaries are blank, and all eight requests appear in order A, B, C, D, E, F, G, H. |
| AC-02 | In the default sort, verify A and B appear before C through F, C is treated as due today, future dates progress from earliest to latest, and G and H appear last. |
| AC-03 | With no date range, select only High. Only A, E, and G appear. Add Medium without deselecting High. The results become A, C, E, F, G. |
| AC-04 | Deselect all priorities. No request rows appear and the exact no-matches message is visible. Selecting all three priorities restores every request. |
| AC-05 | With all priorities selected, set the start to T and end to T plus 5 days. Only C, D, and E appear, demonstrating that both endpoints are included. |
| AC-06 | Set both boundaries to T plus 2 days. Only D appears. |
| AC-07 | With all priorities selected, use only a start date of T plus 2 days. D, E, and F appear. Use only an end date of T instead. A, B, and C appear. Clear both boundaries; all requests reappear. |
| AC-08 | Select High and Medium and set the range from T through T plus 5 days. Only C and E appear. The filters combine rather than overriding each other. |
| AC-09 | Apply any date boundary that would otherwise include the dated requests. G and H are excluded. Clear the range with all priorities selected; G and H reappear at the bottom in due-date sort mode. In priority sort mode, G reappears after the dated High requests and before non-overdue Medium and Low requests, while H follows the dated Low requests. |
| AC-10 | With all priorities selected, choose a range from T plus 20 days through T plus 21 days. No request rows appear; the exact message "No requests fit those specifications." appears, and the controls and Reset remain usable. |
| AC-11 | With all priorities selected and no date range, choose priority sorting. The order is A, B, E, G, C, F, D, H: overdue requests A and B remain first, undated High request G follows dated High request E and precedes non-overdue Medium and Low requests, and undated Low request H follows dated Low request D. Switching back to due-date sorting restores A, B, C, D, E, F, G, H. |
| AC-12 | Add two disposable requests with the same priority and due date. Their relative order remains the same when sorted repeatedly in either mode. In default due-date mode, requests sharing a due date retain their existing relative order even if their priorities differ. |
| AC-13 | Select High and Medium, set a range from T through T plus 8 days, and choose priority sorting. Refresh. The controls retain these settings and the results remain E, C, F. |
| AC-14 | After applying filters and priority sorting, click Reset. All priorities are selected, dates are blank, due-date sorting is active, and every request appears in the default order. Refresh; the reset view remains. |
| AC-15 | Apply a valid range, then enter a start date later than the end date. The stated validation error appears and the last valid results remain visible. Refresh; the saved valid range is restored instead of the invalid values. Correct the range; the error clears and matching results update. |
| AC-16 | Capture all stored request records and their original order before filtering. Change priorities, ranges, and sort modes; refresh; then Reset. The same records, field values, and canonical order remain in storage, and all requests are available again. |
| AC-17 | Load the existing request list and exercise filtering, sorting, refresh persistence, and Reset without signing in or configuring a database or backend service. |
| AC-18 | Use only the keyboard to reach and change priority, date-range, and sort controls and activate Reset. Each control has an understandable label. |
| AC-19 | Exercise the request creation, editing, deletion, and other workflows that existed in Exercise 5. They continue to work as before, with the list respecting the active filters and sort order. Do not require workflows that the existing application does not provide. |
| AC-20 | Using a separate disposable list, create three High requests due tomorrow, in two days, and in three days; one undated High request; one Medium request due tomorrow; and one Low request due tomorrow. With all priorities selected, no date range, and priority sorting, the three dated High requests appear first in ascending due-date order, followed by the undated High request, then the Medium request, then the Low request. Add an overdue Low request; it appears before all of them. |

### Verification Results

Verification date: October 17, 2026.

- **Pass:** `npm test` runs 24 tests with no failures, including the existing request-creation and storage regression tests and the new `tests/priority-filter.test.js` cases.
- **Pass:** `node --check src/app.js` and `node --check src/request-store.js` report no syntax errors.
- **Pass:** An HTTP smoke test starts the existing server and confirms that the HTML page, stylesheet, and both JavaScript modules return HTTP 200 with the correct content types.
- **Pass, source review:** The diff adds no dependencies, frameworks, authentication, database, or external services. Request data and filter preferences use separate storage keys; filtering sorts a derived array. User-provided table values still use `textContent`.
- **Not verified:** Full browser acceptance, including control interaction, layout, keyboard navigation, and actual browser refresh. The local runtime has no browser executable and its official browser download returned an unavailable-site page. The cloud browser cannot reach the local development server; automatic approval review rejected the temporary local-file preview because only HTTP and HTTPS URLs are permitted. These are environment limitations, not evidence that the feature passed its browser checks.

Run `npm start` and open `http://127.0.0.1:8000` locally to complete the numbered browser checks above using disposable data. Undated fixtures use an empty `neededBy` string; do not remove the existing creation form's required-date rule to create them.

| Criterion | Passing automated evidence | Browser check still required |
| --- | --- | --- |
| AC-01 | Default filter state and A–H ordering. | Verify the initial controls and rendered rows. |
| AC-02 | Overdue, due-today, future, and undated ordering; local calendar date handling. | Verify displayed order and undated text. |
| AC-03 | Single and multiple selected priorities; legacy `Normal` matches Medium. | Select High, then add Medium, and compare the rows. |
| AC-04 | An empty selection matches none and persists in simulated storage. | Deselect and reselect the controls; verify the message and restored list. |
| AC-05 | Both date endpoints are inclusive. | Enter the stated start and end dates. |
| AC-06 | An equal start and end match one day. | Verify only D is displayed. |
| AC-07 | Start-only, end-only, and unrestricted results. | Clear each boundary and compare the displayed results. |
| AC-08 | Priority and date restrictions combine. | Select the stated priorities and range. |
| AC-09 | Either boundary excludes undated requests; both sort modes place restored undated requests correctly. | Clear the range in each sort mode. |
| AC-10 | An out-of-range query returns no records; the exact message exists in the HTML. | Verify the message is visible and Reset remains usable. |
| AC-11 | Priority order is A, B, E, G, C, F, D, H; default order is A–H. | Switch sort controls and compare the rendered rows. |
| AC-12 | Exact ties and undated ties preserve relative order; due-date ties ignore priority. | Verify repeated sorting does not change tied rows' relative order. |
| AC-13 | Valid filters and sort round-trip through simulated storage and retain E, C, F. | Refresh the actual browser and verify both controls and rows. |
| AC-14 | Saving default preferences restores unrestricted settings. | Click Reset and refresh the browser. |
| AC-15 | Invalid ranges produce the specified error and cannot overwrite saved valid preferences. | Verify the visible error, retained results, correction, and refresh behavior. |
| AC-16 | Request fields, raw stored request JSON, and canonical order remain unchanged during filtering and preference writes. | Compare actual browser request storage before and after the stated actions. |
| AC-17 | Source and dependency review; application HTTP serving works without configured accounts or a database. | Exercise the page without signing in or configuring a service. |
| AC-18 | Source review confirms native controls, labels, and focus styles. | Complete the full keyboard-only interaction and visible-focus check. |
| AC-19 | Existing request validation, creation, append order, and storage regression tests pass. | Add requests through the form with filters active; check validation and form reset. Editing and deletion are not existing workflows. |
| AC-20 | The undated High request follows three dated High requests; overdue Low still precedes them. | Reproduce the specified example in the visible list. |

## Out of Scope

- New priority levels, automatic priority assignment, or changes to stored priorities or due dates.
- New request-management workflows or unrelated interface redesigns.
- Login, user roles, shared saved views, cross-device synchronization, databases, or new backend services.
- Notifications, reminders, exports, dashboards, bulk actions, or automatic deletion or archiving of requests.
- Opening or merging a pull request and creating Canvas submission materials are later assignment steps.
