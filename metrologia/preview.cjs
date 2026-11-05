const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8' };
const allowed = new Set(['index.html', 'styles.css', 'engine.js', 'instruments.js', 'app.js']);
http.createServer((request, response) => {
  let requested;
  try { requested = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname).replace(/^\//, '') || 'index.html'; }
  catch { response.writeHead(400); response.end(); return; }
  if (requested === 'favicon.ico') { response.writeHead(204); response.end(); return; }
  if (!allowed.has(requested)) { response.writeHead(404); response.end('Arquivo não encontrado.'); return; }
  try {
    response.writeHead(200, { 'Content-Type': types[path.extname(requested)], 'Cache-Control': 'no-store' });
    response.end(fs.readFileSync(path.join(__dirname, requested)));
  } catch { response.writeHead(503); response.end('Não foi possível carregar a prévia.'); }
}).listen(8745, '127.0.0.1', () => console.log('http://127.0.0.1:8745/'));
