import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import { Request, Response } from 'express';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
const llamaStackApiUrl = process.env.LLAMA_STACK_API_URL || 'http://192.168.1.35:53992';

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for development
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
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
      res.status(500).json({ error: 'Internal server error', message: error.message });
    }
  }
});

// Proxy POST requests to Llama Stack API
app.post('/api/v1/*', async (req: Request, res: Response) => {
  try {
    const endpoint = req.path.replace('/api', '');
    const data = req.body;
    const isStreaming = req.query.stream === 'true' || (data && data.stream === true);
    
    console.log(`Proxying POST request to ${endpoint}`, isStreaming ? '(streaming)' : '');
    
    // Handle streaming requests directly
    if (isStreaming) {
      console.log('Handling streaming request directly');
      
      // Make sure the request has stream=true
      if (data && typeof data === 'object') {
        data.stream = true;
      }
      
      // Set up SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.flushHeaders();
      
      try {
        // Create a request with proper streaming configuration
        const response = await axios.post(`${llamaStackApiUrl}${endpoint}`, data, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream'
          },
          responseType: 'stream'
        });
        
        console.log('Streaming response received from API, forwarding to client');
        
        // Process the stream data
        response.data.on('data', (chunk: Buffer) => {
          const chunkStr = chunk.toString();
          console.log('Received chunk:', chunkStr.substring(0, 50) + (chunkStr.length > 50 ? '...' : ''));
          
          // Send the chunk to the client
          res.write(`data: ${chunkStr}\n\n`);
        });
        
        response.data.on('end', () => {
          console.log('Stream ended');
          res.end();
        });
        
        response.data.on('error', (err: Error) => {
          console.error('Stream error:', err);
          res.end();
        });
        
        // Handle client disconnect
        req.on('close', () => {
          console.log('Client closed connection');
          response.data.destroy();
        });
      } catch (error: any) {
        console.error('Error setting up streaming:', error.message);
        res.write(`data: ${JSON.stringify({ error: 'Error setting up streaming', message: error.message })}\n\n`);
        res.end();
      }
    } else {
      // Regular JSON response (non-streaming)
      const apiEndpoint = `${llamaStackApiUrl}${endpoint}`;
      const response = await axios.post(apiEndpoint, data, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      res.status(response.status).json(response.data);
    }
  } catch (error: any) {
    console.error('Error proxying POST request:', error.message);
    
    if (error.response) {
      console.error('API error response:', error.response.status);
      res.status(error.response.status).json(error.response.data);
    } else {
      console.error('API error details:', error);
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

// Serve static files from the client build directory in production
if (process.env.NODE_ENV === 'production') {
  const path = require('path');
  app.use(express.static(path.join(__dirname, '../../client/build')));
  
  app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '../../client/build/index.html'));
  });
}

// Start the server
app.listen(Number(port), '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${port}`);
  console.log(`Proxying requests to Llama Stack API at ${llamaStackApiUrl}`);
});