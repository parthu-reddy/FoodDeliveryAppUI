import express from 'express';
import path from 'path';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = Number(process.env.PORT) || 3000;
const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:8080';

// Proxy all /api/** requests to the API Gateway
app.use(
  '/api',
  createProxyMiddleware({
    target: API_GATEWAY_URL,
    changeOrigin: true,
    on: {
      proxyReq: (proxyReq, req) => {
        // Forward original host for CORS
        if ((req as any).headers.authorization) {
          proxyReq.setHeader('Authorization', (req as any).headers.authorization);
        }
      },
      error: (err, req, res) => {
        console.error(`[proxy] Error forwarding ${(req as any).method} ${(req as any).url}:`, err.message);
        if (res && 'writeHead' in res) {
          (res as any).writeHead(502, { 'Content-Type': 'application/json' });
          (res as any).end(JSON.stringify({ success: false, message: 'API Gateway unreachable: ' + err.message }));
        }
      },
    },
  })
);

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Proxying /api/* → ${API_GATEWAY_URL}`);
  });
}

startServer();
