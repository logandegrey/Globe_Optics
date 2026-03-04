import { randomUUID } from 'node:crypto';
import { IngestMessageSchema } from '@geo-globe/shared';

const INTERVAL_MS = Number(process.env.INGEST_INTERVAL_MS ?? 5000);

function runWorkerTick() {
  const message = {
    source: 'demo-worker',
    timestamp: new Date().toISOString(),
    points: [
      {
        id: randomUUID(),
        lat: 37.7749,
        lng: -122.4194,
        label: 'San Francisco'
      }
    ]
  };

  const parsed = IngestMessageSchema.safeParse(message);
  if (!parsed.success) {
    console.error('[ingest] message validation failed', parsed.error.format());
    return;
  }

  console.log(`[ingest] produced ${parsed.data.points.length} point(s) at ${parsed.data.timestamp}`);
}

console.log('[ingest] worker started');
runWorkerTick();
setInterval(runWorkerTick, INTERVAL_MS);
