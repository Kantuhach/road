import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/** Dev server & `vite preview` — forward API/WebSocket/uploads to the Node backend (default port 8080). */
const devBackendProxy = {
  '/api': {
    target: 'http://localhost:8080',
    changeOrigin: true
  },
  '/ws/accidents': {
    target: 'http://localhost:8080',
    ws: true,
    changeOrigin: true
  },
  '/uploads': {
    target: 'http://localhost:8080',
    changeOrigin: true
  }
};

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'redirect-root-to-index',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/') {
            req.url = '/index.html';
          }
          next();
        });
      }
    }
  ],
  define: {
    global: 'globalThis'
  },
  server: {
    port: 3000,
    proxy: devBackendProxy
  },
  preview: {
    proxy: devBackendProxy
  }
});
