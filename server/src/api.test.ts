import request from 'supertest';
import express from 'express';
import cors from 'cors';
import axios from 'axios';
import { setupApiRoutes } from './api';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Set a default base URL for tests
const TEST_API_URL = 'http://mock-llama-api.com';

describe('API Routes', () => {
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
    
    // Set default mock implementations
    mockedAxios.get.mockImplementation((url, config) => {
      return Promise.resolve({
        status: 200,
        data: { success: true }
      });
    });
    
    mockedAxios.post.mockImplementation((url, data, config) => {
      return Promise.resolve({
        status: 200,
        data: { success: true }
      });
    });
    
    mockedAxios.put.mockImplementation((url, data, config) => {
      return Promise.resolve({
        status: 200,
        data: { success: true }
      });
    });
    
    mockedAxios.delete.mockImplementation((url, config) => {
      return Promise.resolve({
        status: 200,
        data: { success: true }
      });
    });
  });

  describe('Health Check Endpoint', () => {
    it('should return a 200 status and health information', async () => {
      const response = await request(app).get('/api/health');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('Models Endpoints', () => {
    it('should proxy GET requests to the Llama Stack API', async () => {
      // Mock the Llama Stack API response
      const mockResponse = {
        data: [
          {
            identifier: 'model1',
            provider_id: 'provider1',
            model_type: 'llm',
          },
          {
            identifier: 'model2',
            provider_id: 'provider2',
            model_type: 'embedding',
          }
        ]
      };
      
      mockedAxios.get.mockResolvedValueOnce(mockResponse);
      
      const response = await request(app).get('/api/v1/models');
      
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/v1/models'),
        expect.any(Object)
      );
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse.data);
    });

    it('should handle errors from the Llama Stack API', async () => {
      // Mock an API error
      const mockError = {
        response: {
          status: 404,
          data: { error: 'Models not found' }
        }
      };
      
      mockedAxios.get.mockRejectedValueOnce(mockError);
      
      const response = await request(app).get('/api/v1/models');
      
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/v1/models'),
        expect.any(Object)
      );
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Models not found' });
    });

    it('should handle network errors gracefully', async () => {
      // Mock a network error
      mockedAxios.get.mockRejectedValueOnce(new Error('Network Error'));
      
      const response = await request(app).get('/api/v1/models');
      
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/v1/models'),
        expect.any(Object)
      );
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Error connecting to Llama Stack API');
    });
  });

  describe('Agents Endpoints', () => {
    it('should proxy GET requests to the Llama Stack API', async () => {
      // Mock the Llama Stack API response
      const mockResponse = {
        data: [
          {
            agent_id: 'agent1',
            name: 'Test Agent 1',
            model: 'model1',
          },
          {
            agent_id: 'agent2',
            name: 'Test Agent 2',
            model: 'model2',
          }
        ]
      };
      
      mockedAxios.get.mockResolvedValueOnce(mockResponse);
      
      const response = await request(app).get('/api/v1/agents/list');
      
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/v1/agents/list'),
        expect.any(Object)
      );
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse.data);
    });

    it('should proxy POST requests to create an agent', async () => {
      // Mock the request body
      const requestBody = {
        name: 'New Agent',
        model: 'model1',
        instructions: 'Be helpful',
      };
      
      // Mock the Llama Stack API response
      const mockResponse = {
        data: {
          agent_id: 'new-agent-123',
          name: 'New Agent',
          model: 'model1',
          instructions: 'Be helpful',
        }
      };
      
      mockedAxios.post.mockResolvedValueOnce(mockResponse);
      
      const response = await request(app)
        .post('/api/v1/agents')
        .send(requestBody);
      
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/v1/agents'),
        requestBody,
        expect.any(Object)
      );
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse.data);
    });

    it('should proxy PUT requests to update an agent', async () => {
      // Mock the request body
      const requestBody = {
        name: 'Updated Agent',
        instructions: 'Be more helpful',
      };
      
      // Mock the Llama Stack API response
      const mockResponse = {
        data: {
          agent_id: 'agent1',
          name: 'Updated Agent',
          model: 'model1',
          instructions: 'Be more helpful',
        }
      };
      
      mockedAxios.put.mockResolvedValueOnce(mockResponse);
      
      const response = await request(app)
        .put('/api/v1/agents/agent1')
        .send(requestBody);
      
      expect(mockedAxios.put).toHaveBeenCalledWith(
        expect.stringContaining('/v1/agents/agent1'),
        requestBody,
        expect.any(Object)
      );
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse.data);
    });

    it('should proxy DELETE requests to delete an agent', async () => {
      // Mock the Llama Stack API response
      const mockResponse = {
        data: {
          message: 'Agent deleted successfully',
        }
      };
      
      mockedAxios.delete.mockResolvedValueOnce(mockResponse);
      
      const response = await request(app).delete('/api/v1/agents/agent1');
      
      expect(mockedAxios.delete).toHaveBeenCalledWith(
        expect.stringContaining('/v1/agents/agent1'),
        expect.any(Object)
      );
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse.data);
    });
  });

  describe('Chat Completion Endpoint', () => {
    it('should proxy POST requests for chat completions', async () => {
      // Mock the request body
      const requestBody = {
        model_id: 'model1',
        messages: [
          { role: 'user', content: 'Hello' }
        ],
        temperature: 0.7,
      };
      
      // Mock the Llama Stack API response
      const mockResponse = {
        data: {
          completion_message: {
            role: 'assistant',
            content: 'Hi there! How can I help you today?',
          }
        }
      };
      
      mockedAxios.post.mockResolvedValueOnce(mockResponse);
      
      const response = await request(app)
        .post('/api/v1/inference/chat-completion')
        .send(requestBody);
      
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/v1/inference/chat-completion'),
        requestBody,
        expect.any(Object)
      );
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse.data);
    });

    it('should handle errors in chat completion requests', async () => {
      // Mock the request body
      const requestBody = {
        model_id: 'invalid-model',
        messages: [
          { role: 'user', content: 'Hello' }
        ],
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
        .post('/api/v1/inference/chat-completion')
        .send(requestBody);
      
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/v1/inference/chat-completion'),
        requestBody,
        expect.any(Object)
      );
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Invalid model ID' });
    });
  });

  describe('Tools Endpoints', () => {
    it('should proxy GET requests to get tools', async () => {
      // Mock the Llama Stack API response
      const mockResponse = {
        data: [
          {
            identifier: 'tool1',
            description: 'Tool 1 description',
            parameters: [],
          },
          {
            identifier: 'tool2',
            description: 'Tool 2 description',
            parameters: [],
          }
        ]
      };
      
      mockedAxios.get.mockResolvedValueOnce(mockResponse);
      
      const response = await request(app).get('/api/v1/tools');
      
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/v1/tools'),
        expect.any(Object)
      );
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse.data);
    });

    it('should proxy POST requests to invoke a tool', async () => {
      // Mock the request body
      const requestBody = {
        operation: 'add',
        a: 5,
        b: 3,
      };
      
      // Mock the Llama Stack API response
      const mockResponse = {
        data: {
          result: 8,
          status: 'success',
        }
      };
      
      mockedAxios.post.mockResolvedValueOnce(mockResponse);
      
      const response = await request(app)
        .post('/api/v1/tools/calculator/invoke')
        .send(requestBody);
      
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/v1/tools/calculator/invoke'),
        requestBody,
        expect.any(Object)
      );
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse.data);
    });
  });

  describe('Query Parameters', () => {
    it('should forward query parameters correctly', async () => {
      // Mock the Llama Stack API response
      const mockResponse = {
        data: []
      };
      
      mockedAxios.get.mockResolvedValueOnce(mockResponse);
      
      await request(app).get('/api/v1/models?limit=10&offset=20');
      
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/v1/models'),
        expect.objectContaining({
          params: {
            limit: '10',
            offset: '20',
          }
        })
      );
    });
  });
});