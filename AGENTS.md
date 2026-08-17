# Repository guidance

## Purpose

This is a deliberately small practice application for MIS 4173. Preserve its readability for students who are new to GitHub, Codex, and application development.

## Stack and structure

- Use plain HTML, CSS, and modern JavaScript modules.
- Do not add frameworks, build tools, external services, or production dependencies.
- Keep business and storage logic in `src/request-store.js` so it can be tested without a browser.
- Keep browser interaction and rendering in `src/app.js`.
- Store feature specifications in `docs/`.

## Commands

- Run the application: `npm start`
- Run all automated tests: `npm test`
- The application is available at `http://127.0.0.1:8000` after it starts.

## Working agreements

- Read the relevant feature specification before changing code.
- Preserve existing request data whenever the data structure changes.
- Do not edit unrelated files or redesign the interface unless the specification requires it.
- Use `textContent` or equivalent safe DOM APIs for user-provided content.
- Add or revise tests when business or storage behavior changes.
- Keep controls keyboard accessible and retain visible labels and focus indicators.

## Done means

- Every acceptance criterion has been checked.
- `npm test` passes.
- The changed behavior has been verified in the browser.
- The final summary identifies changed files, tests run, and any remaining limitations.

## Code review rules

- Flag implementation behavior that is unsupported by the specification.
- Flag changes that would make existing locally stored requests unreadable.
- Flag rendering of user input through unsafe HTML APIs.
