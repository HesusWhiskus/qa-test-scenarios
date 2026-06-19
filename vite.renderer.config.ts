import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/** Electron ładuje renderer przez file:// — crossorigin na <script> powoduje biały ekran (CORS). */
function stripCrossoriginForElectron(): Plugin {
  return {
    name: 'strip-crossorigin-for-electron',
    transformIndexHtml(html) {
      return html.replace(/\s+crossorigin(="[^"]*")?/g, '');
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [react(), stripCrossoriginForElectron()],
  build: {
    modulePreload: false,
  },
});
