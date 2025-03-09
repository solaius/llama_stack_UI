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

// Store active streams
const activeStreams: Record<string, any> = {};

// Proxy POST requests to Llama Stack API
app.post('/api/v1/*', async (req: Request, res: Response) => {
  try {
    const endpoint = req.path.replace('/api', '');
    const data = req.body;
    const isStreaming = req.query.stream === 'true' || (data && data.stream === true);
    const streamId = req.headers['x-stream-id'] as string;
    
    console.log(`Proxying POST request to ${endpoint}`, isStreaming ? '(streaming)' : '');
    
    // Handle streaming requests differently
    if (isStreaming && streamId) {
      console.log(`Initiating streaming request with ID: ${streamId}`);
      
      // Make sure the request has stream=true
      if (data && typeof data === 'object') {
        data.stream = true;
      }
      
      // Create a request with proper streaming configuration
      try {
        const response = await axios.post(`${llamaStackApiUrl}${endpoint}`, data, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream'
          },
          responseType: 'stream'
        });
        
        // Store the stream for later access
        activeStreams[streamId] = {
          stream: response.data,
          timestamp: Date.now(),
          chunks: []
        };
        
        // Set up event handlers for the stream
        response.data.on('data', (chunk: Buffer) => {
          const chunkStr = chunk.toString();
          console.log(`Stream ${streamId} received chunk:`, chunkStr.substring(0, 50) + (chunkStr.length > 50 ? '...' : ''));
          
          // Store the chunk
          if (activeStreams[streamId]) {
            activeStreams[streamId].chunks.push(chunkStr);
          }
        });
        
        response.data.on('end', () => {
          console.log(`Stream ${streamId} ended`);
        });
        
        response.data.on('error', (err: Error) => {
          console.error(`Stream ${streamId} error:`, err);
          delete activeStreams[streamId];
        });
        
        // Return success response
        res.status(200).json({ status: 'streaming', stream_id: streamId });
      } catch (error: any) {
        console.error('Error initiating streaming request:', error.message);
        res.status(500).json({ error: 'Failed to initiate streaming request', message: error.message });
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

// Stream endpoint to get SSE data
app.get('/api/v1/inference/chat-completion/stream/:streamId', function(req: Request, res: Response) {
  const streamId = req.params.streamId;
  
  console.log(`Client connected to stream ${streamId}`);
  
  // Check if the stream exists
  if (!activeStreams[streamId]) {
    console.error(`Stream ${streamId} not found`);
    res.status(404).json({ error: 'Stream not found' });
    return;
  }
  
  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();
  
  // Get the stream from active streams
  const streamData = activeStreams[streamId];
  const stream = streamData.stream;
  
  // Send any existing chunks
  const existingChunks = streamData.chunks;
  if (existingChunks && existingChunks.length > 0) {
    console.log(`Sending ${existingChunks.length} existing chunks for stream ${streamId}`);
    existingChunks.forEach((chunk: string) => {
      res.write(`data: ${chunk}\n\n`);
    });
  }
  
  // Set up data handler for new chunks
  const dataHandler = function(chunk: Buffer) {
    const chunkStr = chunk.toString();
    res.write(`data: ${chunkStr}\n\n`);
  };
  
  // Set up end handler
  const endHandler = function() {
    console.log(`Stream ${streamId} ended, closing client connection`);
    res.end();
    cleanup();
  };
  
  // Set up error handler
  const errorHandler = function(err: Error) {
    console.error(`Stream ${streamId} error:`, err);
    res.end();
    cleanup();
  };
  
  // Add event listeners to the stream
  stream.on('data', dataHandler);
  stream.on('end', endHandler);
  stream.on('error', errorHandler);
  
  // Handle client disconnect
  req.on('close', function() {
    console.log(`Client disconnected from stream ${streamId}`);
    cleanup();
  });
  
  // Cleanup function
  function cleanup() {
    if (stream) {
      stream.removeListener('data', dataHandler);
      stream.removeListener('end', endHandler);
      stream.removeListener('error', errorHandler);
    }
    
    // Remove the stream after 5 minutes
    setTimeout(function() {
      if (activeStreams[streamId]) {
        console.log(`Removing stream ${streamId} after timeout`);
        delete activeStreams[streamId];
      }
    }, 5 * 60 * 1000);
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