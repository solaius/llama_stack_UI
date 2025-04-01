# Installing Llama Stack UI on macOS

This guide will walk you through the process of setting up Llama Stack UI on macOS.

## Prerequisites

- macOS 10.15 (Catalina) or newer
- [Homebrew](https://brew.sh/) package manager
- [Node.js](https://nodejs.org/) (v16 or newer)
- [npm](https://www.npmjs.com/) (v7 or newer)
- [Git](https://git-scm.com/)

## Installation Steps

### 1. Install Prerequisites

If you don't have Homebrew installed, install it by running:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Install Node.js and Git using Homebrew:

```bash
brew install node git
```

### 2. Clone the Repository

```bash
git clone https://github.com/solaius/llama_stack_UI.git
cd llama_stack_UI
```

### 3. Install Dependencies

#### Client Dependencies

```bash
cd client
npm install
cd ..
```

#### Server Dependencies

```bash
cd server
npm install
cd ..
```

### 4. Configure Environment Variables

Create a `.env` file in the server directory:

```bash
cd server
touch .env
```

Open the `.env` file in your favorite text editor and add the following configuration:

```
PORT=3001
LLAMA_API_URL=http://localhost:8000
```

Adjust the `LLAMA_API_URL` to point to your Llama API server if it's running on a different host or port.

### 5. Start the Development Servers

#### Start the Server

In one terminal window:

```bash
cd server
npm run dev
```

#### Start the Client

In another terminal window:

```bash
# set the environment variable for the proxy
export REACT_APP_API_URL=http://localhost:3001/api

cd client
npm start
```

The application should now be running at [http://localhost:3000](http://localhost:3000).

## Building for Production

To create a production build:

```bash
cd client
npm run build
```

The production-ready files will be in the `client/build` directory.

## Troubleshooting

### Node.js Version Issues

If you encounter issues with Node.js versions, consider using [nvm](https://github.com/nvm-sh/nvm) to manage multiple Node.js versions:

```bash
brew install nvm
nvm install 16
nvm use 16
```

### Port Conflicts

If you see errors about ports being in use, you can change the port for the client or server:

- For the client, you can set the `PORT` environment variable before starting:
  ```bash
  PORT=3002 npm start
  ```

- For the server, modify the `PORT` in the `.env` file.

### API Connection Issues

If the UI cannot connect to the Llama API:

1. Verify the API is running
2. Check the `LLAMA_API_URL` in your `.env` file
3. Ensure there are no network restrictions blocking the connection

## Additional Resources

- [Node.js Documentation](https://nodejs.org/en/docs/)
- [React Documentation](https://reactjs.org/docs/getting-started.html)
- [Material-UI Documentation](https://mui.com/getting-started/installation/)