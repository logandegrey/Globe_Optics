# Globe Optics


## Dependency lockfile policy

- `pnpm-lock.yaml` is required and must be committed at the repository root.
- Any dependency change in any workspace package (`apps/*` or `packages/*`) must include an updated `pnpm-lock.yaml` in the same PR.
- Docker builds now use frozen lockfile installs (`pnpm install --frozen-lockfile`), so stale lockfiles will fail image builds.

### Workspace filter sanity checks

Use these filters for targeted commands:

```bash
pnpm --filter @geo-globe/shared build
pnpm --filter @geo-globe/api build
pnpm --filter @geo-globe/web build
pnpm --filter @geo-globe/ingest build
```

## Deployment (Docker build context)

All service Dockerfiles (`apps/api/Dockerfile`, `apps/web/Dockerfile`, `apps/ingest/Dockerfile`) copy workspace-level files such as `package.json`, `pnpm-workspace.yaml`, and `packages/shared`. Build them with the **repository root** as the Docker context.

### Local build commands

```bash
docker build -f apps/api/Dockerfile -t globe-api .
docker build -f apps/web/Dockerfile -t globe-web .
docker build -f apps/ingest/Dockerfile -t globe-ingest .
```

### Cloud Run source deploy (recommended)

Run from the repository root and set `--source=.` so Cloud Build uploads the full workspace context:

```bash
gcloud run deploy globe-api \
  --source=. \
  --dockerfile=apps/api/Dockerfile \
  --region=us-central1 \
  --allow-unauthenticated

gcloud run deploy globe-web \
  --source=. \
  --dockerfile=apps/web/Dockerfile \
  --region=us-central1 \
  --allow-unauthenticated

gcloud run deploy globe-ingest \
  --source=. \
  --dockerfile=apps/ingest/Dockerfile \
  --region=us-central1
```

### Cloud Build config (root context)

Use `dir: .` (or omit `dir`) and pass `-f apps/<service>/Dockerfile` while using `.` as the final build context argument:

```yaml
steps:
  - name: gcr.io/cloud-builders/docker
    args: ['build', '-f', 'apps/api/Dockerfile', '-t', 'us-central1-docker.pkg.dev/$PROJECT_ID/globe/api:$COMMIT_SHA', '.']
    dir: .

images:
  - us-central1-docker.pkg.dev/$PROJECT_ID/globe/api:$COMMIT_SHA
```
