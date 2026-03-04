import { IngestMessageSchema, type TrackUpdate } from '@geo-globe/shared';

const INGEST_INTERVAL_MS = 2000;
const API_INGEST_URL = process.env.API_INGEST_URL ?? 'http://localhost:8080/internal/ingest';
const APP_SECRET = process.env.APP_SECRET ?? 'dev-secret';
const MOCK_TRACKS_COUNT = Math.max(1, Number(process.env.MOCK_TRACKS_COUNT ?? 5000));
const SOURCE = 'mock-ingest';

const tracks = Array.from({ length: MOCK_TRACKS_COUNT }, (_, index) => createInitialTrack(index));

function createInitialTrack(index: number): TrackUpdate {
  const row = Math.floor(index / 100);
  const col = index % 100;

  return {
    trackId: `track-${String(index + 1).padStart(6, '0')}`,
    source: SOURCE,
    timestamp: new Date().toISOString(),
    lat: -60 + row * 0.2,
    lng: -150 + col * 0.35,
    label: `Mock Track ${index + 1}`
  };
}

function stepTracks(timestamp: string) {
  for (let index = 0; index < tracks.length; index += 1) {
    const phase = index * 0.01 + Date.now() / 10_000;
    const latDelta = Math.sin(phase) * 0.02;
    const lngDelta = Math.cos(phase) * 0.03;
    const track = tracks[index];

    track.lat = clamp(track.lat + latDelta, -85, 85);
    track.lng = wrapLng(track.lng + lngDelta);
    track.timestamp = timestamp;
  }
}

function wrapLng(lng: number) {
  if (lng > 180) {
    return lng - 360;
  }
  if (lng < -180) {
    return lng + 360;
  }
  return lng;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

async function publishBatch() {
  const timestamp = new Date().toISOString();
  stepTracks(timestamp);

  const payload = {
    source: SOURCE,
    timestamp,
    points: tracks.map((track) => ({
      id: track.trackId,
      lat: track.lat,
      lng: track.lng,
      label: track.label
    }))
  };

  const validation = IngestMessageSchema.safeParse(payload);
  if (!validation.success) {
    console.error('[ingest] generated payload validation failed', validation.error.flatten());
    return;
  }

  const response = await fetch(API_INGEST_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-app-secret': APP_SECRET
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const body = await response.text();
    console.error(`[ingest] publish failed (${response.status}): ${body}`);
    return;
  }

  console.log(`[ingest] published ${payload.points.length} tracks at ${timestamp}`);
}

async function runTick() {
  try {
    await publishBatch();
  } catch (error) {
    console.error('[ingest] unexpected publish error', error);
  }
}

console.log(`[ingest] mock publisher started, tracks=${MOCK_TRACKS_COUNT}, intervalMs=${INGEST_INTERVAL_MS}`);
void runTick();
setInterval(() => {
  void runTick();
}, INGEST_INTERVAL_MS);
