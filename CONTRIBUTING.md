# Contributing

Thanks for wanting to improve Framedeck.

## Development

```bash
pnpm install
pnpm dev
```

Run checks before opening a pull request:

```bash
pnpm typecheck
pnpm test
pnpm audit --audit-level high
```

## Pull requests

- Keep changes focused and easy to review.
- Update `packages/api-types` first when API request or response shapes change.
- Include tests for backend behavior and high-risk editor workflows.
- Do not commit `.env` files, local conversation logs, generated build outputs, or uploaded media.

