# Llama Stack UI - Developer Guide

This guide provides information for developers who want to contribute to or extend the Llama Stack UI project.

## Development Environment Setup

### Prerequisites

- Node.js (v16 or newer)
- npm (v7 or newer)
- Git
- A code editor (VS Code recommended)

### Setting Up the Project

1. Clone the repository:
   ```bash
   git clone https://github.com/solaius/llama_stack_UI.git
   cd llama_stack_UI
   ```

2. Install dependencies for both client and server:
   ```bash
   # Client dependencies
   cd client
   npm install
   cd ..

   # Server dependencies
   cd server
   npm install
   cd ..
   ```

3. Configure environment variables:
   - Create a `.env` file in the server directory
   - Add the necessary configuration (see example below)

   Example `.env` file:
   ```
   PORT=3001
   LLAMA_API_URL=http://localhost:8000
   ```

4. Start the development servers:
   ```bash
   # Start the server (in one terminal)
   cd server
   npm run dev

   # Start the client (in another terminal)
   cd client
   npm start
   ```

## Project Structure

### Client Structure

```
client/
├── public/            # Static files
├── src/
│   ├── components/    # Reusable UI components
│   │   ├── Agents/    # Agent-related components
│   │   ├── Chat/      # Chat interface components
│   │   ├── Common/    # Shared components
│   │   └── Tools/     # Tool-related components
│   ├── contexts/      # React context providers
│   ├── hooks/         # Custom React hooks
│   ├── pages/         # Page components
│   ├── services/      # API services
│   ├── types/         # TypeScript type definitions
│   ├── utils/         # Utility functions
│   ├── App.tsx        # Main application component
│   └── index.tsx      # Application entry point
├── package.json       # Dependencies and scripts
└── tsconfig.json      # TypeScript configuration
```

### Server Structure

```
server/
├── src/
│   ├── controllers/   # Request handlers
│   ├── middleware/    # Express middleware
│   ├── routes/        # API routes
│   ├── services/      # Business logic
│   └── index.ts       # Server entry point
├── .env               # Environment variables
├── package.json       # Dependencies and scripts
└── tsconfig.json      # TypeScript configuration
```

## Key Technologies

- **React**: Frontend library for building user interfaces
- **TypeScript**: Typed superset of JavaScript
- **Material-UI**: React component library for UI elements
- **React Router**: Declarative routing for React
- **Axios**: HTTP client for API requests
- **Express**: Web framework for the server
- **Node.js**: JavaScript runtime for the server

## Development Workflow

### Branching Strategy

- `main`: Production-ready code
- `develop`: Integration branch for features
- Feature branches: Created from `develop` for new features

### Creating a New Feature

1. Create a new branch from `develop`:
   ```bash
   git checkout develop
   git pull
   git checkout -b feature/your-feature-name
   ```

2. Implement your changes
3. Test your changes thoroughly
4. Commit your changes with descriptive messages
5. Push your branch and create a pull request to `develop`

### Code Style and Linting

The project uses ESLint and Prettier for code formatting and linting:

- Run linting: `npm run lint`
- Fix linting issues: `npm run lint:fix`
- Format code: `npm run format`

## Adding New Components

### Component Structure

When creating new components, follow this structure:

```tsx
import React from 'react';
import { Box, Typography } from '@mui/material';

interface MyComponentProps {
  // Define props here
  title: string;
  data?: any;
}

const MyComponent: React.FC<MyComponentProps> = ({ title, data }) => {
  // Component logic here
  
  return (
    <Box>
      <Typography variant="h6">{title}</Typography>
      {/* Component JSX */}
    </Box>
  );
};

export default MyComponent;
```

### Styling Components

Use Material-UI's styling system with the `sx` prop for component styling:

```tsx
<Box
  sx={{
    p: 2,
    borderRadius: 2,
    bgcolor: 'background.paper',
    '&:hover': {
      boxShadow: 2
    }
  }}
>
  {/* Content */}
</Box>
```

For more complex styling, use the `styled` API:

```tsx
import { styled } from '@mui/material/styles';

const StyledBox = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius * 2,
  backgroundColor: theme.palette.background.paper,
  '&:hover': {
    boxShadow: theme.shadows[2]
  }
}));
```

## API Integration

### Adding a New API Endpoint

1. Update the API service in `client/src/services/api.ts`:

```typescript
// Add a new method to the apiService object
const apiService = {
  // Existing methods...
  
  newApiMethod: async (params: ParamType): Promise<ResponseType> => {
    try {
      const response = await api.get('/endpoint-path', { params });
      return response.data;
    } catch (error) {
      console.error('Error in newApiMethod:', error);
      throw error;
    }
  }
};
```

2. If needed, add a new route in the server:

```typescript
// server/src/routes/newRoute.ts
import express from 'express';
import { newController } from '../controllers/newController';

const router = express.Router();

router.get('/endpoint-path', newController.handleRequest);

export default router;
```

3. Add the controller:

```typescript
// server/src/controllers/newController.ts
import { Request, Response } from 'express';
import { newService } from '../services/newService';

export const newController = {
  handleRequest: async (req: Request, res: Response) => {
    try {
      const result = await newService.processRequest(req.query);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'An error occurred' });
    }
  }
};
```

## Testing

### Running Tests

```bash
# Run client tests
cd client
npm test

# Run server tests
cd server
npm test
```

### Writing Tests

For React components, use React Testing Library:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent title="Test Title" />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('handles user interaction', () => {
    const handleClick = jest.fn();
    render(<MyComponent title="Test" onClick={handleClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalled();
  });
});
```

## Building for Production

### Client Build

```bash
cd client
npm run build
```

The build output will be in the `client/build` directory.

### Server Build

```bash
cd server
npm run build
```

The build output will be in the `server/dist` directory.

## Deployment

### Basic Deployment

1. Build both client and server
2. Serve the client build using a static file server
3. Run the server using Node.js or a process manager like PM2

### Docker Deployment

A Dockerfile is provided for containerized deployment:

```bash
# Build the Docker image
docker build -t llama-stack-ui .

# Run the container
docker run -p 3000:3000 -p 3001:3001 llama-stack-ui
```

## Troubleshooting

### Common Issues

- **Module not found errors**: Make sure all dependencies are installed
- **TypeScript errors**: Check type definitions and fix type issues
- **API connection issues**: Verify the API URL in the `.env` file
- **Build errors**: Check for syntax errors or missing dependencies

### Debugging

- Use browser developer tools for client-side debugging
- Use `console.log` or a debugger for server-side debugging
- Check the terminal output for error messages

## Additional Resources

- [React Documentation](https://reactjs.org/docs/getting-started.html)
- [Material-UI Documentation](https://mui.com/getting-started/installation/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Express Documentation](https://expressjs.com/)