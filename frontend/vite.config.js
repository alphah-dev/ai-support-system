// frontend/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    // React plugin configuration (keep existing if it was working)
    react({
       babel: {
         plugins: ['@babel/plugin-transform-react-jsx'],
       },
    }),
  ],
  // esbuild configuration to handle JSX in .js files
  esbuild: {
    loader: 'jsx',
    include: [
      /src\/.*\.js$/, // Target .js files in src
      /src\/.*\.jsx$/, // Target .jsx files in src
    ],
    exclude: [], // Typically node_modules is excluded by default, this is fine
  },
   // optimizeDeps configuration (keep existing)
   optimizeDeps: {
     esbuildOptions: {
       loader: {
         '.js': 'jsx',
       },
     },
   },
   // --- ADDED Server Configuration ---
   server: {
     host: true, // Listen on all addresses, helpful for network access like Ngrok
     port: 5173, // Keep default Vite port or change if needed
     strictPort: true, // Optional: Fail if port is already in use
     hmr: { // Hot Module Replacement settings
        overlay: true // Show errors directly in the browser overlay
     },
     // --- Allow requests from Ngrok ---
     allowedHosts: [
         'localhost', // Standard localhost
         '127.0.0.1', // Standard loopback
         '.ngrok-free.app' // <<<--- Allow ngrok free subdomains (wildcard)
         // Add other specific hosts if needed, e.g., your local network IP
         // '192.168.1.100'
     ]
     // --------------------------------
   }
   // ----------------------------------
})