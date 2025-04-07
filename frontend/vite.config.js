// frontend/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    // Ensure the react plugin is configured to handle JSX in JS files
    // This might involve passing options, depending on the plugin version.
    // The default settings usually enable this, but let's be explicit.
    react({
       // This ensures babel plugin necessary for React is included
       babel: {
         plugins: ['@babel/plugin-transform-react-jsx'],
       },
       // Attempt to force esbuild to handle .js as jsx for this plugin too
       // Although the top-level esbuild config should be sufficient
       // esbuildOptions: {
       //  loader: 'jsx',
       // include: /src\/.*\.js$/, // Regex to target .js in src
       // },
    }),
  ],
  // Explicitly configure esbuild (this should be the main fix)
  esbuild: {
    loader: 'jsx', // Use jsx loader for files matched by include
    include: [
      // This regex targets all .js files within the src directory
      /src\/.*\.js$/,
      // Include standard .jsx as well
      /src\/.*\.jsx$/,
    ],
    exclude: [], // Don't exclude anything explicitly here for now
  },
   // Optional: Add optimizeDeps as a fallback if above fails
   optimizeDeps: {
     esbuildOptions: {
       loader: {
         '.js': 'jsx', // Ensure pre-bundling also treats .js as jsx
       },
     },
   },
})