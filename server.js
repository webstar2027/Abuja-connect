const http = require('http');
const fs = require('fs');
const path = require('path');

const publicRoot = path.resolve(__dirname, 'public');
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon'
};

function send(res, status, body, type = 'text/plain; charset=utf-8') {
  res.writeHead(status, {
    'Content-Type': type,
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  });
  res.end(body);
}

http.createServer((req, res) => {
  const pathname = new URL(req.url || '/', 'http://localhost').pathname;

  // Render injects these values at runtime; they are not committed to GitHub.
  // A Supabase publishable key is designed for browser use; never use a secret/service-role key here.
  if (pathname === '/config.js') {
    const config = {
      supabaseUrl: process.env.SUPABASE_URL || '',
      supabasePublishableKey: process.env.SUPABASE_PUBLISHABLE_KEY || ''
    };
    const body = `window.ABUJA_CONFIG = ${JSON.stringify(config)};`;
    return send(res, 200, body, 'text/javascript; charset=utf-8');
  }

  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return send(res, 400, 'Bad request');
  }

  const relative = decoded === '/' ? 'index.html' : decoded.replace(/^\/+/, '');
  const filePath = path.resolve(publicRoot, relative);
  if (filePath !== publicRoot && !filePath.startsWith(publicRoot + path.sep)) {
    return send(res, 403, 'Forbidden');
  }

  fs.readFile(filePath, (err, data) => {
    if (err) return send(res, 404, 'Not found');
    const contentType = mimeTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
    send(res, 200, data, contentType);
  });
}).listen(Number(process.env.PORT) || 3000, '0.0.0.0', () => {
  console.log('Abuja Connect web server started');
});
