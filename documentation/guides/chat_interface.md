# Chat Interface Guide

This guide provides detailed instructions on how to use the chat interface in the Llama Stack UI.

## Overview

The chat interface allows you to interact with AI agents through a conversational interface. You can send messages, receive responses, and see how the agent uses tools to fulfill your requests.

## Starting a Chat

There are several ways to start a chat:

1. **From the Navigation Menu**:
   - Click on **Chat** in the left sidebar
   - Select an agent from the dropdown menu
   - A new chat session will be created

2. **From the Agent List**:
   - Navigate to the Agents page
   - Find the agent you want to chat with
   - Click the **Chat** button (chat icon) in the Actions column

3. **From Agent Details**:
   - Navigate to the agent's details page
   - Click the **Chat with Agent** button at the top of the page

## Chat Interface Components

The chat interface consists of several components:

### Message Area

The main part of the screen displays the conversation history:

- **User Messages**: Your messages appear on the right side with a light background
- **Agent Responses**: The agent's responses appear on the left side
- **Tool Usage**: When the agent uses tools, you'll see the tool calls and their results

### Input Area

At the bottom of the screen is the input area:

- **Message Input**: Type your message here
- **Send Button**: Click to send your message
- **Attachments**: Some agents may support file attachments (if configured)

### Session Controls

At the top of the chat interface:

- **Agent Selector**: Change which agent you're chatting with
- **New Chat**: Start a new session with the current agent
- **Session Name**: The name of the current session (can be edited)
- **Settings**: Access chat-specific settings

## Interacting with Agents

### Basic Conversation

1. Type your message in the input field
2. Press Enter or click the Send button
3. Wait for the agent to respond
4. Continue the conversation as needed

### Tool Usage

When an agent uses tools to fulfill your request:

1. You'll see a "Thinking..." indicator while the agent processes your request
2. The agent will show which tool it's using and why
3. The tool execution results will be displayed
4. The agent will provide its final response based on the tool results

### Session Management

- **Naming Sessions**: Click on the session name at the top to rename it
- **Switching Sessions**: Use the session dropdown to switch between active sessions
- **Ending Sessions**: Close a session using the X button in the session tab

## Advanced Features

### Message References

You can reference previous messages in the conversation:

1. Hover over a message
2. Click the "Quote" button that appears
3. The message will be referenced in your next response

### Code Execution

For agents with code execution capabilities:

1. The agent may generate code snippets in response to your requests
2. Code blocks will be displayed with syntax highlighting
3. Some code blocks may have an "Execute" button if the agent supports code execution
4. Results of code execution will be displayed in the chat

### File Sharing

If file sharing is enabled:

1. Click the attachment button in the input area
2. Select a file from your device
3. The file will be uploaded and shared with the agent
4. The agent can process the file and respond accordingly

## Tips for Effective Communication

1. **Be Clear and Specific**: Clearly state what you want the agent to help you with
2. **Provide Context**: Give enough background information for the agent to understand your request
3. **Break Down Complex Tasks**: For complex requests, break them into smaller steps
4. **Correct Misunderstandings**: If the agent misunderstands, politely clarify what you meant
5. **Use Follow-up Questions**: Ask follow-up questions to get more detailed information

## Troubleshooting

### Agent Not Responding

If the agent stops responding:

1. Check your internet connection
2. Try refreshing the page
3. Start a new chat session
4. If the problem persists, the API server may be experiencing issues

### Incorrect Tool Usage

If the agent is using tools incorrectly:

1. Try rephrasing your request to be more specific
2. Check if the agent has access to the appropriate tools
3. Consider editing the agent's system prompt to improve tool usage

### Session Management Issues

If you're having trouble with chat sessions:

1. Try clearing your browser cache
2. Ensure you're using a supported browser (Chrome, Firefox, Safari, Edge)
3. Check if there are any error messages in the browser console