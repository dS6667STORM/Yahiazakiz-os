import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createBareServer } from '@tomphttp/bare-server-node';
import { server as wisp } from '@mercuryworkshop/wisp-js/server';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 10000;
const HOST = '0.0.0.0';
const BARE_PATH = process.env.BARE_PATH || '/tspmo/';
const WISP_PATH = '/wisp/';
const HTML_FILE = path.join(__dirname, 'index.html');
const bare = createBareServer(BARE_PATH);

try {
  if (wisp.options) {
    wisp.options.allow_private_ips = false;
    wisp.options.allow_loopback_ips = false;
    wisp.options.allow_udp_streams = false;
    wisp.options.stream_limit_total = 64;
    wisp.options.stream_limit_per_host = 8;
  }
} catch {}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8'
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, {
    'X-Content-Type-Options': 'nosniff',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': '*',
    ...headers
  });
  res.end(body);
}

function sameOriginOrNoOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  try {
    return new URL(origin).host === req.headers.host;
  } catch {
    return false;
  }
}

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204, '');

  if (req.url === '/health' || req.url === '/api/health') {
    return send(res, 200, JSON.stringify({
      ok: true,
      service: 'yahiazakiz-os',
      bare: BARE_PATH,
      wisp: WISP_PATH,
      html: fs.existsSync(HTML_FILE)
    }), { 'Content-Type': 'application/json' });
  }

  if (bare.shouldRoute(req)) {
    if (!sameOriginOrNoOrigin(req))
      return send(res, 403, 'Forbidden');
    return bare.routeRequest(req, res);
  }

  const pathname = new URL(
    req.url || '/',
    `http://${req.headers.host || 'localhost'}`
  ).pathname;

  if (pathname === '/' || pathname === '/index.html') {
    if (!fs.existsSync(HTML_FILE))
      return send(res, 500, 'index.html is missing');

    res.writeHead(200, {
      'Content-Type': MIME['.html'],
      'Cache-Control': 'no-cache'
    });

    return fs.createReadStream(HTML_FILE).pipe(res);
  }

  const decoded = decodeURIComponent(pathname);
  const filePath = path.resolve(__dirname, '.' + decoded);

  if (
    !filePath.startsWith(__dirname + path.sep) ||
    !fs.existsSync(filePath) ||
    !fs.statSync(filePath).isFile()
  ) {
    return send(res, 404, 'Not found');
  }

  const ext = path.extname(filePath).toLowerCase();

  res.writeHead(200, {
    'Content-Type': MIME[ext] || 'application/octet-stream'
  });

  fs.createReadStream(filePath).pipe(res);
});

server.on('upgrade', (req, socket, head) => {
  if (bare.shouldRoute(req)) {
    if (!sameOriginOrNoOrigin(req)) return socket.destroy();
    return bare.routeUpgrade(req, socket, head);
  }

  let pathname;

  try {
    pathname = new URL(
      req.url || '/',
      `http://${req.headers.host || 'localhost'}`
    ).pathname;
  } catch {
    return socket.destroy();
  }

  if (pathname !== WISP_PATH || !sameOriginOrNoOrigin(req))
    return socket.destroy();

  try {
    wisp.routeRequest(req, socket, head);
  } catch {
    socket.destroy();
  }
});

server.listen(PORT, HOST, () => {
  console.log(`YAHIAZAKIZ OS listening on ${PORT}`);
});

process.on('SIGTERM', () =>
  server.close(() => process.exit(0))
);
