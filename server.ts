import express from 'express';
import path from 'path';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import { createProxyMiddleware } from 'http-proxy-middleware';
import pino from 'pino';
import pinoHttp from 'pino-http';

const app = express();
const logger = pino();
app.use(pinoHttp({ logger, autoLogging: false })); // autoLogging: false to reduce noise, or true if we want all requests
app.use(cors());
app.use(express.json());

const PORT = Number(process.env.PORT) || 3000;
const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:8080';

// Ingest frontend logs
app.post('/api/logs', (req, res) => {
  const { logs } = req.body;
  if (Array.isArray(logs)) {
    logs.forEach(log => {
      if (log.level === 'WARN') {
        logger.warn({ frontend: true, ...log.data }, `[Frontend] ${log.message}`);
      } else if (log.level === 'ERROR') {
        logger.error({ frontend: true, ...log.data }, `[Frontend] ${log.message}`);
      }
    });
  }
  res.status(200).send({ success: true });
});

// Proxy all /api/** requests to the API Gateway
app.use(
  '/api',
  createProxyMiddleware({
    target: API_GATEWAY_URL,
    changeOrigin: true,
      on: {
        proxyReq: (proxyReq, req: express.Request) => {
          // Forward original host for CORS
          if (req.headers.authorization) {
            proxyReq.setHeader('Authorization', req.headers.authorization);
          }
        },
        error: (err, req: express.Request, res: express.Response) => {
          console.error(`[proxy] Error forwarding ${req.method} ${req.url}:`, err.message);
          if (res && res.writeHead) {
            res.writeHead(502, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: 'API Gateway unreachable: ' + err.message }));
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

  // Global Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.error(err, 'Unhandled Express Exception');
    if (res.headersSent) {
      return next(err);
    }
    res.status(500).json({
      success: false,
      message: 'Internal Server Error' // Hides stack trace from client
    });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Proxying /api/* → ${API_GATEWAY_URL}`);
  });
}

startServer();
