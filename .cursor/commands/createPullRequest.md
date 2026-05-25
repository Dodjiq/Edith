O. Make a review of my work:

# Code Review

Perform a comprehensive code review of current changes.

## Analysis Criteria

- 🚨 Null/undefined dereferences
- 🔒 SQL injection and XSS vulnerabilities
- ⚡ Performance anti-patterns with measurable impact
- ⚠️ Missing critical error handling
- Resource leaks (unclosed files/connections)

## Output Format

- Maximum 10 inline comments prioritizing critical issues
- Explain with details the issue and a possible solution. Also in which file with the relative path to it is the issue and at which line.
- Use severity ratings: Critical > Major > Minor

1. THEN, if you find issues you must list them and ask me if you can continue to the next step and then Fix all Critical then Major then Minor issue. If no issues, you can continue, no need for confirmation.
2. Try to build the app with `pnpm run build`. If everything is correct you can continue on the next step.
3. **Remotion Check**: If any files in `apps/frontend/src/app/projects/[project-id]/_editor-container/remotion/` were modified:
   - Run `pnpm --filter frontend remotion:deploy` to deploy the updated Remotion templates to AWS Lambda.
   - Wait for deployment to complete successfully.
   - Trigger a quick test render in the app to verify Lambda rendering works before creating the PR.
4. Create new branch based on the work done. Use always this syntax [github-username]/[feature or bugfix or documentation]/[max 5 words to describe the pr]
5. Checkout to the branch
6. Commit and push
7. Create a pull request based on what I did and push the pull request on github.
