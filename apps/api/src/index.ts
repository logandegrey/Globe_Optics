import { createServer } from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';
import { GlobePointSchema, type GlobePoint } from '@geo-globe/shared';

const PORT = Number(process.env.API_PORT ?? 8080);
const clients = new Set<WebSocket>();

const server = createServer((_req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'ok', service: 'geo-globe-api' }));
});

const wss = new WebSocketServer({ server });

wss.on('connection', (socket) => {
  clients.add(socket);
  socket.send(JSON.stringify({ type: 'welcome', message: 'Connected to geo-globe API' }));

  socket.on('message', (raw) => {
    const parsed = JSON.parse(raw.toString()) as unknown;
    const result = GlobePointSchema.safeParse(parsed);

    if (!result.success) {
      socket.send(JSON.stringify({ type: 'error', message: 'Invalid globe point payload' }));
      return;
    }

    broadcastPoint(result.data);
  });

  socket.on('close', () => {
    clients.delete(socket);
  });
});

function broadcastPoint(point: GlobePoint) {
  const message = JSON.stringify({ type: 'point', payload: point });
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

server.listen(PORT, () => {
  console.log(`[api] listening on http://localhost:${PORT}`);
});
