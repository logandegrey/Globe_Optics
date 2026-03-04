import { HealthSchema } from '@globe-optics/shared';

const heartbeat = HealthSchema.parse({ service: 'ingest', status: 'ok' });

setInterval(() => {
  console.log(`[ingest] heartbeat ${JSON.stringify(heartbeat)}`);
}, 5000);

console.log('Ingest worker started');
