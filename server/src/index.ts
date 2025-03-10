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
    
    // For chat completion endpoint, ensure messages have required fields
    if (endpoint.includes('/inference/chat-completion') && data && data.messages) {
      // Add stop_reason to assistant messages if missing
      data.messages = data.messages.map((msg: any) => {
        if (msg.role === 'assistant' && !msg.stop_reason) {
          return { ...msg, stop_reason: 'end_of_turn' };
        }
        return msg;
      });
    }
    
    // Handle streaming requests directly
    if (isStreaming) {
      console.log('Handling streaming request directly');
      
      // Make sure the request has stream=true
      if (data && typeof data === 'object') {
        data.stream = true;
      }
      
      // Set up SSE headers
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
      });
      
      // Send a test message to confirm the connection is working
      res.write(`data: ${JSON.stringify({ status: "connected" })}\n\n`);
      
      try {
        // Create a request with proper streaming configuration
        const apiUrl = `${llamaStackApiUrl}${endpoint}`;
        console.log(`Sending streaming request to API: ${apiUrl}`);
        
        const response = await axios({
          method: 'post',
          url: apiUrl,
          data: data,
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
          
          try {
            // Try to parse the chunk as JSON to add stop_reason if needed
            const jsonData = JSON.parse(chunkStr);
            
            // If this is a completion message with no stop_reason, add it
            if (jsonData.completion_message && !jsonData.completion_message.stop_reason) {
              jsonData.completion_message.stop_reason = 'end_of_turn';
              // Send the modified chunk to the client
              res.write(`data: ${JSON.stringify(jsonData)}\n\n`);
            } else {
              // Send the original chunk to the client
              res.write(`data: ${chunkStr}\n\n`);
            }
          } catch (e) {
            // Not valid JSON or other error, just send the original chunk
            res.write(`data: ${chunkStr}\n\n`);
          }
        });
        
        response.data.on('end', () => {
          console.log('Stream ended');
          res.write(`data: ${JSON.stringify({ status: "completed" })}\n\n`);
          res.end();
        });
        
        response.data.on('error', (err: Error) => {
          console.error('Stream error:', err);
          res.write(`data: ${JSON.stringify({ error: 'Stream error', message: err.message })}\n\n`);
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
      
      // For chat completion, ensure the response has stop_reason
      if (endpoint.includes('/inference/chat-completion') && 
          response.data && 
          response.data.completion_message && 
          !response.data.completion_message.stop_reason) {
        response.data.completion_message.stop_reason = 'end_of_turn';
      }
      
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