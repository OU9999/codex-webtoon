import React from 'react';
import { createRoot } from 'react-dom/client';
import { ProjectShell } from './components/project-shell';
import './styles.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element #root was not found.');
}

createRoot(rootElement).render(
  <React.StrictMode>
    <ProjectShell />
  </React.StrictMode>,
);
