import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './tokens/tokens.css';

const root = document.getElementById('root');
if (root) {
  // Clear placeholder content
  root.innerHTML = '';
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
