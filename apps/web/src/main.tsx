import { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { Viewer } from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';

import { addTilesetToScene, createCesiumViewer } from './cesium/setupCesium';
import { getGoogleTileApiKey, loadPhotorealisticTiles } from './cesium/photorealisticTiles';

type ConnectionState = 'connecting' | 'connected' | 'error';

function App() {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<ConnectionState>('connecting');
  const [message, setMessage] = useState('Initializing Cesium...');

  useEffect(() => {
    let viewer: Viewer | undefined;

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

        setStatus('connected');
        setMessage('3D tiles are loaded.');
      } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        console.error('Failed to initialize globe:', error);
        setStatus('error');
        setMessage(detail);
      }
    }

    void boot();

    return () => {
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
        <p style={{ margin: 0, fontWeight: 700 }}>Filter panel (placeholder)</p>
        <p style={{ margin: '4px 0 0 0', opacity: 0.9 }}>Filtering controls will be added here.</p>
      </section>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
