# API service

## Auth

- HTTP endpoints require `X-APP-SECRET` header matching `APP_SECRET`.
- WebSocket auth supports either:
  - query token: `ws://host:port?token=<APP_SECRET>`
  - `x-app-secret` header (when the client library supports custom WS headers)

## Endpoints

- `GET /health`
- `POST /internal/ingest`

`/internal/ingest` payload shape:

```json
{
  "source": "sensor-a",
  "timestamp": "2026-01-01T00:00:00.000Z",
  "points": [
    { "id": "track-1", "lat": 10, "lng": 20, "label": "Alpha" }
  ]
}
```

## WS protocol

- client -> server:
  - `{"type":"hello","bbox":{...},"sources":[...],"maxRateHz":2}`
- server -> client:
  - `{"type":"hello.ack","broadcastIntervalMs":500}`
  - `{"type":"tracks.batch","updates":[...]}`
