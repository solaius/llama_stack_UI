# Llama Stack UI

A comprehensive user interface for interacting with Llama Stack API endpoints.

## Features

- **Chat Interface**: Interact with Llama models through a user-friendly chat interface
- **Agent Management**: Create, configure, and manage AI agents
- **Tool Integration**: Explore and test available tools with the Llama models
- **Model Management**: View and manage available Llama models
- **Settings**: Configure your Llama Stack UI preferences and connections

## Documentation

Comprehensive documentation is available in the [documentation](./documentation) directory:

- [Project Overview](./documentation/project_overview.md) - Introduction to the project
- [User Guide](./documentation/user_guide.md) - Instructions for using the application
- [Developer Guide](./documentation/developer_guide.md) - Guide for developers
- [Installation Guides](./documentation/README.md#installation-guides) - OS-specific installation instructions

## Architecture

- **Frontend**: React with TypeScript, Material-UI
- **Backend**: Express.js server that proxies requests to the Llama Stack API

## Getting Started

For detailed installation instructions, please refer to our OS-specific guides:

- [macOS Installation Guide](./documentation/installation_macos.md)
- [Linux Installation Guide](./documentation/installation_linux.md)
- [Windows WSL Installation Guide](./documentation/installation_windows_wsl.md)

### Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher)
- Llama Stack API server running

### Quick Installation

1. Clone the repository
2. Install dependencies:

```bash
# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

3. Configure environment variables:
   - Create a `.env` file in the server directory
   - Add the necessary configuration (see Configuration section below)

4. Start the development server:

```bash
# Start server
cd server && npm run dev

# Start client (in a new terminal)
cd client && npm start
```

This will start both the Express server and the React development server.

- Express server: http://localhost:3001 (or the port specified in your .env)
- React development server: http://localhost:3000

## Usage

1. Open your browser and navigate to http://localhost:3000
2. Use the sidebar to navigate between different features
3. Start by exploring the available agents and tools
4. Try the chat interface to interact with your configured agents

For detailed usage instructions, please refer to the [User Guide](./documentation/user_guide.md).

## Configuration

### Environment Variables

#### Server (.env)
- `PORT`: The port on which the Express server will run (default: 3001)
- `LLAMA_API_URL`: The URL of the Llama API server (default: http://localhost:8000)
- `NODE_ENV`: The environment in which the server is running (development, production)

#### Client
The client configuration is managed through the server. No separate `.env` file is needed for the client in development mode.

You can also configure the Llama API URL in the Settings page of the application.

For more detailed configuration options, please refer to the [Developer Guide](./documentation/developer_guide.md).

## License

This project is licensed under the ISC License.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

For more information on how to contribute, please refer to the [Developer Guide](./documentation/developer_guide.md).

## Acknowledgements

- [Llama API](https://github.com/solaius/llama-api)
- [React](https://reactjs.org/)
- [Material-UI](https://mui.com/)
- [Express.js](https://expressjs.com/)
- [TypeScript](https://www.typescriptlang.org/)