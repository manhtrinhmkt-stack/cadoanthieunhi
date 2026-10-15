import { app } from './app';
import { createServer as createViteServer } from 'vite';

// Vite Middleware for Local Development Mode in AI Studio / Node
if (process.env.NODE_ENV !== 'production') {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'custom',
  });
  app.use(vite.middlewares);
  app.use('*', async (req, res, next) => {
    try {
      const fs = await import('fs');
      const path = await import('path');
      let template = fs.readFileSync(path.resolve('./index.html'), 'utf-8');
      template = await vite.transformIndexHtml(req.originalUrl, template);
      res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
    } catch (e) {
      next(e);
    }
  });
} else {
  const path = await import('path');
  const expressStatic = (await import('express')).default.static;
  app.use(expressStatic('dist'));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve('./dist/index.html'));
  });
}

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Cantus App Server] Running at http://0.0.0.0:${PORT}`);
});
