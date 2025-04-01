# Installing Llama Stack UI on Linux

This guide will walk you through the process of setting up Llama Stack UI on Linux distributions (Ubuntu/Debian-based systems).

## Prerequisites

- Ubuntu 20.04 LTS or newer (or equivalent Debian-based distribution)
- [Node.js](https://nodejs.org/) (v16 or newer)
- [npm](https://www.npmjs.com/) (v7 or newer)
- [Git](https://git-scm.com/)

## Installation Steps

### 1. Install Prerequisites

Update your package lists:

```bash
sudo apt update
```

Install Node.js, npm, and Git:

```bash
sudo apt install -y nodejs npm git
```

If the Node.js version in your distribution's repositories is outdated, you can install a more recent version using NodeSource:

```bash
# Install curl if not already installed
sudo apt install -y curl

# Setup NodeSource repository for Node.js 16
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -

# Install Node.js and npm
sudo apt install -y nodejs
```

Verify the installations:

```bash
node --version
npm --version
git --version
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

### Serving the Production Build

You can serve the production build using a static file server like `serve`:

```bash
npm install -g serve
serve -s build
```

## Deploying with PM2 (Production)

For production deployments, you can use [PM2](https://pm2.keymetrics.io/) to manage your Node.js processes:

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start the server with PM2
cd server
pm2 start npm --name "llama-stack-server" -- run start

# If you want to serve the client build with Express
cd ../client
npm run build
cd ../server
pm2 start npm --name "llama-stack-client" -- run serve-client

# Set up PM2 to start on system boot
pm2 startup
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME
pm2 save
```

## Troubleshooting

### Node.js Version Issues

If you need a different Node.js version, you can use [nvm](https://github.com/nvm-sh/nvm):

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
source ~/.bashrc
nvm install 16
nvm use 16
```

### Permission Issues

If you encounter permission issues with npm:

```bash
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.profile
source ~/.profile
```

### Firewall Configuration

If you're running a firewall, make sure to allow the necessary ports:

```bash
sudo ufw allow 3000/tcp  # For the client in development
sudo ufw allow 3001/tcp  # For the server
```

## Additional Resources

- [Node.js Documentation](https://nodejs.org/en/docs/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [React Documentation](https://reactjs.org/docs/getting-started.html)
- [Material-UI Documentation](https://mui.com/getting-started/installation/)