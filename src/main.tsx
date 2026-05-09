import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app';
import { StudioShell } from './features/studio/studio-shell';
import './styles.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element #root was not found.');
}

createRoot(rootElement).render(
  <React.StrictMode>
    <StudioShell>
      <App />
    </StudioShell>
  </React.StrictMode>,
);
