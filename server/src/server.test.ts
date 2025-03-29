import express from 'express';
import request from 'supertest';
import cors from 'cors';

// Create a simple Express app for testing
const app = express();
app.use(cors());
app.use(express.json());

// Add a health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

describe('Server Health Check', () => {
  it('should return a 200 status and health information', async () => {
    const response = await request(app).get('/health');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('timestamp');
  });
});