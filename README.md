# Equipment Request Tracker

A small, dependency-free application used in MIS 4173 to practice building software from business requirements with Codex and GitHub.

## What the starter application does

- Captures requester, department, equipment, needed date, and business reason.
- Validates required fields.
- Stores requests in the browser using `localStorage`.
- Displays the newest requests first.
- Includes automated tests for validation and storage logic.

The starter is intentionally incomplete. It does **not** include priority, filtering, a feature specification, or a custom review Skill. Students add those capabilities during Exercises 5–7.

## Run the application

You need Node.js 20 or newer. No packages need to be installed.

```bash
npm start
```

Open <http://127.0.0.1:8000> in a browser.

## Run the tests

```bash
npm test
```

## Exercise sequence

1. **Exercise 5 — Codex and GitHub:** Add request priority, verify the change, review the diff, and merge a pull request.
2. **Exercise 6 — Specification-driven development:** Write a specification for helping managers focus on requests that need attention, then implement and verify it.
3. **Exercise 7 — Codex Skills:** Create a repository-scoped requirements-review Skill and evaluate its findings.

## Student setup

Create your own repository from this starter before beginning Exercise 5. Keep your work in feature branches and merge only after reviewing the changed files and verifying the behavior.

## Data note

Requests are stored only in the current browser. Clearing browser storage removes them. This application is for learning and is not intended for production use or sensitive information.
