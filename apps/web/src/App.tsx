import { useEffect, useRef, useState } from 'react';
import type { Cesium3DTileset, Viewer } from 'cesium';
import { applyFilters, createViewer } from './lib/cesium';

export const App = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [viewer, setViewer] = useState<Viewer | null>(null);
  const [tileset, setTileset] = useState<Cesium3DTileset | null>(null);
  const [showTiles, setShowTiles] = useState(true);
  const [showWireframe, setShowWireframe] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let mounted = true;

    createViewer(containerRef.current)
      .then(({ viewer: nextViewer, tileset: nextTileset }) => {
        if (!mounted) {
          nextViewer.destroy();
          return;
        }

        setViewer(nextViewer);
        setTileset(nextTileset);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to initialize Cesium viewer.');
      });

    return () => {
      mounted = false;
      setViewer((activeViewer) => {
        activeViewer?.destroy();
        return null;
      });
    };
  }, []);

  useEffect(() => {
    if (!tileset) return;
    applyFilters(tileset, showTiles, showWireframe);
  }, [tileset, showTiles, showWireframe]);

  return (
    <main className="app-shell">
      <section className="filters-panel" aria-label="Filters panel">
        <h1>Globe Optics</h1>
        <p>Google Photorealistic 3D Tiles</p>

        <label>
          <input
            type="checkbox"
            checked={showTiles}
            onChange={(event) => setShowTiles(event.target.checked)}
          />
          Show tileset
        </label>

        <label>
          <input
            type="checkbox"
            checked={showWireframe}
            onChange={(event) => setShowWireframe(event.target.checked)}
          />
          Wireframe debug
        </label>

        {error && <p className="error">{error}</p>}
      </section>

      <section className="viewer-panel">
        <div ref={containerRef} className="viewer-canvas" />
      </section>
    </main>
  );
};
