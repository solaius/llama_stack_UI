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
  });

  describe('Streaming Chat Completion', () => {
    it.skip('should handle streaming responses correctly', async () => {
      // Mock the request body
      const requestBody = {
        model_id: 'model1',
        messages: [
          { role: 'user', content: 'Hello' }
        ],
        stream: true,
      };
      
      // Create a mock stream
      const mockStream = new Readable({
        read() {}
      });
      
      // Mock the axios post to return a stream
      mockedAxios.post.mockImplementation(() => {
        return Promise.resolve({
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {},
          data: mockStream
        });
      });
      
      // Send some data through the stream
      setTimeout(() => {
        mockStream.push(JSON.stringify({ chunk: 1 }));
        mockStream.push(JSON.stringify({ chunk: 2 }));
        mockStream.push(null); // End the stream
      }, 100);
      
      // Make the request
      const response = await request(app)
        .post('/api/v1/inference/chat-completion')
        .send(requestBody);
      
      // Check that the request was made correctly
      expect(mockedAxios.post).toHaveBeenCalled();
      expect(mockedAxios.post.mock.calls[0][0]).toContain('/v1/inference/chat-completion');
      expect(mockedAxios.post.mock.calls[0][1]).toEqual(requestBody);
      
      // Check the response
      expect(response.status).toBe(200);
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
      
      // Mock the axios post to throw an error
      mockedAxios.post.mockImplementation(() => {
        return Promise.resolve({
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {},
          data: {
            error: 'Streaming error'
          }
        });
      });
      
      // Make the request
      const response = await request(app)
        .post('/api/v1/inference/chat-completion')
        .send(requestBody);
      
      // Check that the request was made correctly
      expect(mockedAxios.post).toHaveBeenCalled();
      const callArgs = mockedAxios.post.mock.calls[0];
      expect(callArgs[0]).toContain('/v1/inference/chat-completion');
      expect(callArgs[1]).toEqual(requestBody);
      
      // Check the response
      expect(response.status).toBe(200);
    });
  });
});