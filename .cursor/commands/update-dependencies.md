package.json
apps/server/package.json
apps/frontend/package.json
apps/media-processor/package.json
packages/shared/package.json

Update all the dependencies to the latest version.
If you update to a new major version, make sure it is compatible with the current codebase. Propose fixes for any breaking changes.
If you see a dependency not used in the codebase, remove it.
Make sure to run pnpm install after updating the dependencies and also pnpm build after updating the dependencies.
