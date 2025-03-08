"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const axios_1 = __importDefault(require("axios"));
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3001;
const llamaStackApiUrl = process.env.LLAMA_STACK_API_URL || 'http://localhost:8321';
// Middleware
app.use((0, cors_1.default)({
    origin: '*', // Allow all origins for development
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express_1.default.json());
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Proxy GET requests to Llama Stack API
app.get('/api/v1/*', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const endpoint = req.path.replace('/api', '');
        const params = req.query;
        console.log(`Proxying GET request to ${endpoint}`);
        const response = yield axios_1.default.get(`${llamaStackApiUrl}${endpoint}`, { params });
        res.status(response.status).json(response.data);
    }
    catch (error) {
        console.error('Error proxying GET request:', error.message);
        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        }
        else {
            res.status(500).json({ error: 'Internal server error', message: error.message });
        }
    }
}));
// Proxy POST requests to Llama Stack API
app.post('/api/v1/*', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const endpoint = req.path.replace('/api', '');
        const data = req.body;
        console.log(`Proxying POST request to ${endpoint}`);
        const response = yield axios_1.default.post(`${llamaStackApiUrl}${endpoint}`, data, {
            headers: {
                'Content-Type': 'application/json'
            },
            responseType: req.query.stream === 'true' ? 'stream' : 'json'
        });
        // Handle streaming responses
        if ((_a = response.headers['content-type']) === null || _a === void 0 ? void 0 : _a.includes('text/event-stream')) {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            // Forward the streaming response
            response.data.pipe(res);
        }
        else {
            // Regular JSON response
            res.status(response.status).json(response.data);
        }
    }
    catch (error) {
        console.error('Error proxying POST request:', error.message);
        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        }
        else {
            res.status(500).json({ error: 'Internal server error', message: error.message });
        }
    }
}));
// Proxy PUT requests to Llama Stack API
app.put('/api/v1/*', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const endpoint = req.path.replace('/api', '');
        const data = req.body;
        console.log(`Proxying PUT request to ${endpoint}`);
        const response = yield axios_1.default.put(`${llamaStackApiUrl}${endpoint}`, data);
        res.status(response.status).json(response.data);
    }
    catch (error) {
        console.error('Error proxying PUT request:', error.message);
        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        }
        else {
            res.status(500).json({ error: 'Internal server error', message: error.message });
        }
    }
}));
// Proxy DELETE requests to Llama Stack API
app.delete('/api/v1/*', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const endpoint = req.path.replace('/api', '');
        console.log(`Proxying DELETE request to ${endpoint}`);
        const response = yield axios_1.default.delete(`${llamaStackApiUrl}${endpoint}`);
        res.status(response.status).json(response.data);
    }
    catch (error) {
        console.error('Error proxying DELETE request:', error.message);
        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        }
        else {
            res.status(500).json({ error: 'Internal server error', message: error.message });
        }
    }
}));
// Serve static files from the client build directory in production
if (process.env.NODE_ENV === 'production') {
    const path = require('path');
    app.use(express_1.default.static(path.join(__dirname, '../../client/build')));
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../../client/build/index.html'));
    });
}
// Start the server
app.listen(Number(port), '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${port}`);
    console.log(`Proxying requests to Llama Stack API at ${llamaStackApiUrl}`);
});
