#!/bin/bash

# Start the server in the background
cd /workspace/llama_stack_UI/server && npm run dev &
SERVER_PID=$!

# Wait a bit for the server to start
sleep 5

# Start the client with the specified port
cd /workspace/llama_stack_UI/client && PORT=54400 npm start

# When the client is stopped, also stop the server
kill $SERVER_PID