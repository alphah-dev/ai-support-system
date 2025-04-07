// frontend/src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.js'; // Import our main App component
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme.js'; // Import our custom theme

// Find the root element in index.html
const rootElement = document.getElementById('root');
// Create a React root attached to that element
const root = ReactDOM.createRoot(rootElement);

// Render the application
root.render(
  <React.StrictMode>
    {/* Apply the custom theme and CSS baseline globally */}
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App /> {/* Render the main application component */}
    </ThemeProvider>
  </React.StrictMode>
);