# Streaming Implementation Guide

This guide provides detailed instructions for implementing and troubleshooting streaming responses in the Llama Stack UI agent chat system.

## Table of Contents

1. [Introduction to Streaming](#introduction-to-streaming)
2. [Server-Sent Events (SSE)](#server-sent-events-sse)
3. [Implementation Steps](#implementation-steps)
4. [Event Types and Structure](#event-types-and-structure)
5. [State Management](#state-management)
6. [Error Handling](#error-handling)
7. [Performance Considerations](#performance-considerations)
8. [Debugging Techniques](#debugging-techniques)
9. [Common Pitfalls](#common-pitfalls)

## Introduction to Streaming

Streaming in the context of AI chat interfaces refers to the process of delivering the AI's response incrementally, token by token, rather than waiting for the complete response before displaying anything. This creates a more engaging user experience and provides immediate feedback.

### Benefits of Streaming

- **Improved Perceived Performance**: Users see a response starting immediately
- **Better User Experience**: Creates a more natural, conversational feel
- **Early Feedback**: Users can start reading the response while it's still being generated
- **Reduced Perceived Latency**: Eliminates the "waiting" period for long responses

## Server-Sent Events (SSE)

The Llama Stack UI uses Server-Sent Events (SSE) for streaming, which is a standard for pushing updates from a server to a client over HTTP.

### SSE vs WebSockets

- **SSE**: One-way communication (server to client), simpler implementation, automatic reconnection
- **WebSockets**: Two-way communication, more complex, better for interactive applications

### SSE Client Library

We use the `sse.js` library to handle SSE connections:

```typescript
import { SSE } from 'sse.js';

const eventSource = new SSE(url, {
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'text/event-stream'
  },
  payload: JSON.stringify(data)
});
```

## Implementation Steps

### 1. Initialize State and References

```typescript
// State for messages
const [messages, setMessages] = useState<Message[]>([]);
const [isSending, setIsSending] = useState(false);

// Reference for the event source
const eventSourceRef = useRef<SSE | null>(null);
```

### 2. Set Up the Streaming Handler

```typescript
const handleStreamingResponse = async (userMessage: Message) => {
  // Add a placeholder message for the assistant's response
  const assistantMessage: Message = { role: 'assistant', content: '' };
  
  // Add the placeholder to the messages state
  setMessages(prev => [...prev, assistantMessage]);
  
  try {
    // Create the SSE URL
    const url = `${apiService.getCurrentBaseUrl()}/v1/agents/${agentId}/session/${sessionId}/turn?stream=true`;
    
    // Create the payload
    const payload = {
      messages: [userMessage],
      stream: true
    };
    
    // Initialize the event source
    const eventSource = new SSE(url, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream'
      },
      payload: JSON.stringify(payload)
    });
    
    // Store the event source in the ref
    eventSourceRef.current = eventSource;
    
    // Set up event handlers
    setupEventHandlers(eventSource);
    
    // Start the stream
    eventSource.stream();
  } catch (error) {
    // Handle errors
    handleStreamingError(error);
  }
};
```

### 3. Set Up Event Handlers

```typescript
const setupEventHandlers = (eventSource: SSE) => {
  // Track the accumulated content
  let currentContent = '';
  
  // Handle incoming messages
  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      
      // Handle different event types
      handleStepProgress(data, currentContent);
      handleStepComplete(data);
      handleTurnComplete(data);
    } catch (error) {
      console.error('Error parsing SSE message:', error, event.data);
    }
  };
  
  // Handle errors
  eventSource.onerror = (error) => {
    handleStreamingError(error);
  };
};
```

### 4. Handle Different Event Types

```typescript
const handleStepProgress = (data: any, currentContent: string) => {
  if (data.event?.payload?.event_type === 'step_progress') {
    if (data.event.payload.delta?.text) {
      const newText = data.event.payload.delta.text;
      currentContent += newText;
      
      // Update the message state immutably
      setMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        const updatedMessage = {
          ...lastMessage,
          content: lastMessage.content + newText
        };
        return [...prev.slice(0, -1), updatedMessage];
      });
    }
  }
};

const handleTurnComplete = (data: any) => {
  if (data.event?.payload?.event_type === 'turn_complete') {
    if (data.event.payload.turn?.output_message) {
      const outputMessage = data.event.payload.turn.output_message;
      
      // Update the message state with the final message
      setMessages(prev => {
        const allButLast = prev.slice(0, -1);
        return [...allButLast, outputMessage];
      });
      
      // Clean up
      cleanupEventSource();
    }
  }
};
```

### 5. Clean Up

```typescript
const cleanupEventSource = () => {
  if (eventSourceRef.current) {
    eventSourceRef.current.close();
    eventSourceRef.current = null;
  }
  setIsSending(false);
};

// Make sure to clean up on component unmount
useEffect(() => {
  return () => {
    cleanupEventSource();
  };
}, []);
```

## Event Types and Structure

The Llama Stack API uses several event types for streaming:

### step_progress

Sent when there's new content to display:

```json
{
  "event": {
    "payload": {
      "event_type": "step_progress",
      "step_type": "inference",
      "step_id": "6755620b-795c-4868-9cae-7b3b456be933",
      "delta": {
        "type": "text",
        "text": "token text here"
      }
    }
  }
}
```

### step_complete

Sent when a processing step is complete:

```json
{
  "event": {
    "payload": {
      "event_type": "step_complete",
      "step_type": "inference",
      "step_id": "6755620b-795c-4868-9cae-7b3b456be933",
      "step_details": {
        "turn_id": "b6b8b7c2-1f4f-4465-9d39-4371635b64e1",
        "step_id": "6755620b-795c-4868-9cae-7b3b456be933",
        "started_at": "2025-04-03T20:36:22.814496Z",
        "completed_at": "2025-04-03T20:36:25.059666Z",
        "step_type": "inference",
        "model_response": {
          "role": "assistant",
          "content": "full response text",
          "stop_reason": "end_of_turn",
          "tool_calls": []
        }
      }
    }
  }
}
```

### turn_complete

Sent when the entire turn is complete:

```json
{
  "event": {
    "payload": {
      "event_type": "turn_complete",
      "turn": {
        "turn_id": "b6b8b7c2-1f4f-4465-9d39-4371635b64e1",
        "session_id": "9995ad68-930f-4040-80bf-f4a2e6f8143d",
        "input_messages": [...],
        "steps": [...],
        "output_message": {
          "role": "assistant",
          "content": "full response text",
          "stop_reason": "end_of_turn",
          "tool_calls": []
        },
        "output_attachments": [],
        "started_at": "2025-04-03T20:36:22.812961Z",
        "completed_at": "2025-04-03T20:36:25.059666Z"
      }
    }
  }
}
```

## State Management

Proper state management is crucial for streaming to work correctly. Here are the key principles:

### 1. Immutable Updates

Always update React state immutably:

```typescript
// CORRECT: Create a new object for each update
setMessages(prev => {
  const lastMessage = prev[prev.length - 1];
  const updatedMessage = {
    ...lastMessage,
    content: lastMessage.content + newText
  };
  return [...prev.slice(0, -1), updatedMessage];
});

// INCORRECT: Mutating objects
assistantMessage.content += newText;
setMessages(prev => [...prev.slice(0, -1), assistantMessage]);
```

### 2. Placeholder Management

Start with an empty placeholder and update it as content arrives:

```typescript
// Add empty placeholder
setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

// Update placeholder with content
setMessages(prev => {
  const newMessages = [...prev];
  const lastIndex = newMessages.length - 1;
  newMessages[lastIndex] = {
    ...newMessages[lastIndex],
    content: newMessages[lastIndex].content + newText
  };
  return newMessages;
});

// Replace placeholder with final message
setMessages(prev => {
  const newMessages = [...prev.slice(0, -1)];
  return [...newMessages, finalMessage];
});
```

### 3. Avoid Double Updates

Be careful not to add multiple placeholders or update the wrong message:

```typescript
// Check if we already have a placeholder
const hasPlaceholder = messages.length > 0 && 
                      messages[messages.length - 1].role === 'assistant' && 
                      messages[messages.length - 1].content === '';

if (!hasPlaceholder) {
  // Add placeholder only if needed
  setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
}
```

## Error Handling

Robust error handling is essential for a good user experience:

### 1. Connection Errors

```typescript
eventSource.onerror = (error) => {
  console.error('EventSource error:', error);
  
  // Update UI to show error
  setMessages(prev => {
    const newMessages = [...prev];
    const errorMessage = {
      role: 'assistant',
      content: 'Sorry, there was an error with the connection. Please try again.'
    };
    
    // Replace the placeholder with an error message
    if (newMessages.length > 0) {
      newMessages[newMessages.length - 1] = errorMessage;
    } else {
      newMessages.push(errorMessage);
    }
    
    return newMessages;
  });
  
  // Clean up
  setIsSending(false);
  eventSource.close();
  eventSourceRef.current = null;
};
```

### 2. Parsing Errors

```typescript
try {
  const data = JSON.parse(event.data);
  // Process data...
} catch (error) {
  console.error('Error parsing SSE message:', error, event.data);
  
  // Continue processing other messages
  // Don't terminate the stream for a single parsing error
}
```

### 3. Timeout Handling

```typescript
// Set a timeout for the streaming response
const timeoutId = setTimeout(() => {
  if (eventSourceRef.current) {
    console.warn('Streaming response timed out');
    
    // Update UI to show timeout
    setMessages(prev => {
      const newMessages = [...prev];
      const timeoutMessage = {
        role: 'assistant',
        content: 'The response took too long. Please try again.'
      };
      
      // Replace the placeholder with a timeout message
      if (newMessages.length > 0) {
        newMessages[newMessages.length - 1] = timeoutMessage;
      }
      
      return newMessages;
    });
    
    // Clean up
    eventSourceRef.current.close();
    eventSourceRef.current = null;
    setIsSending(false);
  }
}, 30000); // 30-second timeout

// Clear the timeout when the response completes
clearTimeout(timeoutId);
```

## Performance Considerations

### 1. Throttling Updates

For very fast streams, consider throttling updates to avoid excessive re-renders:

```typescript
// Use a buffer to accumulate changes
let buffer = '';
let lastUpdateTime = Date.now();

eventSource.onmessage = (event) => {
  try {
    const data = JSON.parse(event.data);
    
    if (data.event?.payload?.event_type === 'step_progress') {
      if (data.event.payload.delta?.text) {
        buffer += data.event.payload.delta.text;
        
        // Update at most every 50ms
        const now = Date.now();
        if (now - lastUpdateTime > 50) {
          updateMessageContent(buffer);
          buffer = '';
          lastUpdateTime = now;
        }
      }
    }
  } catch (error) {
    console.error('Error parsing SSE message:', error);
  }
};

// Make sure to flush any remaining buffer when the stream ends
const flushBuffer = () => {
  if (buffer.length > 0) {
    updateMessageContent(buffer);
    buffer = '';
  }
};
```

### 2. Optimizing Renders

Use React's optimization techniques to prevent unnecessary renders:

```typescript
// Use React.memo for the ChatMessage component
const ChatMessage = React.memo(({ message, isLast }: ChatMessageProps) => {
  // Component implementation...
});

// Use useCallback for event handlers
const handleStreamingResponse = useCallback(async (userMessage: Message) => {
  // Implementation...
}, [agentId, sessionId]);
```

## Debugging Techniques

### 1. Console Logging

Add strategic console logs to track the streaming process:

```typescript
console.log('SSE message received:', event.data);
console.log('Updating message with new content:', newText);
console.log('Current total content:', currentContent);
console.log('Messages state after update:', messages);
```

### 2. Visual Indicators

Add visual indicators to show streaming status:

```tsx
<ChatMessage
  message={message}
  isLast={index === messages.length - 1 && isSending}
  isStreaming={index === messages.length - 1 && isSending}
/>
```

### 3. Network Monitoring

Use browser developer tools to monitor the SSE connection:

1. Open Chrome DevTools
2. Go to the Network tab
3. Filter for "EventStream"
4. Observe the SSE connection and events

### 4. State Snapshots

Log state snapshots at key points:

```typescript
useEffect(() => {
  console.log('Messages state changed:', messages);
}, [messages]);
```

## Common Pitfalls

### 1. Event Type Mismatches

**Problem**: The code checks for event types that don't match what the server sends.

**Solution**: Ensure your event type checks match the actual event structure:

```typescript
// CORRECT
if (data.event?.payload?.event_type === 'step_progress') {
  // ...
}

// INCORRECT
if (data.event?.event_type === 'progress') {
  // ...
}
```

### 2. Mutating State Objects

**Problem**: Directly mutating state objects can cause React to miss updates.

**Solution**: Always create new objects when updating state:

```typescript
// CORRECT
setMessages(prev => {
  const newMessages = [...prev];
  newMessages[newMessages.length - 1] = {
    ...newMessages[newMessages.length - 1],
    content: newMessages[newMessages.length - 1].content + newText
  };
  return newMessages;
});

// INCORRECT
assistantMessage.content += newText;
setMessages(prev => [...prev.slice(0, -1), assistantMessage]);
```

### 3. Missing Cleanup

**Problem**: Not cleaning up event sources can lead to memory leaks and unexpected behavior.

**Solution**: Always clean up event sources:

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

### 4. Incorrect Data Path Navigation

**Problem**: Accessing the wrong path in the event data structure.

**Solution**: Carefully check the structure of the events and use optional chaining:

```typescript
// CORRECT
if (data.event?.payload?.delta?.text) {
  // ...
}

// INCORRECT
if (data.event.delta.text) {
  // ...
}
```

### 5. Not Handling All Event Types

**Problem**: Missing handlers for important event types.

**Solution**: Ensure you handle all relevant event types:

```typescript
if (data.event?.payload?.event_type === 'step_progress') {
  // Handle incremental updates
} else if (data.event?.payload?.event_type === 'step_complete') {
  // Handle step completion
} else if (data.event?.payload?.event_type === 'turn_complete') {
  // Handle turn completion
} else {
  console.log('Unhandled event type:', data.event?.payload?.event_type);
}
```

## Conclusion

Implementing streaming in the Llama Stack UI requires careful attention to event handling, state management, and error handling. By following the guidelines in this document, you can create a smooth, responsive streaming experience for users interacting with AI agents.