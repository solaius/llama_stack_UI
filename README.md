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
npm run install:all
```

3. Start the development server:

```bash
npm start
```

This will start both the Express server and the React development server.

- Express server: http://localhost:51490
- React development server: http://localhost:3000

## Usage

1. Open your browser and navigate to http://localhost:3000
2. Use the sidebar to navigate between different features
3. Start by exploring the available models and tools
4. Try the chat interface to interact with Llama models

## Configuration

You can configure the Llama Stack API URL in the Settings page or by editing the `.env` file in the server directory.

## License

This project is licensed under the ISC License.

## Acknowledgements

- [Llama Stack](https://llama-stack.readthedocs.io/en/latest/)
- [React](https://reactjs.org/)
- [Material-UI](https://mui.com/)
- [Express.js](https://expressjs.com/)