# syntax=docker/dockerfile:1.7
# NOTE: This Dockerfile must be built with the repository root as context, e.g.
#   docker build -f apps/web/Dockerfile .
# It intentionally copies workspace-level files (package.json, pnpm-workspace.yaml, packages/shared).

FROM node:22-bookworm-slim AS builder
WORKDIR /workspace

RUN corepack enable

COPY package.json pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/web/package.json apps/web/tsconfig.json apps/web/tsconfig.app.json apps/web/vite.config.ts apps/web/index.html ./apps/web/
COPY packages/shared/package.json packages/shared/tsconfig.json ./packages/shared/
COPY apps/web/src ./apps/web/src
COPY packages/shared/src ./packages/shared/src

RUN pnpm install --no-frozen-lockfile
RUN pnpm --filter @geo-globe/shared build && pnpm --filter @geo-globe/web build

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

RUN corepack enable
RUN pnpm add -g serve

COPY --from=builder /workspace/apps/web/dist ./dist

EXPOSE 8080
CMD ["sh", "-c", "serve -s dist -l ${PORT:-8080}"]
