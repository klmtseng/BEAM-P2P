import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const mountApp = () => {
  const rootElement = document.getElementById('root');
  if (!rootElement) return;

  try {
    const root = createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (error) {
    console.error("Mount error:", error);
    showErrorUI(error);
  }
};

const showErrorUI = (error: any) => {
  const rootElement = document.getElementById('root');
  if (!rootElement) return;
  
  const errorMsg = error instanceof Error ? error.message : JSON.stringify(error) || String(error);
  
  rootElement.innerHTML = `
    <div class="error-overlay">
      <div style="background: #1e1b4b; padding: 2rem; border-radius: 1.5rem; border: 1px solid #3730a3; max-width: 400px; text-align: left; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
        <h2 style="color: #ef4444; margin-bottom: 1rem; font-weight: 800; font-size: 1.5rem;">STARTUP FAILURE</h2>
        <p style="color: #94a3b8; font-size: 0.875rem; margin-bottom: 1rem; line-height: 1.6;">
          The application kernel failed to initialize. This usually happens due to script resolution errors or incompatible browser versions.
        </p>
        <div style="background: #000; padding: 1rem; border-radius: 0.75rem; font-family: monospace; font-size: 0.75rem; color: #ef4444; margin-bottom: 1.5rem; overflow-x: auto; white-space: pre-wrap; border: 1px solid #450a0a;">${errorMsg}</div>
        <button onclick="window.location.reload()" style="width: 100%; background: #4f46e5; color: white; border: none; padding: 1rem; border-radius: 1rem; font-weight: 800; cursor: pointer; text-transform: uppercase; letter-spacing: 0.05em; transition: background 0.2s;">Retry Connection</button>
      </div>
    </div>
  `;
};

// Use a more robust loading check
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  mountApp();
} else {
  document.addEventListener('DOMContentLoaded', mountApp);
}

// Global listener for script errors
window.onerror = (message, source, lineno, colno, error) => {
  console.error("Critical Runtime Error:", message);
  // Only show UI if the root is empty (initial crash)
  const root = document.getElementById('root');
  if (root && !root.hasChildNodes()) {
    showErrorUI(error || message);
  }
  return false;
};

window.onunhandledrejection = (event) => {
  console.error("Unhandled Promise Rejection:", event.reason);
};