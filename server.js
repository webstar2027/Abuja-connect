const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, 'public');
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.mp4': 'video/mp4'
};

const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent((req.url || '/').split('?')[0]);

  // On Render, inject public Supabase credentials from Environment settings.
  // On GitHub Pages, the static public/config.js file is used instead.
  if (pathname === '/config.js' && (process.env.SUPABASE_URL || process.env.SUPABASE_PUBLISHABLE_KEY)) {
    const config = {
      supabaseUrl: process.env.SUPABASE_URL || '',
      supabasePublishableKey: process.env.SUPABASE_PUBLISHABLE_KEY || ''
    };
    res.writeHead(200, {
      'Content-Type': 'text/javascript; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff'
    });
    return res.end('window.ABUJA_CONFIG = ' + JSON.stringify(config) + ';\n');
  }

  const requested = pathname === '/' ? '/index.html' : pathname;
  const file = path.normalize(path.join(root, requested));
  if (!file.startsWith(root + path.sep) && file !== path.join(root, 'index.html')) {
    res.writeHead(403);
    return res.end('Forbidden');
  }
  fs.readFile(file, (error, contents) => {
    if (error) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Not found');
    }
    res.writeHead(200, {
      'Content-Type': types[path.extname(file)] || 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff'
    });
    res.end(contents);
  });
});

server.listen(process.env.PORT || 3000, '0.0.0.0', () => {
  console.log('Abuja Connect running');
});
