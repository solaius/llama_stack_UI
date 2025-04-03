# Developer Documentation

Welcome to the Llama Stack UI developer documentation. This section contains guides and information for developers who want to contribute to or extend the project.

## Getting Started

If you're new to developing for Llama Stack UI, start with the [Developer Guide](./developer_guide.md) for an overview of the project structure, development environment setup, and contribution workflow.

## Project Status

- [Current State](./CURRENT_STATE.md) - The current state of the project
- [Requirements](./REQUIREMENTS.md) - Project requirements and specifications
- [Issues](./ISSUES.md) - Known issues and limitations

## Architecture

The Llama Stack UI follows a client-server architecture:

- **Client**: A React application built with TypeScript and Material-UI
- **Server**: A Node.js Express server that acts as a proxy to the Llama API

### Key Technologies

- **Frontend**: React, TypeScript, Material-UI
- **Backend**: Node.js, Express
- **API Communication**: Axios
- **Routing**: React Router
- **State Management**: React Context API

### Detailed Architecture Guides

- [Agent Chat Architecture](./agent_chat_architecture.md) - Overview of the agent chat system
- [Session and Turn Management](./session_turn_management.md) - How sessions and turns are managed
- [Streaming Implementation Guide](./streaming_implementation_guide.md) - Implementing streaming responses

## Development Workflow

1. Set up your development environment following the installation guides
2. Create a feature branch from the main branch
3. Implement your changes
4. Test your changes thoroughly
5. Submit a pull request

## Contributing

Contributions to Llama Stack UI are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test your changes
5. Submit a pull request

Please ensure your code follows the project's coding standards and includes appropriate tests.

## Building and Deployment

For information on building and deploying the application, refer to the [Developer Guide](./developer_guide.md#building-for-production) section on building for production.