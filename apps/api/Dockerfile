# syntax=docker/dockerfile:1.7
# NOTE: This Dockerfile must be built with the repository root as context, e.g.
#   docker build -f apps/api/Dockerfile .
# It intentionally copies workspace-level files (package.json, pnpm-workspace.yaml, packages/shared).

FROM node:22-bookworm-slim AS builder
WORKDIR /workspace

RUN corepack enable

COPY package.json pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/api/package.json apps/api/tsconfig.json ./apps/api/
COPY packages/shared/package.json packages/shared/tsconfig.json ./packages/shared/
COPY apps/api/src ./apps/api/src
COPY packages/shared/src ./packages/shared/src

RUN pnpm install --no-frozen-lockfile
RUN pnpm --filter @geo-globe/shared build && pnpm --filter @geo-globe/api build

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

RUN corepack enable

COPY package.json pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/package.json
COPY packages/shared/package.json ./packages/shared/package.json

RUN pnpm install --prod --filter @geo-globe/api... --no-frozen-lockfile

COPY --from=builder /workspace/apps/api/dist ./apps/api/dist
COPY --from=builder /workspace/packages/shared/dist ./packages/shared/dist

EXPOSE 8080
CMD ["sh", "-c", "API_PORT=${PORT:-8080} node apps/api/dist/index.js"]
