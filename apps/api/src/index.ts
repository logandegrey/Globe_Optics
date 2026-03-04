import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { URL } from 'node:url';
import { WebSocketServer, WebSocket } from 'ws';
import { IngestMessageSchema, type IngestMessage } from '@geo-globe/shared';

type BBox = {
  minLat: number;
  minLng: number;
  maxLat: number;
  maxLng: number;
};

type HelloMessage = {
  type: 'hello';
  bbox?: BBox;
  sources?: string[];
  maxRateHz?: number;
};

type TrackUpdate = {
  trackId: string;
  source: string;
  timestamp: string;
  lat: number;
  lng: number;
  label: string;
};

type ClientSession = {
  socket: WebSocket;
  ready: boolean;
  bbox?: BBox;
  sources?: Set<string>;
  broadcastIntervalMs: number;
  timer?: NodeJS.Timeout;
};

const PORT = Number(process.env.API_PORT ?? 8080);
const APP_SECRET = process.env.APP_SECRET ?? 'dev-secret';
const DEFAULT_RATE_HZ = 1;
const MAX_RATE_HZ = 30;

const tracksById = new Map<string, TrackUpdate>();
const clients = new Set<ClientSession>();

const server = createServer((req, res) => {
  if (!isAuthorizedHttp(req)) {
    json(res, 401, { error: 'Unauthorized' });
    return;
  }

  if (req.method === 'GET' && req.url === '/health') {
    json(res, 200, { status: 'ok', service: 'geo-globe-api' });
    return;
  }

  if (req.method === 'POST' && req.url === '/internal/ingest') {
    handleIngest(req, res);
    return;
  }

  json(res, 404, { error: 'Not found' });
});

const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (req, socket, head) => {
  if (!isAuthorizedWs(req)) {
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
    socket.destroy();
    return;
  }

  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit('connection', ws);
  });
});

wss.on('connection', (socket) => {
  const client: ClientSession = {
    socket,
    ready: false,
    broadcastIntervalMs: rateHzToMs(DEFAULT_RATE_HZ)
  };

  clients.add(client);

  socket.on('message', (raw) => {
    const parsed = parseJson(raw.toString());
    if (!parsed || parsed.type !== 'hello') {
      send(socket, { type: 'error', message: 'Expected hello message' });
      return;
    }

    const hello = parsed as HelloMessage;
    client.ready = true;
    client.bbox = hello.bbox;
    client.sources = hello.sources ? new Set(hello.sources) : undefined;

    const requestedRateHz = clampRate(hello.maxRateHz ?? DEFAULT_RATE_HZ);
    client.broadcastIntervalMs = rateHzToMs(requestedRateHz);

    resetClientTimer(client);
    send(socket, {
      type: 'hello.ack',
      broadcastIntervalMs: client.broadcastIntervalMs
    });

    broadcastToClient(client);
  });

  socket.on('close', () => {
    if (client.timer) {
      clearInterval(client.timer);
    }
    clients.delete(client);
  });
});

async function handleIngest(req: IncomingMessage, res: ServerResponse) {
  const rawBody = await readBody(req);
  const parsed = parseJson(rawBody);

  const validation = IngestMessageSchema.safeParse(parsed);
  if (!validation.success) {
    json(res, 400, { error: 'Invalid ingest payload' });
    return;
  }

  ingestTracks(validation.data);
  json(res, 202, { status: 'accepted', tracks: validation.data.points.length });
}

function ingestTracks(message: IngestMessage) {
  for (const point of message.points) {
    tracksById.set(point.id, {
      trackId: point.id,
      source: message.source,
      timestamp: message.timestamp,
      lat: point.lat,
      lng: point.lng,
      label: point.label
    });
  }

  for (const client of clients) {
    broadcastToClient(client);
  }
}

function broadcastToClient(client: ClientSession) {
  if (!client.ready || client.socket.readyState !== WebSocket.OPEN) {
    return;
  }

  const updates = [...tracksById.values()].filter((track) => matchesFilter(track, client));
  send(client.socket, { type: 'tracks.batch', updates });
}

function matchesFilter(track: TrackUpdate, client: ClientSession) {
  const sourceOk = !client.sources || client.sources.has(track.source);
  const bbox = client.bbox;

  const bboxOk =
    !bbox ||
    (track.lat >= bbox.minLat &&
      track.lat <= bbox.maxLat &&
      track.lng >= bbox.minLng &&
      track.lng <= bbox.maxLng);

  return sourceOk && bboxOk;
}

function resetClientTimer(client: ClientSession) {
  if (client.timer) {
    clearInterval(client.timer);
  }

  client.timer = setInterval(() => {
    broadcastToClient(client);
  }, client.broadcastIntervalMs);
}

function rateHzToMs(rateHz: number) {
  return Math.max(1, Math.floor(1000 / rateHz));
}

function clampRate(rateHz: number) {
  if (!Number.isFinite(rateHz) || rateHz <= 0) {
    return DEFAULT_RATE_HZ;
  }
  return Math.min(MAX_RATE_HZ, rateHz);
}

function send(socket: WebSocket, payload: unknown) {
  socket.send(JSON.stringify(payload));
}

function isAuthorizedHttp(req: IncomingMessage) {
  const headerSecret = req.headers['x-app-secret'];
  return typeof headerSecret === 'string' && headerSecret === APP_SECRET;
}

function isAuthorizedWs(req: IncomingMessage) {
  const reqUrl = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
  const token = reqUrl.searchParams.get('token');
  const headerSecret = req.headers['x-app-secret'];

  return token === APP_SECRET || headerSecret === APP_SECRET;
}

function parseJson(value: string) {
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function readBody(req: IncomingMessage) {
  return new Promise<string>((resolve, reject) => {
    let data = '';

    req.on('data', (chunk) => {
      data += chunk;
    });

    req.on('end', () => {
      resolve(data);
    });

    req.on('error', (error) => {
      reject(error);
    });
  });
}

function json(res: ServerResponse, statusCode: number, payload: unknown) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

server.listen(PORT, () => {
  console.log(`[api] listening on http://localhost:${PORT}`);
  console.log('[api] WebSocket auth supports ?token=<APP_SECRET> or x-app-secret header.');
});
