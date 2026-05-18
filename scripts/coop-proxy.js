const http = require('http');
const httpProxy = require('http-proxy');

const target = process.env.COOP_PROXY_TARGET || 'http://localhost:8081';
const port = Number(process.env.COOP_PROXY_PORT || 8082);

const proxy = httpProxy.createProxyServer({
  target,
  ws: true,
  changeOrigin: true,
});

proxy.on('proxyRes', (proxyRes) => {
  proxyRes.headers['cross-origin-opener-policy'] = 'same-origin';
  proxyRes.headers['cross-origin-embedder-policy'] = 'require-corp';
});

proxy.on('error', (err, _req, res) => {
  const message = err instanceof Error ? err.message : String(err);
  if (res && !res.headersSent) {
    res.writeHead(502, { 'Content-Type': 'text/plain' });
  }
  if (res && 'end' in res) {
    res.end(`Proxy error: ${message}`);
  }
});

const server = http.createServer((req, res) => {
  proxy.web(req, res);
});

server.on('upgrade', (req, socket, head) => {
  proxy.ws(req, socket, head);
});

server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`[coop-proxy] Forwarding ${target} -> http://localhost:${port}`);
});
