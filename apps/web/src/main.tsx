import React from 'react';
import ReactDOM from 'react-dom/client';
import { z } from 'zod';
import { HealthSchema } from '@globe-optics/shared';

const payload = HealthSchema.parse({ service: 'web', status: 'ok' });
const payloadSchema = z.object({
  service: z.string(),
  status: z.string(),
});

function App() {
  return (
    <main style={{ fontFamily: 'sans-serif', padding: 24 }}>
      <h1>Globe Optics Monorepo</h1>
      <p>
        Web app is running. Shared payload: <code>{JSON.stringify(payload)}</code>
      </p>
      <p>Client schema keys: {Object.keys(payloadSchema.shape).join(', ')}</p>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
