/**
 * Local CORS Proxy Server for HCMVision Web Development
 * Forwards all requests to the real API with proper CORS headers.
 * 
 * Usage: node cors-proxy.js
 * Then set EXPO_PUBLIC_API_URL=http://localhost:3001/api in .env.local (for web only)
 */
/* global Buffer */
const http = require('http');
const https = require('https');

const TARGET_HOST = 'hcmvision-api.onrender.com';
const PROXY_PORT = 3001;

const server = http.createServer((clientReq, clientRes) => {
  // Always add CORS headers
  clientRes.setHeader('Access-Control-Allow-Origin', '*');
  clientRes.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  clientRes.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  clientRes.setHeader('Access-Control-Max-Age', '86400');

  // Handle preflight
  if (clientReq.method === 'OPTIONS') {
    clientRes.writeHead(204);
    clientRes.end();
    return;
  }

  // Build target URL
  const targetPath = clientReq.url || '/';

  // Read body first
  let bodyData = [];
  clientReq.on('data', chunk => bodyData.push(chunk));
  clientReq.on('end', () => {
    const bodyBuffer = Buffer.concat(bodyData);

    const proxyHeaders = {
      'host': TARGET_HOST,
      'content-type': clientReq.headers['content-type'] || 'application/json',
      'content-length': bodyBuffer.length,
      'accept': '*/*'
    };
    if (clientReq.headers['authorization']) {
      proxyHeaders['authorization'] = clientReq.headers['authorization'];
    }

    console.log(`[PROXY] ${clientReq.method} ${targetPath}`);

    const options = {
      hostname: TARGET_HOST,
      port: 443,
      path: targetPath,
      method: clientReq.method,
      headers: proxyHeaders,
      servername: TARGET_HOST,
      rejectUnauthorized: false,
    };

    const proxyReq = https.request(options, (proxyRes) => {
      console.log(`[PROXY] Target responded with ${proxyRes.statusCode}`);
      
      const responseHeaders = { ...proxyRes.headers };
      responseHeaders['access-control-allow-origin'] = '*';
      
      clientRes.writeHead(proxyRes.statusCode, responseHeaders);
      proxyRes.pipe(clientRes, { end: true });
    });

    proxyReq.on('error', (err) => {
      console.error('Proxy error:', err.message);
      clientRes.writeHead(502);
      clientRes.end(JSON.stringify({ error: 'Proxy Error', message: err.message }));
    });

    proxyReq.write(bodyBuffer);
    proxyReq.end();
  });
});

server.listen(PROXY_PORT, () => {
  console.log(`\n  🚀 CORS Proxy Server running!`);
  console.log(`  ➜ Local:   http://localhost:${PROXY_PORT}`);
  console.log(`  ➜ Proxying: https://${TARGET_HOST}`);
  console.log(`\n  All requests to http://localhost:${PROXY_PORT}/api/... will be forwarded`);
  console.log(`  to https://${TARGET_HOST}/api/... with CORS headers.\n`);
});
