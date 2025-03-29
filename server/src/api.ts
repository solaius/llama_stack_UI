import express, { Request, Response } from 'express';
import axios from 'axios';
import { request as httpRequest } from 'http';
import { request as httpsRequest } from 'https';
import { URL } from 'url';

export function setupApiRoutes(app: express.Application, llamaStackApiUrl: string = process.env.LLAMA_STACK_API_URL || '') {
  // Health check endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Proxy GET requests to Llama Stack API
  app.get('/api/v1/*', async (req: Request, res: Response) => {
    try {
      const endpoint = req.path.replace('/api', '');
      const params = req.query;
      
      console.log(`Proxying GET request to ${endpoint}`);
      
      const response = await axios.get(`${llamaStackApiUrl}${endpoint}`, { params });
      
      res.status(response.status).json(response.data);
    } catch (error: any) {
      console.error('Error proxying GET request:', error.message);
      
      if (error.response) {
        res.status(error.response.status).json(error.response.data);
      } else {
        res.status(500).json({ 
          error: 'Error connecting to Llama Stack API', 
          message: error.message 
        });
      }
    }
  });

  // Proxy POST requests to Llama Stack API
  app.post('/api/v1/*', async (req: Request, res: Response) => {
    try {
      const endpoint = req.path.replace('/api', '');
      const targetUrl = new URL(`${llamaStackApiUrl}${endpoint}`);
      const isStreaming = req.query.stream === 'true';

      console.log(`Proxying POST request to ${endpoint} (stream=${isStreaming})`);

      if (isStreaming) {
        // Handle streaming response
        const protocolLib = targetUrl.protocol === 'https:' ? httpsRequest : httpRequest;

        const proxyReq = protocolLib(
          {
            hostname: targetUrl.hostname,
            port: targetUrl.port,
            path: targetUrl.pathname + targetUrl.search,
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'text/event-stream',
            },
          },
          (proxyRes) => {
            if (proxyRes.headers['content-type']?.includes('text/event-stream')) {
              res.setHeader('Content-Type', 'text/event-stream');
              res.setHeader('Cache-Control', 'no-cache');
              res.setHeader('Connection', 'keep-alive');
              proxyRes.pipe(res);
            } else {
              let data = '';
              proxyRes.on('data', (chunk) => {
                data += chunk;
              });
              proxyRes.on('end', () => {
                res.status(proxyRes.statusCode || 200).send(data);
              });
            }
          }
        );

        proxyReq.on('error', (err) => {
          console.error('Proxy request error:', err.message);
          res.status(500).json({ error: 'Internal server error', message: err.message });
        });

        proxyReq.write(JSON.stringify(req.body));
        proxyReq.end();
      } else {
        // Handle regular JSON response
        const response = await axios.post(`${llamaStackApiUrl}${endpoint}`, req.body);
        res.status(response.status).json(response.data);
      }
    } catch (error: any) {
      console.error('Error in proxy POST handler:', error.message);
      
      if (error.response) {
        res.status(error.response.status).json(error.response.data);
      } else {
        res.status(500).json({ error: 'Internal server error', message: error.message });
      }
    }
  });

  // Proxy PUT requests to Llama Stack API
  app.put('/api/v1/*', async (req: Request, res: Response) => {
    try {
      const endpoint = req.path.replace('/api', '');
      const data = req.body;
      
      console.log(`Proxying PUT request to ${endpoint}`);
      
      const response = await axios.put(`${llamaStackApiUrl}${endpoint}`, data);
      
      res.status(response.status).json(response.data);
    } catch (error: any) {
      console.error('Error proxying PUT request:', error.message);
      
      if (error.response) {
        res.status(error.response.status).json(error.response.data);
      } else {
        res.status(500).json({ error: 'Internal server error', message: error.message });
      }
    }
  });

  // Proxy DELETE requests to Llama Stack API
  app.delete('/api/v1/*', async (req: Request, res: Response) => {
    try {
      const endpoint = req.path.replace('/api', '');
      
      console.log(`Proxying DELETE request to ${endpoint}`);
      
      const response = await axios.delete(`${llamaStackApiUrl}${endpoint}`);
      
      res.status(response.status).json(response.data);
    } catch (error: any) {
      console.error('Error proxying DELETE request:', error.message);
      
      if (error.response) {
        res.status(error.response.status).json(error.response.data);
      } else {
        res.status(500).json({ error: 'Internal server error', message: error.message });
      }
    }
  });
}