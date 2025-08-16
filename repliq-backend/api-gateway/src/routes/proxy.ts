// src/routes/proxy.ts
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const router = express.Router();


import { services } from '../config/services';

// Only proxy enabled services
const proxyConfigs = services.filter(svc => svc.enabled).map(svc => ({ path: svc.path, target: svc.url }));

proxyConfigs.forEach(({ path, target }) => {
  router.use(
    path,
    createProxyMiddleware({
      target,
      changeOrigin: true,
      pathRewrite: (p) => p.replace(new RegExp(`^${path}`), ''),
    })
  );
});

export default router;
