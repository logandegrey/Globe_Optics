# Globe Optics Monorepo

PNPM workspace with:

- `apps/web`: Vite + React + TypeScript
- `apps/api`: Node + TypeScript API service
- `apps/ingest`: Node + TypeScript ingest worker
- `packages/shared`: shared types and zod schemas

## Scripts

- `pnpm dev`: run web, api, and ingest concurrently
- `pnpm build`: build all workspaces
- `pnpm lint`: lint all workspaces
- `pnpm typecheck`: type-check all workspaces
