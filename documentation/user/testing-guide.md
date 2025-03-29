# Testing Guide for Llama Stack UI

This guide provides simple instructions for running tests in the Llama Stack UI project.

## Prerequisites

Before running tests, make sure you have:

1. Node.js installed (v16 or higher)
2. npm installed (v7 or higher)
3. All dependencies installed for both client and server:
   ```bash
   # Install client dependencies
   cd client
   npm install
   
   # Install server dependencies
   cd server
   npm install
   ```

## Running Client Tests

To run tests for the React client application:

```bash
# Navigate to the client directory
cd client

# Run tests in watch mode (will rerun when files change)
npm test

# Run tests once without watch mode
npm test -- --watchAll=false

# Run tests with coverage report
npm test -- --coverage
```

## Running Server Tests

To run tests for the Express server:

```bash
# Navigate to the server directory
cd server

# Run all tests
npm test

# Run tests with coverage report
npm test -- --coverage
```

## Understanding Test Results

When you run tests, you'll see output similar to:

```
 PASS  src/components/Layout/Layout.test.tsx
 PASS  src/contexts/ThemeContext.test.tsx
 PASS  src/App.test.tsx
 PASS  src/services/api.test.tsx

Test Suites: 4 passed, 4 total
Tests:       18 passed, 18 total
Snapshots:   0 total
Time:        2.428 s
```

- **PASS/FAIL**: Indicates whether all tests in a file passed or failed
- **Test Suites**: The number of test files that passed or failed
- **Tests**: The number of individual test cases that passed or failed
- **Snapshots**: The number of snapshot tests (not currently used)
- **Time**: The total time taken to run the tests

## What's Being Tested

### Client Tests

- **Components**: Tests for UI components like Layout, ensuring they render correctly
- **Context**: Tests for React context providers like ThemeContext
- **Services**: Tests for API service functions
- **App**: Tests for the main App component

### Server Tests

- **API Endpoints**: Tests for server endpoints like health check
- **Request Handling**: Tests for proper request handling and error responses

## Adding Your Own Tests

If you want to add your own tests:

1. For client components, create a file named `ComponentName.test.tsx` next to the component
2. For server endpoints, create a file named `filename.test.ts` in the server/src directory
3. Follow the patterns in existing tests

For more detailed information about testing, please refer to the [Developer Testing Documentation](../developer/testing.md).