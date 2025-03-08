# Llama Stack UI

A comprehensive user interface for interacting with Llama Stack API endpoints.

## Features

- **Chat Interface**: Interact with Llama models through a user-friendly chat interface
- **Tool Integration**: Explore and test available tools with the Llama models
- **Model Management**: View and manage available Llama models
- **Evaluations**: Run and view evaluations on model performance
- **Settings**: Configure your Llama Stack UI preferences and connections

## Architecture

- **Frontend**: React with TypeScript, Material-UI
- **Backend**: Express.js server that proxies requests to the Llama Stack API

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- Llama Stack API server running

### Installation

1. Clone the repository
2. Install dependencies:

```bash
# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

3. Configure environment variables:
   - Copy `.env.example` to `.env` in both the server and client directories
   - Update the values in the `.env` files as needed

4. Start the development server:

```bash
# Start both client and server
./start.sh

# Or start them separately
# Start server
cd server && npm run dev

# Start client
cd client && npm start
```

This will start both the Express server and the React development server.

- Express server: http://localhost:50544
- React development server: http://localhost:56896

## Usage

1. Open your browser and navigate to http://localhost:56896
2. Use the sidebar to navigate between different features
3. Start by exploring the available models and tools
4. Try the chat interface to interact with Llama models

## Configuration

### Environment Variables

#### Server (.env)
- `PORT`: The port on which the Express server will run (default: 50544)
- `LLAMA_STACK_API_URL`: The URL of the Llama Stack API server (default: http://localhost:8321)
- `NODE_ENV`: The environment in which the server is running (development, production)

#### Client (.env)
- `REACT_APP_API_URL`: The URL of the Express server API (default: http://localhost:50544/api)
- `PORT`: The port on which the React development server will run (default: 56896)

You can also configure the Llama Stack API URL in the Settings page of the application.

## License

This project is licensed under the ISC License.

## Acknowledgements

- [Llama Stack](https://llama-stack.readthedocs.io/en/latest/)
- [React](https://reactjs.org/)
- [Material-UI](https://mui.com/)
- [Express.js](https://expressjs.com/)