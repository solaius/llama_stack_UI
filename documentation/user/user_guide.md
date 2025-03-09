# Llama Stack UI - User Guide

This guide provides instructions on how to use the Llama Stack UI to manage agents, tools, and interact with AI models.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Agent Management](#agent-management)
3. [Tool Management](#tool-management)
4. [Chat Interface](#chat-interface)
5. [Settings](#settings)
6. [Troubleshooting](#troubleshooting)

## Getting Started

### Accessing the UI

After installation, you can access the Llama Stack UI by navigating to the appropriate URL in your web browser:

- Development mode: [http://localhost:3000](http://localhost:3000)
- Production deployment: The URL will depend on your hosting configuration

### Navigation

The main navigation menu is located on the left side of the screen and provides access to:

- **Home**: Dashboard with overview information
- **Chat**: Interface for interacting with agents
- **Agents**: Management of AI agents
- **Tools**: Management of tools and tool groups

## Agent Management

### Viewing Agents

1. Click on **Agents** in the navigation menu
2. The agents list displays all available agents with their basic information
3. Use the search field to filter agents by name, ID, or description

### Creating a New Agent

1. Click on **Agents** in the navigation menu
2. Click the **Create New Agent** button
3. Fill in the required fields:
   - **Name**: A descriptive name for the agent
   - **Model**: Select the AI model to use
   - **System Prompt**: Instructions that define the agent's behavior
4. Configure additional settings as needed:
   - **Sampling Parameters**: Control the model's output generation
   - **Tool Configuration**: Set up how the agent uses tools
   - **Advanced Settings**: Additional configuration options
5. Click **Create** to save the new agent

### Editing an Agent

1. In the agents list, find the agent you want to edit
2. Click the **Edit** button (pencil icon)
3. Modify the agent's settings as needed
4. Click **Save** to apply your changes

### Deleting an Agent

1. In the agents list, find the agent you want to delete
2. Click the **Delete** button (trash icon)
3. Confirm the deletion in the dialog that appears

### Agent Details

1. Click on an agent's name or the **View** button to see detailed information
2. The agent details page shows:
   - Basic information (name, ID, model, creation date)
   - System prompt
   - Configuration settings
   - Sessions history
   - Tool usage statistics

### Chatting with an Agent

1. From the agents list or agent details page, click the **Chat** button
2. This will open a new chat session with the selected agent

## Tool Management

### Viewing Tools

1. Click on **Tools** in the navigation menu
2. The tools list displays all available tools with their basic information
3. Use the search and filter options to find specific tools

### Tool Groups

Tool groups allow you to organize tools and assign them to agents.

#### Creating a Tool Group

1. In the Tools section, navigate to the **Tool Groups** tab
2. Click **Create New Tool Group**
3. Fill in the required fields:
   - **Name**: A descriptive name for the group
   - **Description**: Optional information about the group's purpose
   - **Tools**: Select the tools to include in this group
4. Click **Create** to save the new tool group

#### Editing a Tool Group

1. In the tool groups list, find the group you want to edit
2. Click the **Edit** button
3. Modify the group's settings as needed
4. Click **Save** to apply your changes

#### Deleting a Tool Group

1. In the tool groups list, find the group you want to delete
2. Click the **Delete** button
3. Confirm the deletion in the dialog that appears

## Chat Interface

### Starting a New Chat

1. Click on **Chat** in the navigation menu
2. Select an agent to chat with
3. A new chat session will be created

### Interacting with an Agent

1. Type your message in the input field at the bottom of the chat
2. Press Enter or click the send button to submit your message
3. The agent will process your message and respond
4. If the agent uses tools, you'll see the tool usage information in the chat

### Managing Chat Sessions

1. Your chat sessions are saved automatically
2. You can view past sessions in the agent details page
3. To start a new session with the same agent, click the **New Chat** button

## Settings

### API Configuration

1. Click on the settings icon in the navigation menu
2. Enter the Llama API URL if it's different from the default
3. Save your changes

### Theme Settings

1. Click on the theme toggle button in the top navigation bar
2. Choose between light and dark themes

## Troubleshooting

### Connection Issues

If you're having trouble connecting to the Llama API:

1. Check that the API server is running
2. Verify the API URL in the settings
3. Check your network connection
4. Look for error messages in the browser console

### Performance Issues

If the UI is running slowly:

1. Try refreshing the page
2. Check your browser's resource usage
3. Close unnecessary browser tabs
4. Restart the application if needed

### Error Messages

Common error messages and their solutions:

- **"Failed to fetch"**: Check your network connection and API URL
- **"Unauthorized"**: Verify your authentication credentials
- **"Not Found"**: The requested resource doesn't exist
- **"Internal Server Error"**: There's an issue with the API server

If you encounter persistent issues, please refer to the project's issue tracker or contact support.