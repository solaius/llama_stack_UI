const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

// Get the Llama Stack API URL from environment variable or use a default
const LLAMA_STACK_API_URL = process.env.REACT_APP_LLAMA_STACK_API_URL || 'http://localhost:8000';

console.log('Using Llama Stack API URL:', LLAMA_STACK_API_URL);

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: LLAMA_STACK_API_URL,
      changeOrigin: true,
      pathRewrite: {
        '^/api': '', // remove /api prefix when forwarding to target
      },
      onProxyReq: (proxyReq, req, res) => {
        // Log proxy requests
        console.log('Proxying:', req.method, req.path, '->', proxyReq.path);
      },
      onError: (err, req, res) => {
        console.error('Proxy error:', err);
        res.writeHead(500, {
          'Content-Type': 'text/plain',
        });
        res.end('Proxy error: Could not connect to the API server. Please check your connection settings.');
      }
    })
  );
  
  // Add a separate proxy for direct v1 paths
  app.use(
    '/v1',
    createProxyMiddleware({
      target: LLAMA_STACK_API_URL,
      changeOrigin: true,
      onProxyReq: (proxyReq, req, res) => {
        // Log proxy requests
        console.log('Proxying v1:', req.method, req.path, '->', proxyReq.path);
      },
      onError: (err, req, res) => {
        console.error('Proxy error (v1):', err);
        res.writeHead(500, {
          'Content-Type': 'text/plain',
        });
        res.end('Proxy error: Could not connect to the API server. Please check your connection settings.');
      }
    })
  );
};