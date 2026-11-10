import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, relative, isAbsolute, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);

function option(flag, fallback) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : fallback;
}

const port = Number(option('--port', 3000));
const host = option('--host', '127.0.0.1');

// Resolve relative to this script, not the terminal's current directory.
const root = fileURLToPath(new URL('../public/', import.meta.url));

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.png': 'image/png',
};

const server = http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(
      new URL(req.url, 'http://localhost').pathname
    );

    const requestedPath = pathname === '/' ? '/index.html' : pathname;
    const file = resolve(root, `.${requestedPath}`);
    const relativePath = relative(root, file);

    // Works with both Windows and Unix path separators.
    if (
      relativePath === '..' ||
      relativePath.startsWith('../') ||
      relativePath.startsWith('..\\') ||
      isAbsolute(relativePath)
    ) {
      res.writeHead(403);
      res.end('Access denied.');
      return;
    }

    const content = await readFile(file);

    res.writeHead(200, {
      'Content-Type': types[extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });

    res.end(content);
  } catch {
    res.writeHead(404, {
      'Content-Type': 'text/plain; charset=utf-8',
    });

    res.end('File not found. Open the homepage at /.');
  }
});

server.listen(port, host, () => {
  console.log(`TripSplit preview: http://${host}:${port}`);
});

server.on('error', (error) => {
  console.error(`Could not start TripSplit: ${error.message}`);
  process.exitCode = 1;
});