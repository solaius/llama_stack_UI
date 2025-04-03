# Agent Chat Architecture

This document provides a comprehensive overview of the agent chat architecture in Llama Stack UI, focusing on session handling, streaming, and turn management.

## Table of Contents

1. [Overview](#overview)
2. [Key Components](#key-components)
3. [Session Management](#session-management)
4. [Turn Handling](#turn-handling)
5. [Streaming Implementation](#streaming-implementation)
6. [Event Types](#event-types)
7. [Common Issues and Solutions](#common-issues-and-solutions)
8. [Best Practices](#best-practices)

## Overview

The agent chat system in Llama Stack UI enables real-time conversations with AI agents. It handles:

- Creating and managing chat sessions
- Processing user messages and agent responses
- Streaming responses for a better user experience
- Managing the state of conversations
- Handling tool usage by agents

## Key Components

### Client-Side Components

- **AgentChatPage**: Main component for agent chat interface
- **ChatMessage**: Renders individual messages in the chat
- **API Service**: Handles communication with the backend

### Server-Side Components

- **Session Controller**: Manages chat sessions
- **Turn Controller**: Processes conversation turns
- **Streaming Service**: Handles server-sent events (SSE)

## Session Management

A session represents a conversation between a user and an agent. Each session has:

- A unique `sessionId`
- An associated `agentId`
- A collection of turns (message exchanges)
- Metadata (creation time, name, etc.)

### Session Lifecycle

1. **Creation**: A new session is created when a user starts a chat with an agent
2. **Active**: The session remains active during the conversation
3. **Persistence**: Sessions are stored in the database for future reference
4. **Retrieval**: Users can access past sessions to continue conversations

### Session API Endpoints

```typescript
// Create a new session
const createSession = async (agentId: string, sessionName?: string): Promise<string> => {
  const response = await api.post(`/v1/agents/${agentId}/session`, { session_name: sessionName });
  return response.data.session_id;
};

// Get session details
const getSession = async (agentId: string, sessionId: string): Promise<SessionData> => {
  const response = await api.get(`/v1/agents/${agentId}/session/${sessionId}`);
  return response.data;
};

// List sessions for an agent
const listSessions = async (agentId: string): Promise<SessionData[]> => {
  const response = await api.get(`/v1/agents/${agentId}/sessions`);
  return response.data.sessions;
};
```

## Turn Handling

A turn represents a single exchange in a conversation, consisting of:

- User input message(s)
- Processing steps (inference, tool calls, etc.)
- Agent output message

### Turn Structure

```typescript
interface Turn {
  turn_id: string;
  session_id: string;
  input_messages: Message[];
  steps: TurnStep[];
  output_message: Message;
  output_attachments: Attachment[];
  started_at: string;
  completed_at: string;
}

interface TurnStep {
  turn_id: string;
  step_id: string;
  step_type: 'inference' | 'tool_call' | 'other';
  started_at: string;
  completed_at: string;
  // Step-specific details
}
```

### Creating a Turn

```typescript
const createAgentTurn = async (
  agentId: string,
  sessionId: string,
  messages: Message[],
  stream: boolean = false
): Promise<TurnResponse> => {
  const url = `/v1/agents/${agentId}/session/${sessionId}/turn`;
  const response = await api.post(url, { messages, stream });
  return response.data;
};
```

## Streaming Implementation

Streaming provides a real-time, token-by-token display of the agent's response, creating a more engaging user experience.

### Server-Sent Events (SSE)

The streaming implementation uses Server-Sent Events (SSE) to push updates from the server to the client in real-time.

### Client-Side Implementation

```typescript
// Create a new EventSource for SSE
const url = `${apiService.getCurrentBaseUrl()}/v1/agents/${agentId}/session/${sessionId}/turn?stream=true`;

const eventSource = new SSE(url, {
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'text/event-stream'
  },
  payload: JSON.stringify({
    messages: [userMessage],
    stream: true
  })
});

// Handle incoming events
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  // Process different event types
  if (data.event && data.event.payload && data.event.payload.event_type === 'step_progress') {
    // Handle incremental updates
  } else if (data.event && data.event.payload && data.event.payload.event_type === 'turn_complete') {
    // Handle completion
  }
};

// Start the stream
eventSource.stream();
```

### State Management for Streaming

When implementing streaming, it's crucial to update the React state correctly:

1. Add a placeholder message when starting the stream
2. Update the message content incrementally as tokens arrive
3. Replace the placeholder with the final message when streaming completes

```typescript
// Add placeholder message
setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

// Update message content (immutably)
setMessages(prev => {
  const lastMessage = prev[prev.length - 1];
  const updatedMessage = {
    ...lastMessage,
    content: lastMessage.content + newText,
  };
  return [...prev.slice(0, -1), updatedMessage];
});
```

## Event Types

The streaming API uses several event types to communicate different stages of processing:

### Key Event Types

| Event Type | Description | Data Structure |
|------------|-------------|----------------|
| `step_progress` | Incremental update during processing | Contains `delta.text` with new tokens |
| `step_complete` | A processing step has completed | Contains final step output |
| `turn_complete` | The entire turn has completed | Contains the full `output_message` |

### Event Structure

```typescript
// step_progress event
{
  "event": {
    "payload": {
      "event_type": "step_progress",
      "delta": {
        "type": "text",
        "text": "token text here"
      }
    }
  }
}

// turn_complete event
{
  "event": {
    "payload": {
      "event_type": "turn_complete",
      "turn": {
        "turn_id": "...",
        "session_id": "...",
        "input_messages": [...],
        "steps": [...],
        "output_message": {
          "role": "assistant",
          "content": "full response text",
          "stop_reason": "end_of_turn",
          "tool_calls": []
        },
        "output_attachments": [],
        "started_at": "...",
        "completed_at": "..."
      }
    }
  }
}
```

## Common Issues and Solutions

### 1. Messages Not Updating During Streaming

**Issue**: The UI doesn't update as streaming events arrive.

**Solution**: 
- Ensure you're updating React state immutably
- Check that you're listening for the correct event types
- Verify the event data structure matches what you're expecting

```typescript
// Correct approach - create new objects for each update
setMessages(prev => {
  const lastMessage = prev[prev.length - 1];
  const updatedMessage = {
    ...lastMessage,
    content: lastMessage.content + newText,
  };
  return [...prev.slice(0, -1), updatedMessage];
});

// Incorrect approach - mutating objects
assistantMessage.content += newText;
setMessages(prev => [...prev.slice(0, -1), assistantMessage]);
```

### 2. Event Type Mismatches

**Issue**: The code checks for event types that don't match what the server sends.

**Solution**: Ensure your event type checks match the actual event structure:

```typescript
// Correct
if (data.event && data.event.payload && data.event.payload.event_type === 'step_progress') {
  // ...
}

// Incorrect
if (data.event && data.event.event_type === 'progress') {
  // ...
}
```

### 3. Duplicate Messages

**Issue**: Messages appear multiple times in the chat.

**Solution**: Ensure you're not adding placeholder messages multiple times and that you're correctly replacing placeholders with final messages.

## Best Practices

### 1. Immutable State Updates

Always update React state immutably, especially when dealing with streaming updates:

```typescript
// Good practice
setMessages(prev => {
  const newMessages = [...prev];
  newMessages[newMessages.length - 1] = {
    ...newMessages[newMessages.length - 1],
    content: newMessages[newMessages.length - 1].content + newText
  };
  return newMessages;
});
```

### 2. Proper Event Cleanup

Always clean up event sources when components unmount:

```typescript
useEffect(() => {
  // Setup code...
  
  return () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  };
}, []);
```

### 3. Error Handling

Implement robust error handling for both streaming and non-streaming requests:

```typescript
eventSource.onerror = (error) => {
  console.error('EventSource error:', error);
  setIsSending(false);
  eventSource.close();
  eventSourceRef.current = null;
  
  // Update UI to show error
  setMessages(prev => {
    const newMessages = [...prev];
    const errorMessage = {
      role: 'assistant',
      content: 'Sorry, there was an error with the connection. Please try again.'
    };
    newMessages[newMessages.length - 1] = errorMessage;
    return newMessages;
  });
};
```

### 4. Consistent Loading States

Maintain consistent loading states to provide a good user experience:

```typescript
// Set loading state before sending
setIsSending(true);

// Clear loading state after response or error
setIsSending(false);
```

### 5. Debugging Streaming Issues

Add debug logging to track streaming events:

```typescript
eventSource.onmessage = (event) => {
  console.log('SSE message received:', event.data);
  // Process event...
};
```

## Conclusion

The agent chat architecture in Llama Stack UI provides a robust framework for real-time conversations with AI agents. By understanding the session management, turn handling, and streaming implementation, developers can effectively work with and extend the chat functionality.