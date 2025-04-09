// frontend/src/main.jsx (or .js) - Corrected
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.js'; // Assuming App.js
// --- ThemeProvider and theme are removed from here ---
// --- CssBaseline is removed from here (will be applied inside App) ---
import { AuthProvider } from './context/AuthContext.js'; // Assuming AuthContext.js

const rootElement = document.getElementById('root');
const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    {/* Only wrap with providers that DON'T depend on App's internal state */}
    <AuthProvider>
      <App /> {/* App component will now manage ThemeProvider */}
    </AuthProvider>
  </React.StrictMode>
);