
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
      <div style="background: #1e1b4b; padding: 2rem; border-radius: 1.5rem; border: 1px solid #3730a3; max-width: 400px; text-align: left;">
        <h2 style="color: #ef4444; margin-bottom: 1rem; font-weight: 800; font-size: 1.5rem;">STARTUP FAILURE</h2>
        <p style="color: #94a3b8; font-size: 0.875rem; margin-bottom: 1rem; line-height: 1.6;">
          The application kernel failed to initialize. This usually happens due to network restrictions, incompatible browser modules, or ESM resolution errors.
        </p>
        <div style="background: #000; padding: 1rem; border-radius: 0.75rem; font-family: monospace; font-size: 0.75rem; color: #ef4444; margin-bottom: 1.5rem; overflow-x: auto; white-space: pre-wrap;">${errorMsg}</div>
        <button onclick="window.location.reload()" style="width: 100%; background: #4f46e5; color: white; border: none; padding: 1rem; border-radius: 1rem; font-weight: 800; cursor: pointer; text-transform: uppercase; letter-spacing: 0.05em;">Retry Connection</button>
      </div>
    </div>
  `;
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountApp);
} else {
  mountApp();
}

// Global listener for script errors - Improved serialization to avoid [object Object]
window.onerror = (message, source, lineno, colno, error) => {
  const errorInfo = {
    message: String(message),
    source: String(source),
    lineno,
    colno,
    stack: error instanceof Error ? error.stack : 'No stack available'
  };
  console.error("Global Error Caught:", JSON.stringify(errorInfo, null, 2));
  return false;
};

// Catch unhandled promise rejections
window.onunhandledrejection = (event) => {
  console.error("Unhandled Rejection:", event.reason);
};
