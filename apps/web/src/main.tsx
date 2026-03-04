import { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { Cartesian3, Color, Viewer } from 'cesium';
import type { TrackUpdate } from '@geo-globe/shared';
import 'cesium/Build/Cesium/Widgets/widgets.css';

import { addTilesetToScene, createCesiumViewer } from './cesium/setupCesium';
import { getGoogleTileApiKey, loadPhotorealisticTiles } from './cesium/photorealisticTiles';

type ConnectionState = 'connecting' | 'connected' | 'error';
type BatchMessage = { type: 'tracks.batch'; updates: TrackUpdate[] };

const WS_URL = import.meta.env.VITE_API_WS_URL ?? 'ws://localhost:8080?token=dev-secret';

function App() {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<ConnectionState>('connecting');
  const [message, setMessage] = useState('Initializing Cesium...');
  const [trackCount, setTrackCount] = useState(0);

  useEffect(() => {
    let viewer: Viewer | undefined;
    let socket: WebSocket | undefined;
    const entityIds = new Set<string>();

    async function boot() {
      if (!mapRef.current) {
        return;
      }

      try {
        setStatus('connecting');
        setMessage('Connecting to Google Photorealistic 3D Tiles...');

        const apiKey = getGoogleTileApiKey();
        viewer = await createCesiumViewer(mapRef.current);
        const tileset = await loadPhotorealisticTiles(apiKey);
        await addTilesetToScene(viewer, tileset);

        setMessage('3D tiles are loaded. Connecting to track stream...');
        socket = connectTrackStream((updates) => {
          if (!viewer) {
            return;
          }

          for (const update of updates) {
            const entity = viewer.entities.getById(update.trackId);

            if (entity) {
              entity.position = Cartesian3.fromDegrees(update.lng, update.lat, 200);
              entity.name = update.label;
            } else {
              viewer.entities.add({
                id: update.trackId,
                name: update.label,
                position: Cartesian3.fromDegrees(update.lng, update.lat, 200),
                point: {
                  color: Color.CYAN,
                  pixelSize: 5
                }
              });
              entityIds.add(update.trackId);
            }
          }

          setTrackCount(entityIds.size);
          setStatus('connected');
          setMessage('Receiving live track updates.');
        });
      } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        console.error('Failed to initialize globe:', error);
        setStatus('error');
        setMessage(detail);
      }
    }

    void boot();

    return () => {
      if (socket) {
        socket.close();
      }

      if (viewer && !viewer.isDestroyed()) {
        viewer.destroy();
      }
    };
  }, []);

  return (
    <main style={{ height: '100vh', width: '100vw', position: 'relative', overflow: 'hidden' }}>
      <div ref={mapRef} style={{ height: '100%', width: '100%' }} />

      <section
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          background: 'rgba(15, 23, 42, 0.82)',
          color: '#e2e8f0',
          borderRadius: 8,
          padding: '12px 14px',
          width: 320,
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 14,
          backdropFilter: 'blur(4px)'
        }}
      >
        <h1 style={{ margin: 0, fontSize: 18 }}>Globe Status</h1>
        <p style={{ margin: '8px 0 0 0' }}>
          <strong>Connection:</strong> {status}
        </p>
        <p style={{ margin: '4px 0 0 0', lineHeight: 1.35 }}>{message}</p>

        <hr style={{ border: 0, borderTop: '1px solid rgba(148, 163, 184, 0.4)', margin: '12px 0' }} />
        <p style={{ margin: 0 }}>
          <strong>Rendered tracks:</strong> {trackCount}
        </p>
      </section>
    </main>
  );
}

function connectTrackStream(onBatch: (updates: TrackUpdate[]) => void) {
  const socket = new WebSocket(WS_URL);

  socket.addEventListener('open', () => {
    socket.send(JSON.stringify({ type: 'hello', maxRateHz: 1 }));
  });

  socket.addEventListener('message', (event) => {
    const parsed = parseMessage(event.data);
    if (parsed?.type === 'tracks.batch') {
      onBatch(parsed.updates);
    }
  });

  socket.addEventListener('close', () => {
    console.warn('[web] track websocket closed');
  });

  return socket;
}

function parseMessage(value: unknown): BatchMessage | null {
  if (typeof value !== 'string') {
    return null;
  }

  try {
    return JSON.parse(value) as BatchMessage;
  } catch {
    return null;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
