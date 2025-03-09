# Installing Llama Stack UI on Windows with WSL

This guide will walk you through the process of setting up Llama Stack UI on Windows using Windows Subsystem for Linux (WSL).

## Prerequisites

- Windows 10 version 2004 and higher or Windows 11
- [Windows Subsystem for Linux (WSL2)](https://docs.microsoft.com/en-us/windows/wsl/install)
- Ubuntu 20.04 LTS or newer on WSL
- [Node.js](https://nodejs.org/) (v16 or newer)
- [npm](https://www.npmjs.com/) (v7 or newer)
- [Git](https://git-scm.com/)
- [Windows Terminal](https://apps.microsoft.com/store/detail/windows-terminal/9N0DX20HK701) (recommended)

## Installation Steps

### 1. Install WSL2

Open PowerShell as Administrator and run:

```powershell
wsl --install
```

This will install WSL2 with Ubuntu as the default distribution. Restart your computer when prompted.

After restart, a Ubuntu terminal will open automatically. Set up your username and password as requested.

### 2. Update Ubuntu and Install Prerequisites

Update your package lists:

```bash
sudo apt update && sudo apt upgrade -y
```

Install Node.js, npm, and Git:

```bash
sudo apt install -y nodejs npm git
```

If the Node.js version in the repositories is outdated, you can install a more recent version using NodeSource:

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

### 3. Clone the Repository

```bash
git clone https://github.com/solaius/llama_stack_UI.git
cd llama_stack_UI
```

### 4. Install Dependencies

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

### 5. Configure Environment Variables

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

### 6. Start the Development Servers

#### Start the Server

In one terminal window:

```bash
cd server
npm run dev
```

#### Start the Client

In another terminal window:

```bash
cd client
npm start
```

The application should now be running. You can access it in your Windows browser at [http://localhost:3000](http://localhost:3000).

## Building for Production

To create a production build:

```bash
cd client
npm run build
```

The production-ready files will be in the `client/build` directory.

## Accessing the Application from Windows

When running the application in WSL, you can access it from your Windows browser using `localhost` just as you would with a native Windows application.

## Troubleshooting

### WSL Network Issues

If you're having trouble connecting to services running in WSL:

1. Check that the WSL network adapter is properly configured:
   ```powershell
   Get-NetIPInterface | Where-Object {$_.InterfaceAlias -like "*WSL*"}
   ```

2. Ensure Windows Firewall isn't blocking the connection:
   ```powershell
   New-NetFirewallRule -DisplayName "WSL" -Direction Inbound -InterfaceAlias "vEthernet (WSL)" -Action Allow
   ```

### Node.js Version Issues

If you need a different Node.js version, you can use [nvm](https://github.com/nvm-sh/nvm):

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
source ~/.bashrc
nvm install 16
nvm use 16
```

### File System Performance

For better performance when working with Node.js in WSL, consider storing your project files in the Linux file system rather than mounting from Windows:

```bash
# Instead of /mnt/c/Users/YourName/Projects/llama_stack_UI
# Use ~/llama_stack_UI
```

### WSL Memory Issues

If WSL is using too much memory, you can limit it by creating a `.wslconfig` file in your Windows user directory:

```
# In Windows: %UserProfile%\.wslconfig
[wsl2]
memory=4GB
processors=2
```

After saving this file, restart WSL with:

```powershell
wsl --shutdown
```

## Additional Resources

- [WSL Documentation](https://docs.microsoft.com/en-us/windows/wsl/)
- [Node.js Documentation](https://nodejs.org/en/docs/)
- [React Documentation](https://reactjs.org/docs/getting-started.html)
- [Material-UI Documentation](https://mui.com/getting-started/installation/)