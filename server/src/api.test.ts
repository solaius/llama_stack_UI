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
    
    // Set default mock implementations with proper response structure
    mockedAxios.get.mockImplementation((url, config) => {
      return Promise.resolve({
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
        data: { success: true }
      });
    });
    
    mockedAxios.post.mockImplementation((url, data, config) => {
      return Promise.resolve({
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
        data: { success: true }
      });
    });
    
    mockedAxios.put.mockImplementation((url, data, config) => {
      return Promise.resolve({
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
        data: { success: true }
      });
    });
    
    mockedAxios.delete.mockImplementation((url, config) => {
      return Promise.resolve({
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
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
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
        data: {
          models: [
            { id: 'model1', name: 'Model 1' },
            { id: 'model2', name: 'Model 2' }
          ]
        }
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const response = await request(app).get('/api/v1/models');

      expect(mockedAxios.get).toHaveBeenCalled();
      expect(mockedAxios.get.mock.calls[0][0]).toContain('/v1/models');
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse.data);
    });

    it('should pass query parameters correctly', async () => {
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
        data: []
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      await request(app).get('/api/v1/models?limit=10&offset=20');

      expect(mockedAxios.get).toHaveBeenCalled();
      const config = mockedAxios.get.mock.calls[0][1];
      expect(config).toBeDefined();
      if (config) {
        expect(config.params).toEqual({
          limit: '10',
          offset: '20',
        });
      }
    });
  });

  describe('Agents Endpoints', () => {
    it('should proxy GET requests to the Llama Stack API', async () => {
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
        data: {
          agents: [
            { id: 'agent1', name: 'Agent 1' },
            { id: 'agent2', name: 'Agent 2' }
          ]
        }
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const response = await request(app).get('/api/v1/agents/list');

      expect(mockedAxios.get).toHaveBeenCalled();
      expect(mockedAxios.get.mock.calls[0][0]).toContain('/v1/agents/list');
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse.data);
    });

    it('should proxy POST requests to create an agent', async () => {
      const requestBody = {
        name: 'New Agent',
        model_id: 'model1',
        instructions: 'Be helpful'
      };

      const mockResponse = {
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
        data: {
          agent_id: 'new-agent-id',
          name: 'New Agent'
        }
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const response = await request(app)
        .post('/api/v1/agents')
        .send(requestBody);

      expect(mockedAxios.post).toHaveBeenCalled();
      expect(mockedAxios.post.mock.calls[0][0]).toContain('/v1/agents');
      expect(mockedAxios.post.mock.calls[0][1]).toEqual(requestBody);
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse.data);
    });

    it('should proxy PUT requests to update an agent', async () => {
      const requestBody = {
        name: 'Updated Agent',
        instructions: 'Be more helpful'
      };

      const mockResponse = {
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
        data: {
          agent_id: 'agent1',
          name: 'Updated Agent'
        }
      };

      mockedAxios.put.mockResolvedValueOnce(mockResponse);

      const response = await request(app)
        .put('/api/v1/agents/agent1')
        .send(requestBody);

      expect(mockedAxios.put).toHaveBeenCalled();
      expect(mockedAxios.put.mock.calls[0][0]).toContain('/v1/agents/agent1');
      expect(mockedAxios.put.mock.calls[0][1]).toEqual(requestBody);
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse.data);
    });

    it('should proxy DELETE requests to delete an agent', async () => {
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
        data: {
          success: true,
          message: 'Agent deleted'
        }
      };

      mockedAxios.delete.mockResolvedValueOnce(mockResponse);

      const response = await request(app).delete('/api/v1/agents/agent1');

      expect(mockedAxios.delete).toHaveBeenCalled();
      expect(mockedAxios.delete.mock.calls[0][0]).toContain('/v1/agents/agent1');
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse.data);
    });
  });

  describe('Chat Completion Endpoint', () => {
    it('should proxy POST requests for chat completions', async () => {
      const requestBody = {
        model_id: 'model1',
        messages: [
          { role: 'user', content: 'Hello' }
        ]
      };

      const mockResponse = {
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
        data: {
          completion_message: {
            role: 'assistant',
            content: 'Hello! How can I help you today?'
          }
        }
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const response = await request(app)
        .post('/api/v1/inference/chat-completion')
        .send(requestBody);

      expect(mockedAxios.post).toHaveBeenCalled();
      expect(mockedAxios.post.mock.calls[0][0]).toContain('/v1/inference/chat-completion');
      expect(mockedAxios.post.mock.calls[0][1]).toEqual(requestBody);
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse.data);
    });

    it('should handle errors correctly', async () => {
      const requestBody = {
        model_id: 'invalid-model',
        messages: [
          { role: 'user', content: 'Hello' }
        ]
      };

      const mockError = {
        response: {
          status: 400,
          data: {
            error: 'Invalid model ID'
          }
        }
      };

      mockedAxios.post.mockRejectedValueOnce(mockError);

      const response = await request(app)
        .post('/api/v1/inference/chat-completion')
        .send(requestBody);

      expect(mockedAxios.post).toHaveBeenCalled();
      expect(response.status).toBe(400);
      expect(response.body).toEqual(mockError.response.data);
    });
  });

  describe('Tools Endpoints', () => {
    it('should proxy GET requests to get tools', async () => {
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
        data: {
          tools: [
            { id: 'tool1', name: 'Tool 1' },
            { id: 'tool2', name: 'Tool 2' }
          ]
        }
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const response = await request(app).get('/api/v1/tools');

      expect(mockedAxios.get).toHaveBeenCalled();
      expect(mockedAxios.get.mock.calls[0][0]).toContain('/v1/tools');
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse.data);
    });

    it('should proxy POST requests to invoke a tool', async () => {
      const requestBody = {
        operation: 'add',
        a: 5,
        b: 3
      };

      const mockResponse = {
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
        data: {
          result: 8
        }
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const response = await request(app)
        .post('/api/v1/tools/calculator/invoke')
        .send(requestBody);

      expect(mockedAxios.post).toHaveBeenCalled();
      expect(mockedAxios.post.mock.calls[0][0]).toContain('/v1/tools/calculator/invoke');
      expect(mockedAxios.post.mock.calls[0][1]).toEqual(requestBody);
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse.data);
    });
  });

  describe('Query Parameters', () => {
    it('should pass query parameters correctly', async () => {
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
        data: []
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      await request(app).get('/api/v1/models?limit=10&offset=20');

      expect(mockedAxios.get).toHaveBeenCalled();
      const config = mockedAxios.get.mock.calls[0][1];
      expect(config).toBeDefined();
      if (config) {
        expect(config.params).toEqual({
          limit: '10',
          offset: '20',
        });
      }
    });
  });
});