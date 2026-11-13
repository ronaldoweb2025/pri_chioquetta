import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist');
const port = Number(process.env.PORT || 4173);
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.txt':'text/plain; charset=utf-8','.xml':'application/xml'};
http.createServer(async (request, response) => {
  if (!['GET','HEAD'].includes(request.method)) {response.writeHead(405, {Allow:'GET, HEAD'});response.end();return;}
  try {
    const pathname = decodeURIComponent(new URL(request.url,'http://localhost').pathname);
    const target = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!target.startsWith(root + path.sep)) throw new Error('Invalid path');
    const body = await fs.readFile(target);
    response.writeHead(200, {'Content-Type':types[path.extname(target)] || 'application/octet-stream','Cache-Control':'no-store'});
    response.end(request.method === 'HEAD' ? undefined : body);
  } catch {response.writeHead(404, {'Content-Type':'text/plain; charset=utf-8'});response.end('Arquivo não encontrado.');}
}).listen(port, '127.0.0.1', () => console.log(`Local: http://127.0.0.1:${port}`));
