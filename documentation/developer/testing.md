# Testing Documentation for Llama Stack UI

This document provides information about the testing infrastructure for the Llama Stack UI project, including how to run tests, what is being tested, and how to add new tests.

## Overview

The Llama Stack UI project uses Jest as its testing framework for both the client and server components. Tests are written using:

- Jest for test running and assertions
- React Testing Library for testing React components
- Supertest for testing Express endpoints

## Test Structure

The tests are organized as follows:

### Client Tests

- **Component Tests**: Located alongside the components they test in the `client/src/components` directory
- **Context Tests**: Located in the `client/src/contexts` directory
- **Service Tests**: Located in the `client/src/services` directory
- **App Tests**: Located in the root of the `client/src` directory

### Server Tests

- **API Tests**: Located in the `server/src` directory
- **Endpoint Tests**: Located in the `server/src` directory

## Running Tests

### Client Tests

To run the client tests:

```bash
cd client
npm test
```

To run the tests in watch mode (default):

```bash
cd client
npm test
```

To run the tests once without watch mode:

```bash
cd client
npm test -- --watchAll=false
```

### Server Tests

To run the server tests:

```bash
cd server
npm test
```

## Test Coverage

To generate test coverage reports:

### Client Coverage

```bash
cd client
npm test -- --coverage
```

### Server Coverage

```bash
cd server
npm test -- --coverage
```

The coverage reports will be generated in the `coverage` directory of each project.

## What's Being Tested

### Client

1. **Components**:
   - Layout component: Tests for rendering navigation items, logo, and theme toggling
   - Other UI components (to be added)

2. **Contexts**:
   - ThemeContext: Tests for theme mode toggling and context provision

3. **Services**:
   - API Service: Tests for API calls, error handling, and local storage interactions

4. **App**:
   - App component: Tests for proper rendering of the main application structure

### Server

1. **API Endpoints**:
   - Health check endpoint: Tests for proper response
   - Basic server functionality tests

## Adding New Tests

### Adding Client Component Tests

1. Create a new file named `ComponentName.test.tsx` in the same directory as the component
2. Import the component and testing utilities
3. Write tests using React Testing Library

Example:

```tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import ComponentName from './ComponentName';

describe('ComponentName', () => {
  it('renders correctly', () => {
    render(<ComponentName />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

### Adding Server Tests

1. Create a new file named `filename.test.ts` in the server/src directory
2. Import the necessary modules and testing utilities
3. Write tests using Supertest for API endpoints

Example:

```typescript
import request from 'supertest';
import express from 'express';
import { yourEndpointHandler } from './yourFile';

const app = express();
app.use(express.json());
app.get('/your-endpoint', yourEndpointHandler);

describe('Your Endpoint', () => {
  it('should return expected response', async () => {
    const response = await request(app).get('/your-endpoint');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('expectedProperty');
  });
});
```

## Mocking

### Mocking API Calls

For client-side tests that involve API calls, use Jest's mocking capabilities:

```typescript
jest.mock('axios', () => ({
  get: jest.fn(() => Promise.resolve({ data: mockData })),
  post: jest.fn(() => Promise.resolve({ data: mockData })),
}));
```

### Mocking React Router

For components that use React Router:

```typescript
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ id: '123' }),
  useNavigate: () => jest.fn(),
}));
```

## Best Practices

1. **Test Isolation**: Each test should be independent and not rely on the state from other tests
2. **Mock External Dependencies**: Always mock external dependencies like API calls
3. **Test Behavior, Not Implementation**: Focus on testing what the component does, not how it does it
4. **Keep Tests Simple**: Each test should test one specific behavior
5. **Use Descriptive Test Names**: Test names should clearly describe what is being tested

## Troubleshooting Common Issues

### Tests Failing Due to DOM Updates

If tests are failing due to DOM updates, you may need to use `act()` or `waitFor()` from React Testing Library:

```typescript
import { waitFor } from '@testing-library/react';

it('updates after async operation', async () => {
  render(<YourComponent />);
  fireEvent.click(screen.getByText('Update'));
  
  await waitFor(() => {
    expect(screen.getByText('Updated Text')).toBeInTheDocument();
  });
});
```

### Mocking Issues

If you're having issues with mocks not working as expected, make sure:

1. The mock is defined before the test runs
2. The mock is reset between tests using `jest.clearAllMocks()`
3. The path to the mocked module is correct

## Continuous Integration

Tests are run automatically on pull requests and pushes to the main branch using GitHub Actions. The workflow configuration can be found in the `.github/workflows` directory.