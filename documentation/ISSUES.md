# Llama Stack UI - Current Issues and Blockers

This document outlines the current issues and todos that are blocked due to limitations or missing functionality in the Llama Stack API.

## API Limitations and Blockers

### Agent Management

1. **Agent Listing API Incomplete**
   - The `/v1/agents/list` endpoint is not functioning properly
   - Currently using mock data and fallback mechanisms
   - Need to implement proper pagination and filtering once API is available

2. **Agent Creation/Update Limitations**
   - Some fields in the agent creation form may not match the actual API requirements
   - Need to validate the agent configuration schema against the actual API

### Session Management

1. **Session Creation and Listing**
   - No API endpoint available to list sessions for an agent
   - No API endpoint to create named sessions
   - Currently using client-side generated session IDs and mock data

2. **Session History**
   - Cannot retrieve historical sessions and their turns
   - Need API support for session persistence and history retrieval

### Tool Integration

1. **Tool Execution**
   - Limited API support for tool execution and result tracking
   - Need better documentation on tool parameter formats
   - No API for retrieving tool usage history

2. **Tool Result Handling**
   - Inconsistent format for tool results from the API
   - Need standardized error handling for tool execution failures

### Chat and Messaging

1. **Streaming Responses**
   - Streaming API for chat completions needs more robust error handling
   - Need better documentation on handling partial tool calls in streaming mode

2. **Message History**
   - No API endpoint to retrieve full conversation history
   - Need to implement client-side persistence as a workaround

## UI Improvements Pending API Support

1. **Agent Comparison**
   - Cannot implement agent comparison features without proper agent metrics API
   - Need API endpoints for agent performance statistics

2. **Tool Usage Analytics**
   - Cannot show tool usage statistics without API support
   - Currently using mock data for tool usage history

3. **Error Handling**
   - Difficult to provide meaningful error messages without detailed API error responses
   - Need to improve error handling once API stabilizes

## Workarounds Implemented

1. **Mock Data**
   - Using mock data for agent sessions and tool usage history
   - Implemented client-side session generation

2. **Fallback Mechanisms**
   - Added fallback logic when API endpoints are unavailable
   - Using client-side state management to compensate for missing API functionality

3. **Simulated Tool Execution**
   - Implemented simulated tool execution in the chat interface
   - Added UI components that will work with real API data when available

## Next Steps Once API Issues Are Resolved

1. **Replace Mock Data**
   - Replace all mock data with real API calls
   - Update interfaces to match actual API response formats

2. **Implement Full Session Management**
   - Add proper session creation, listing, and management
   - Implement session persistence options

3. **Enhance Tool Integration**
   - Implement real-time tool execution and result handling
   - Add tool usage analytics based on API data

4. **Improve Error Handling**
   - Add more specific error messages based on API responses
   - Implement recovery mechanisms for API failures