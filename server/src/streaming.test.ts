import request from 'supertest';
import express from 'express';
import cors from 'cors';
import axios from 'axios';
import { Readable } from 'stream';
import { setupApiRoutes } from './api';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Set a default base URL for tests
const TEST_API_URL = 'http://mock-llama-api.com';

describe('Streaming API Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    // Create a fresh Express app for each test
    app = express();
    app.use(cors());
    app.use(express.json());
    
    // Set up the API routes with our test URL
    setupApiRoutes(app, TEST_API_URL);
    
    // Reset all mocks
    jest.clearAllMocks();
    
    // Set default mock implementations for streaming responses
    mockedAxios.post.mockImplementation((url, data, config) => {
      // Create a mock readable stream
      const mockStream = new Readable({
        read() {}
      });
      
      // Return a response with the stream
      return Promise.resolve({
        status: 200,
        data: mockStream,
        headers: {
          'content-type': 'text/event-stream'
        }
      });
    });
  });

  describe('Streaming Chat Completion', () => {
    it('should handle streaming responses correctly', async () => {
      // Mock the request body
      const requestBody = {
        model_id: 'model1',
        messages: [
          { role: 'user', content: 'Hello' }
        ],
        stream: true,
      };
      
      // Start the request but don't await it yet
      const responsePromise = request(app)
        .post('/api/v1/inference/chat-completion?stream=true')
        .send(requestBody)
        .buffer(false) // Don't buffer the response
        .parse((res, callback) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk.toString();
          });
          res.on('end', () => {
            callback(null, data);
          });
        });
      
      // Wait a bit to ensure the request has started
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Get the mock stream from the axios response
      const mockStream = mockedAxios.post.mock.results[0].value.then((res) => res.data);
      const stream = await mockStream;
      
      // Push some data to the mock stream
      stream.push('data: {"event":{"event_type":"progress","delta":{"text":"Hi"}}}\n\n');
      stream.push('data: {"event":{"event_type":"progress","delta":{"text":" there"}}}\n\n');
      stream.push('data: {"event":{"event_type":"complete","stop_reason":"stop"},"completion_message":{"role":"assistant","content":"Hi there"}}\n\n');
      stream.push(null); // End the stream
      
      // Now await the response
      const response = await responsePromise;
      
      // Verify the request was made correctly
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/v1/inference/chat-completion'),
        requestBody,
        expect.objectContaining({
          responseType: 'stream',
          headers: expect.objectContaining({
            'Accept': 'text/event-stream',
          })
        })
      );
      
      // Verify the response contains the streamed data
      expect(response.text).toContain('data: {"event":{"event_type":"progress","delta":{"text":"Hi"}}}\n\n');
      expect(response.text).toContain('data: {"event":{"event_type":"progress","delta":{"text":" there"}}}\n\n');
      expect(response.text).toContain('data: {"event":{"event_type":"complete","stop_reason":"stop"},"completion_message":{"role":"assistant","content":"Hi there"}}\n\n');
    });

    it('should handle streaming errors correctly', async () => {
      // Mock the request body
      const requestBody = {
        model_id: 'model1',
        messages: [
          { role: 'user', content: 'Hello' }
        ],
        stream: true,
      };
      
      // Mock an API error
      const mockError = {
        response: {
          status: 400,
          data: { error: 'Invalid model ID' }
        }
      };
      
      mockedAxios.post.mockRejectedValueOnce(mockError);
      
      const response = await request(app)
        .post('/api/v1/inference/chat-completion?stream=true')
        .send(requestBody);
      
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/v1/inference/chat-completion'),
        requestBody,
        expect.objectContaining({
          responseType: 'stream',
          headers: expect.objectContaining({
            'Accept': 'text/event-stream',
          })
        })
      );
      
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Invalid model ID' });
    });
  });

  describe('Streaming Agent Turn', () => {
    it('should handle streaming agent turns correctly', async () => {
      // Mock the request body
      const requestBody = {
        messages: [
          { role: 'user', content: 'Hello' }
        ],
        stream: true,
      };
      
      // Start the request but don't await it yet
      const responsePromise = request(app)
        .post('/api/v1/agents/agent1/sessions/session1/turns?stream=true')
        .send(requestBody)
        .buffer(false) // Don't buffer the response
        .parse((res, callback) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk.toString();
          });
          res.on('end', () => {
            callback(null, data);
          });
        });
      
      // Wait a bit to ensure the request has started
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Get the mock stream from the axios response
      const mockStream = mockedAxios.post.mock.results[0].value.then((res) => res.data);
      const stream = await mockStream;
      
      // Push some data to the mock stream
      stream.push('data: {"event":{"event_type":"turn_start"}}\n\n');
      stream.push('data: {"event":{"event_type":"step_start","step":{"step_id":"step1","type":"thinking"}}}\n\n');
      stream.push('data: {"event":{"event_type":"step_delta","step_id":"step1","delta":{"thinking":"I need to greet the user"}}}\n\n');
      stream.push('data: {"event":{"event_type":"step_complete","step_id":"step1"}}\n\n');
      stream.push('data: {"event":{"event_type":"message_start"}}\n\n');
      stream.push('data: {"event":{"event_type":"message_delta","delta":{"text":"Hello"}}}\n\n');
      stream.push('data: {"event":{"event_type":"message_delta","delta":{"text":", how can I help you?"}}}\n\n');
      stream.push('data: {"event":{"event_type":"turn_complete"},"turn":{"turn_id":"turn1","output_message":{"role":"assistant","content":"Hello, how can I help you?"}}}\n\n');
      stream.push(null); // End the stream
      
      // Now await the response
      const response = await responsePromise;
      
      // Verify the request was made correctly
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/v1/agents/agent1/sessions/session1/turns'),
        requestBody,
        expect.objectContaining({
          responseType: 'stream',
          headers: expect.objectContaining({
            'Accept': 'text/event-stream',
          })
        })
      );
      
      // Verify the response contains the streamed data
      expect(response.text).toContain('data: {"event":{"event_type":"turn_start"}}\n\n');
      expect(response.text).toContain('data: {"event":{"event_type":"message_delta","delta":{"text":"Hello"}}}\n\n');
      expect(response.text).toContain('data: {"event":{"event_type":"turn_complete"},"turn":{"turn_id":"turn1","output_message":{"role":"assistant","content":"Hello, how can I help you?"}}}\n\n');
    });
  });
});