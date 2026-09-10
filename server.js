const { createServer } = require('http');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    // Rota direta de healthcheck para o proxy Traefik/Easypanel
    if (req.url === '/health' || req.url === '/healthz' || req.url === '/api/health') {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ status: 'ok', uptime: process.uptime() }));
      return;
    }

    try {
      await handle(req, res);
    } catch (err) {
      console.error('Erro na requisição:', req.url, err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });

  server.listen(port, hostname, () => {
    console.log(`> Servidor Falco Licitações pronto em http://${hostname}:${port}`);
  });
});
