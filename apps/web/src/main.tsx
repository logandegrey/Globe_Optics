import React from 'react';
import ReactDOM from 'react-dom/client';
import { GlobePointSchema } from '@geo-globe/shared';

const samplePoint = GlobePointSchema.parse({
  id: 'sample-1',
  lat: 48.8566,
  lng: 2.3522,
  label: 'Paris'
});

function App() {
  return (
    <main style={{ fontFamily: 'sans-serif', padding: '2rem' }}>
      <h1>Geo Globe</h1>
      <p>Monorepo scaffold is ready.</p>
      <pre>{JSON.stringify(samplePoint, null, 2)}</pre>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
