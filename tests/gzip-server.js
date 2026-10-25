#!/usr/bin/env node
// Local stand-in for GitHub Pages: a /ByteRyte/ path with gzip for text.
const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const root = path.resolve(process.argv[2] || '/tmp/byteryte-pages');
const port = Number(process.argv[3] || 8881);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};
const gzipExt = new Set(['.html', '.js', '.css', '.webmanifest', '.svg']);
const server = http.createServer((req, res) => {
  let rel = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
  if (rel.endsWith('/')) rel += 'index.html';
  const file = path.resolve(root, '.' + rel);
  if (file !== root && !file.startsWith(root + path.sep)) { res.writeHead(403); res.end(); return; }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404); res.end('not found'); return; }
    const ext = path.extname(file);
    const headers = { 'Content-Type': types[ext] || 'application/octet-stream', 'Cache-Control': 'no-cache' };
    if (req.method === 'HEAD') { res.writeHead(200, headers); res.end(); return; }
    if (!gzipExt.has(ext) || !/\bgzip\b/.test(req.headers['accept-encoding'] || '')) {
      headers['Content-Length'] = buf.length;
      res.writeHead(200, headers);
      res.end(buf);
      return;
    }
    zlib.gzip(buf, (e, gz) => {
      if (e) { res.writeHead(500); res.end(); return; }
      headers['Content-Encoding'] = 'gzip';
      headers['Vary'] = 'Accept-Encoding';
      headers['Content-Length'] = gz.length;
      res.writeHead(200, headers);
      res.end(gz);
    });
  });
});
server.listen(port, '127.0.0.1');
