// Servidor estático mínimo — Node puro, zero dependências.
// Serve dist/ com fallback SPA. Porta: $PORT (EasyPanel) ou 80.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';

const DIST = join(process.cwd(), 'dist');
const PORT = Number(process.env.PORT) || 80;
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif',
  '.webp': 'image/webp', '.avif': 'image/avif', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf',
  '.map': 'application/json', '.txt': 'text/plain', '.webmanifest': 'application/manifest+json',
};

async function isFile(p) {
  try { return (await stat(p)).isFile() ? p : null; } catch { return null; }
}

const server = createServer(async (req, res) => {
  try {
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    let filePath = normalize(join(DIST, urlPath));
    if (!filePath.startsWith(DIST)) { res.writeHead(403); return res.end('forbidden'); }
    let hit =
      (await isFile(filePath)) ||
      (urlPath.endsWith('/') ? await isFile(join(filePath, 'index.html')) : null) ||
      join(DIST, 'index.html'); // fallback SPA
    const body = await readFile(hit);
    const ext = extname(hit).toLowerCase();
    res.writeHead(200, {
      'content-type': MIME[ext] || 'application/octet-stream',
      'cache-control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
    });
    res.end(body);
  } catch {
    res.writeHead(500);
    res.end('server error');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[falco-licitacoes] servindo ${DIST} em http://0.0.0.0:${PORT}`);
});
