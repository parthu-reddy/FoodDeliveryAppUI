import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import pino from 'pino';
import pinoHttp from 'pino-http';
import { createServer as createViteServer } from 'vite';

const app = express();
const logger = pino();
app.use(pinoHttp({ logger, autoLogging: false })); // autoLogging: false to reduce noise, or true if we want all requests
app.use(helmet({
  contentSecurityPolicy: false // Disabled for Vite dev server compat; re-enable with strict config in production if needed
}));
app.use(cors({
  origin: process.env.CORS_ALLOWED_ORIGINS ? process.env.CORS_ALLOWED_ORIGINS.split(',') : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '100kb' })); // Secure payload size

const logsLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  message: { success: false, message: 'Too many log requests from this IP' }
});

const PORT = Number(process.env.PORT) || 3000;
const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:8080';

// Intercept Ola Maps style.json to remove the sprite URL which is currently returning 404 from Ola Maps
app.get('/olamaps/tiles/vector/v1/styles/:styleId/style.json', async (req, res) => {
  try {
    const styleId = req.params.styleId;
    const fetchUrl = `${API_GATEWAY_URL}/olamaps/tiles/vector/v1/styles/${styleId}/style.json`;
    // eslint-disable-next-line no-restricted-syntax
    const response = await fetch(fetchUrl);
    if (!response.ok) {
      return res.status(response.status).send(await response.text());
    }
    const data = await response.json() as { sprite?: string };
    if (data.sprite) {
      delete data.sprite;
    }
    res.json(data);
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch Ola Maps style via API Gateway');
    res.status(502).json({ success: false, message: 'Failed to fetch Ola Maps style via API Gateway' });
  }
});

// Proxy all /olamaps/** requests to the API Gateway
app.use(
  '/olamaps',
  createProxyMiddleware({
    target: API_GATEWAY_URL,
    changeOrigin: true,
    // Do not strip /olamaps since ApiGateway expects it for its routing
    on: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      error: (err, req, res: any) => {
        logger.error({ err }, `[proxy] Error forwarding Ola Maps request via API Gateway: ${err.message}`);
        if (res && res.writeHead) {
          res.writeHead(502, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'API Gateway unreachable for Ola Maps: ' + err.message }));
        }
      },
    },
  })
);

// Ingest frontend logs
app.post('/api/logs', logsLimiter, (req, res) => {
  if (!req.headers.authorization) {
    return res.status(401).send({ success: false, message: 'Unauthorized' });
  }
  const { logs } = req.body;
  if (Array.isArray(logs)) {
    logs.forEach(log => {
      // Whitelist fields to prevent prototype pollution or large junk data
      const safeData = {
        message: String(log.message).substring(0, 500),
        stack: log.stack ? String(log.stack).substring(0, 2000) : undefined,
        context: log.context,
      };

      if (log.level === 'WARN') {
        logger.warn({ frontend: true, ...safeData }, `[Frontend] ${safeData.message}`);
      } else if (log.level === 'ERROR') {
        logger.error({ frontend: true, ...safeData }, `[Frontend] ${safeData.message}`);
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        error: (err, req: express.Request, res: any) => {
          logger.error({ err }, `[proxy] Error forwarding ${req.method} ${req.url}: ${err.message}`);
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
