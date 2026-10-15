// Local preview that mimics Cloudflare Pages clean URLs (/about -> about.html, /dir/ -> dir/index.html).
// Usage: node serve.mjs [port]
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, dirname } from 'node:path';

const root = join(dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), 'public');
const port = Number(process.argv[2]) || 8788;
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.svg': 'image/svg+xml', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8' };
const isFile = (p) => stat(p).then((s) => s.isFile(), () => false);

createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (path.includes('..')) { res.writeHead(404).end('Not found'); return; }
  const base = join(root, path);
  const tries = path.endsWith('/') ? [join(base, 'index.html')] : [base, base + '.html'];
  for (const f of tries) {
    if (await isFile(f)) {
      res.writeHead(200, { 'content-type': types[extname(f)] || 'application/octet-stream' });
      res.end(await readFile(f));
      return;
    }
  }
  if (!path.endsWith('/') && await isFile(join(base, 'index.html'))) { res.writeHead(308, { location: path + '/' }).end(); return; }
  res.writeHead(404, { 'content-type': 'text/plain' }).end('404: ' + path + ' (page not in this repo yet)');
}).listen(port, () => console.log(`KAI preview on http://localhost:${port}`));
