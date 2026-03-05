# syntax=docker/dockerfile:1.7
# NOTE: This Dockerfile must be built with the repository root as context, e.g.
#   docker build -f apps/ingest/Dockerfile .
# It intentionally copies workspace-level files (package.json, pnpm-workspace.yaml, packages/shared).

FROM node:22-bookworm-slim AS builder
WORKDIR /workspace

RUN corepack enable

COPY package.json pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/ingest/package.json apps/ingest/tsconfig.json ./apps/ingest/
COPY packages/shared/package.json packages/shared/tsconfig.json ./packages/shared/
COPY apps/ingest/src ./apps/ingest/src
COPY packages/shared/src ./packages/shared/src

RUN pnpm install --no-frozen-lockfile
RUN pnpm --filter @geo-globe/shared build && pnpm --filter @geo-globe/ingest build

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

RUN corepack enable

COPY package.json pnpm-workspace.yaml ./
COPY apps/ingest/package.json ./apps/ingest/package.json
COPY packages/shared/package.json ./packages/shared/package.json

RUN pnpm install --prod --filter @geo-globe/ingest... --no-frozen-lockfile

COPY --from=builder /workspace/apps/ingest/dist ./apps/ingest/dist
COPY --from=builder /workspace/packages/shared/dist ./packages/shared/dist

CMD ["node", "apps/ingest/dist/index.js"]
