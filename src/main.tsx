import React from 'react';
import { createRoot } from 'react-dom/client';
import { Studio } from './components/studio/studio';
import './styles.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element #root was not found.');
}

createRoot(rootElement).render(
  <React.StrictMode>
    <Studio />
  </React.StrictMode>,
);
