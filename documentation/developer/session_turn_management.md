# Session and Turn Management Guide

This guide provides detailed information about managing sessions and turns in the Llama Stack UI agent chat system.

## Table of Contents

1. [Introduction](#introduction)
2. [Session Management](#session-management)
   - [Session Structure](#session-structure)
   - [Creating Sessions](#creating-sessions)
   - [Retrieving Sessions](#retrieving-sessions)
   - [Listing Sessions](#listing-sessions)
   - [Session Persistence](#session-persistence)
3. [Turn Management](#turn-management)
   - [Turn Structure](#turn-structure)
   - [Creating Turns](#creating-turns)
   - [Turn Processing](#turn-processing)
   - [Turn Steps](#turn-steps)
4. [Message Handling](#message-handling)
   - [Message Structure](#message-structure)
   - [Message Types](#message-types)
   - [File Attachments](#file-attachments)
5. [API Integration](#api-integration)
   - [Session Endpoints](#session-endpoints)
   - [Turn Endpoints](#turn-endpoints)
   - [Error Handling](#error-handling)
6. [UI Implementation](#ui-implementation)
   - [Session Selection](#session-selection)
   - [Turn Rendering](#turn-rendering)
   - [Message Display](#message-display)
7. [Best Practices](#best-practices)
   - [Session Management](#session-management-best-practices)
   - [Turn Processing](#turn-processing-best-practices)
   - [Error Handling](#error-handling-best-practices)

## Introduction

In the Llama Stack UI, conversations with AI agents are organized into sessions and turns:

- **Session**: A complete conversation between a user and an agent
- **Turn**: A single exchange within a session (user input → agent processing → agent response)

Understanding how to manage these components is essential for developing and extending the chat functionality.

## Session Management

### Session Structure

A session represents a conversation between a user and an agent. Each session has:

```typescript
interface Session {
  session_id: string;         // Unique identifier
  session_name: string;       // Display name
  agent_id: string;           // Associated agent
  turns: Turn[];              // Conversation turns
  started_at: string;         // Creation timestamp
  updated_at?: string;        // Last update timestamp
  metadata?: Record<string, any>; // Additional data
}
```

### Creating Sessions

Sessions are created when a user starts a new conversation with an agent:

```typescript
const createAgentSession = async (
  agentId: string,
  sessionName?: string
): Promise<string> => {
  try {
    const response = await api.post(`/v1/agents/${agentId}/session`, {
      session_name: sessionName || `Chat with Agent - ${new Date().toLocaleString()}`
    });
    return response.data.session_id;
  } catch (error) {
    console.error('Error creating session:', error);
    throw error;
  }
};
```

### Retrieving Sessions

To load an existing session:

```typescript
const getAgentSession = async (
  agentId: string,
  sessionId: string
): Promise<SessionData> => {
  try {
    const response = await api.get(`/v1/agents/${agentId}/session/${sessionId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching session:', error);
    throw error;
  }
};
```

### Listing Sessions

To get all sessions for an agent:

```typescript
const listAgentSessions = async (
  agentId: string
): Promise<SessionData[]> => {
  try {
    const response = await api.get(`/v1/agents/${agentId}/sessions`);
    return response.data.sessions;
  } catch (error) {
    console.error('Error listing sessions:', error);
    throw error;
  }
};
```

### Session Persistence

Sessions are stored in the database and persist between user visits. This allows users to:

- Continue conversations later
- Review past interactions
- Share conversation links

## Turn Management

### Turn Structure

A turn represents a single exchange in a conversation:

```typescript
interface Turn {
  turn_id: string;            // Unique identifier
  session_id: string;         // Parent session
  input_messages: Message[];  // User input
  steps: TurnStep[];          // Processing steps
  output_message: Message;    // Agent response
  output_attachments: Attachment[]; // Any attachments
  started_at: string;         // Start timestamp
  completed_at: string;       // Completion timestamp
}
```

### Creating Turns

Turns are created when a user sends a message:

```typescript
const createAgentTurn = async (
  agentId: string,
  sessionId: string,
  messages: Message[],
  stream: boolean = false
): Promise<TurnResponse> => {
  try {
    const url = `/v1/agents/${agentId}/session/${sessionId}/turn`;
    const response = await api.post(url, { messages, stream });
    return response.data;
  } catch (error) {
    console.error('Error creating turn:', error);
    throw error;
  }
};
```

### Turn Processing

When a turn is created, the server processes it through several steps:

1. **Receive Input**: The user's message is received
2. **Process Input**: The agent processes the input (inference, tool calls, etc.)
3. **Generate Response**: The agent generates a response
4. **Return Output**: The response is returned to the client

### Turn Steps

Each turn consists of one or more processing steps:

```typescript
interface TurnStep {
  turn_id: string;            // Parent turn
  step_id: string;            // Unique identifier
  step_type: 'inference' | 'tool_call' | 'other'; // Type of step
  started_at: string;         // Start timestamp
  completed_at: string;       // Completion timestamp
  // Step-specific details
  model_response?: Message;   // For inference steps
  tool_call?: ToolCall;       // For tool call steps
  tool_response?: any;        // For tool call steps
}
```

Common step types include:

- **Inference**: The agent generates text using the language model
- **Tool Call**: The agent calls a tool to perform an action
- **Tool Response**: The result of a tool call

## Message Handling

### Message Structure

Messages are the basic units of communication:

```typescript
interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  stop_reason?: string;
  tool_calls?: ToolCall[];
  call_id?: string;
  tool_name?: string;
  file?: {
    name: string;
    content: string;
    type: string;
  };
}
```

### Message Types

- **System**: Instructions or context for the agent (not visible to the user)
- **User**: Messages from the user
- **Assistant**: Responses from the agent
- **Tool**: Messages from tools (usually responses to tool calls)

### File Attachments

Messages can include file attachments:

```typescript
interface FileAttachment {
  name: string;       // File name
  content: string;    // Base64-encoded content
  type: string;       // MIME type
}
```

To add a file to a message:

```typescript
const message: Message = {
  role: 'user',
  content: 'Please analyze this document',
  file: {
    name: 'document.pdf',
    content: base64Content,
    type: 'application/pdf'
  }
};
```

## API Integration

### Session Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v1/agents/:agentId/session` | POST | Create a new session |
| `/v1/agents/:agentId/session/:sessionId` | GET | Get session details |
| `/v1/agents/:agentId/sessions` | GET | List all sessions for an agent |
| `/v1/agents/:agentId/session/:sessionId` | DELETE | Delete a session |
| `/v1/agents/:agentId/session/:sessionId` | PATCH | Update session metadata |

### Turn Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v1/agents/:agentId/session/:sessionId/turn` | POST | Create a new turn |
| `/v1/agents/:agentId/session/:sessionId/turn/:turnId` | GET | Get turn details |
| `/v1/agents/:agentId/session/:sessionId/turns` | GET | List all turns in a session |

### Error Handling

Common API errors and how to handle them:

| Error Code | Description | Handling Strategy |
|------------|-------------|-------------------|
| 404 | Session not found | Redirect to create a new session |
| 400 | Invalid request | Check message format and parameters |
| 500 | Server error | Retry with exponential backoff |
| 429 | Rate limit exceeded | Implement rate limiting on the client side |

## UI Implementation

### Session Selection

Implement a session selector to allow users to switch between conversations:

```tsx
const SessionSelector: React.FC<{
  agentId: string;
  currentSessionId: string;
  onSessionChange: (sessionId: string) => void;
}> = ({ agentId, currentSessionId, onSessionChange }) => {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const sessionData = await apiService.listAgentSessions(agentId);
        setSessions(sessionData);
      } catch (error) {
        console.error('Error fetching sessions:', error);
      }
    };
    
    fetchSessions();
  }, [agentId]);
  
  return (
    <Select
      value={currentSessionId}
      onChange={(e) => onSessionChange(e.target.value)}
    >
      {sessions.map((session) => (
        <MenuItem key={session.session_id} value={session.session_id}>
          {session.session_name}
        </MenuItem>
      ))}
      <MenuItem value="new">
        <em>New Conversation</em>
      </MenuItem>
    </Select>
  );
};
```

### Turn Rendering

Render turns in the chat interface:

```tsx
const TurnRenderer: React.FC<{
  turn: Turn;
}> = ({ turn }) => {
  return (
    <>
      {/* Render user messages */}
      {turn.input_messages.map((message, index) => (
        <ChatMessage
          key={`input-${turn.turn_id}-${index}`}
          message={message}
        />
      ))}
      
      {/* Render agent response */}
      <ChatMessage
        key={`output-${turn.turn_id}`}
        message={turn.output_message}
      />
    </>
  );
};
```

### Message Display

Implement a component to display messages:

```tsx
const ChatMessage: React.FC<{
  message: Message;
  isLast?: boolean;
}> = ({ message, isLast }) => {
  const isUser = message.role === 'user';
  
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        mb: 2
      }}
    >
      <Avatar
        sx={{
          bgcolor: isUser ? 'primary.main' : 'secondary.main',
          mr: isUser ? 0 : 1,
          ml: isUser ? 1 : 0
        }}
      >
        {isUser ? <PersonIcon /> : <SmartToyIcon />}
      </Avatar>
      
      <Paper
        elevation={1}
        sx={{
          p: 2,
          maxWidth: '80%',
          borderRadius: 2,
          bgcolor: isUser ? 'primary.light' : 'background.paper',
          color: isUser ? 'primary.contrastText' : 'text.primary',
          position: 'relative',
          '&::after': isLast ? {
            content: '""',
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            bgcolor: 'success.main',
            animation: 'pulse 1.5s infinite'
          } : {}
        }}
      >
        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
          {message.content}
        </Typography>
        
        {/* Render tool calls if present */}
        {message.tool_calls && message.tool_calls.length > 0 && (
          <Box sx={{ mt: 1 }}>
            {message.tool_calls.map((toolCall, index) => (
              <ToolCallRenderer
                key={`tool-call-${index}`}
                toolCall={toolCall}
              />
            ))}
          </Box>
        )}
        
        {/* Render file attachment if present */}
        {message.file && (
          <FileAttachmentRenderer file={message.file} />
        )}
      </Paper>
    </Box>
  );
};
```

## Best Practices

### Session Management Best Practices

1. **Lazy Loading**: Load session details only when needed
2. **Session Naming**: Use descriptive names for sessions
3. **Session Cleanup**: Implement a mechanism to clean up old or unused sessions
4. **Session Sharing**: Allow users to share session links

Example of lazy loading sessions:

```typescript
const [sessionDetails, setSessionDetails] = useState<SessionData | null>(null);
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  const fetchSessionDetails = async () => {
    if (!agentId || !sessionId) return;
    
    setIsLoading(true);
    try {
      const details = await apiService.getAgentSession(agentId, sessionId);
      setSessionDetails(details);
    } catch (error) {
      console.error('Error fetching session details:', error);
      // Handle error
    } finally {
      setIsLoading(false);
    }
  };
  
  fetchSessionDetails();
}, [agentId, sessionId]);
```

### Turn Processing Best Practices

1. **Optimistic Updates**: Show user messages immediately
2. **Loading States**: Indicate when the agent is processing
3. **Error Recovery**: Handle errors gracefully
4. **Pagination**: Implement pagination for sessions with many turns

Example of optimistic updates:

```typescript
const sendMessage = async (content: string) => {
  // Create user message
  const userMessage: Message = {
    role: 'user',
    content
  };
  
  // Optimistically add to UI
  setMessages(prev => [...prev, userMessage]);
  
  // Clear input
  setInput('');
  
  // Show loading state
  setIsSending(true);
  
  try {
    // Send to API
    await apiService.createAgentTurn(agentId, sessionId, [userMessage], isStreaming);
    
    // Note: The response will be handled by the streaming or non-streaming handlers
  } catch (error) {
    console.error('Error sending message:', error);
    
    // Show error message
    setMessages(prev => [
      ...prev,
      {
        role: 'assistant',
        content: 'Sorry, there was an error processing your request.'
      }
    ]);
    
    setIsSending(false);
  }
};
```

### Error Handling Best Practices

1. **Graceful Degradation**: Provide fallbacks when features fail
2. **Informative Errors**: Show helpful error messages
3. **Retry Mechanisms**: Implement retries for transient failures
4. **Logging**: Log errors for debugging

Example of a retry mechanism:

```typescript
const sendMessageWithRetry = async (content: string, maxRetries = 3) => {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      // Try to send the message
      return await sendMessage(content);
    } catch (error) {
      retries++;
      
      // If we've reached max retries, throw the error
      if (retries >= maxRetries) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      const delay = Math.pow(2, retries) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      console.log(`Retrying message send (attempt ${retries + 1}/${maxRetries})...`);
    }
  }
};
```

## Conclusion

Effective session and turn management is essential for creating a smooth, responsive chat experience. By following the patterns and best practices outlined in this guide, you can implement robust chat functionality that handles complex conversations with AI agents.