import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import { Request, Response } from 'express';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
const llamaStackApiUrl = process.env.LLAMA_STACK_API_URL || 'http://localhost:8321';

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
    
    console.log(`Proxying POST request to ${endpoint}`);
    
    const response = await axios.post(`${llamaStackApiUrl}${endpoint}`, data, {
      headers: {
        'Content-Type': 'application/json'
      },
      responseType: req.query.stream === 'true' ? 'stream' : 'json'
    });
    
    // Handle streaming responses
    if (response.headers['content-type']?.includes('text/event-stream')) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      // Forward the streaming response
      response.data.pipe(res);
    } else {
      // Regular JSON response
      res.status(response.status).json(response.data);
    }
  } catch (error: any) {
    console.error('Error proxying POST request:', error.message);
    
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