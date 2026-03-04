import { createServer } from 'node:http';
import { HealthSchema } from '@globe-optics/shared';

const port = Number(process.env.PORT ?? 3000);

const server = createServer((_req, res) => {
  const body = HealthSchema.parse({ service: 'api', status: 'ok' });

  res.writeHead(200, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
});

server.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
