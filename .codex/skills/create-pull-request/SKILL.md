---
name: create-pull-request
description: Review current repository changes, fix issues by severity, verify frontend/backend/landing builds, then create a branch, commit, push, and open a GitHub pull request targeting main. Use when the user asks to prepare and publish a PR from local work.
---

# Pull Request Workflow

## Run This Workflow

1. Inspect current git state and changed files.
2. Review code using this checklist:
   - Null/undefined dereferences
   - SQL injection and XSS risks
   - Performance anti-patterns with measurable impact
   - Missing critical error handling
   - Resource leaks (files, sockets, connections)
3. Report at most 10 findings, ordered by severity (`Critical`, `Major`, `Minor`), with actionable fixes.
4. If findings exist, ask for confirmation before applying fixes, then resolve issues in this order: `Critical` -> `Major` -> `Minor`.
5. Verify app build in sequence:
   - `next build`
6. If any build fails, fix issues and repeat all required builds until they pass.
7. Create a new branch for the work.
   - Preferred naming pattern: `kevinR/<feature|bugfix|documentation>/<max-5-words>`
8. Commit and push the branch.
9. Open a GitHub pull request with `main` as the base branch.

## Guardrails

- Never push when one of the required builds is failing.
