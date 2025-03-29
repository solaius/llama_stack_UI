import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatInterface from './ChatInterface';
import apiService from '../../services/api';
import { ThemeProvider } from '../../contexts/ThemeContext';

// Mock the API service
jest.mock('../../services/api', () => ({
  getModels: jest.fn(),
  getTools: jest.fn(),
  createChatCompletion: jest.fn(),
  __esModule: true,
  default: {
    getModels: jest.fn(),
    getTools: jest.fn(),
    createChatCompletion: jest.fn(),
  },
}));

// Mock the SSE module
jest.mock('sse.js', () => ({
  SSE: jest.fn().mockImplementation(() => ({
    onmessage: jest.fn(),
    onerror: jest.fn(),
    close: jest.fn(),
  })),
}));

// Mock the eventSourceRef
const mockEventSource = {
  close: jest.fn(),
};

// Mock the useRef hook to return our mock
jest.mock('react', () => {
  const originalReact = jest.requireActual('react');
  return {
    ...originalReact,
    useRef: jest.fn().mockImplementation((initialValue) => {
      if (initialValue === null) {
        return { current: mockEventSource };
      }
      return { current: initialValue };
    }),
  };
});

// Mock the ChatMessage component
jest.mock('./ChatMessage', () => ({
  __esModule: true,
  default: ({ message }: { message: any }) => (
    <div data-testid="chat-message">
      <div data-testid="message-role">{message.role}</div>
      <div data-testid="message-content">{message.content}</div>
    </div>
  ),
}));

// Mock the scrollIntoView function
Element.prototype.scrollIntoView = jest.fn();

describe('ChatInterface Component', () => {
  const mockModels = [
    {
      identifier: 'model1',
      provider_resource_id: 'resource1',
      provider_id: 'provider1',
      type: 'type1',
      metadata: {},
      model_type: 'llm',
    },
    {
      identifier: 'model2',
      provider_resource_id: 'resource2',
      provider_id: 'provider2',
      type: 'type2',
      metadata: {},
      model_type: 'llm',
    },
  ];

  const mockTools = [
    {
      identifier: 'tool1',
      provider_resource_id: 'resource1',
      provider_id: 'provider1',
      type: 'function',
      toolgroup_id: 'group1',
      tool_host: 'host1',
      description: 'Tool 1 description',
      parameters: [
        {
          name: 'param1',
          parameter_type: 'string',
          description: 'Parameter 1',
          required: true,
          default: null,
        },
      ],
      metadata: null,
    },
    {
      identifier: 'tool2',
      provider_resource_id: 'resource2',
      provider_id: 'provider2',
      type: 'function',
      toolgroup_id: 'group2',
      tool_host: 'host2',
      description: 'Tool 2 description',
      parameters: [],
      metadata: null,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock API responses
    (apiService.getModels as jest.Mock).mockResolvedValue(mockModels);
    (apiService.getTools as jest.Mock).mockResolvedValue(mockTools);
    (apiService.createChatCompletion as jest.Mock).mockResolvedValue({
      completion_message: {
        role: 'assistant',
        content: 'This is a test response',
        stop_reason: 'stop',
        tool_calls: [],
      },
    });
  });

  const renderChatInterface = () => {
    return render(
      <ThemeProvider>
        <ChatInterface />
      </ThemeProvider>
    );
  };

  it('renders the chat interface correctly', async () => {
    renderChatInterface();
    
    // Check for the title
    expect(screen.getByText('Chat with Llama')).toBeInTheDocument();
    
    // Check for the empty state message
    expect(screen.getByText('Start a conversation')).toBeInTheDocument();
    expect(screen.getByText('Select a model and start chatting')).toBeInTheDocument();
    
    // Check for the input field and send button
    expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument();
    expect(screen.getByText('Send')).toBeInTheDocument();
    
    // Wait for models to load
    await waitFor(() => {
      expect(apiService.getModels).toHaveBeenCalled();
      expect(apiService.getTools).toHaveBeenCalled();
    });
  });

  it('allows opening and closing the settings panel', async () => {
    renderChatInterface();
    
    // Settings should be initially closed
    expect(screen.queryByText('Chat Settings')).toBeInTheDocument();
    
    // Open settings
    const settingsButton = screen.getByRole('button', { name: /chat settings/i });
    fireEvent.click(settingsButton);
    
    // Check for settings components
    await waitFor(() => {
      expect(screen.getByText('Model')).toBeInTheDocument();
      expect(screen.getByText('Tools')).toBeInTheDocument();
      expect(screen.getByText('Streaming')).toBeInTheDocument();
    });
    
    // Close settings
    fireEvent.click(settingsButton);
  });

  it('sends a message and displays the response', async () => {
    renderChatInterface();
    
    // Wait for models to load
    await waitFor(() => {
      expect(apiService.getModels).toHaveBeenCalled();
    });
    
    // Type a message
    const inputField = screen.getByPlaceholderText('Type your message...');
    fireEvent.change(inputField, { target: { value: 'Hello, this is a test' } });
    
    // Send the message
    const sendButton = screen.getByText('Send');
    fireEvent.click(sendButton);
    
    // Check that the API was called
    await waitFor(() => {
      expect(apiService.createChatCompletion).toHaveBeenCalled();
    });
    
    // Check that the messages are displayed
    await waitFor(() => {
      const messageElements = screen.getAllByTestId('chat-message');
      expect(messageElements.length).toBe(2); // User message and assistant response
      
      const userRoles = screen.getAllByTestId('message-role');
      expect(userRoles[0].textContent).toBe('user');
      
      const userContents = screen.getAllByTestId('message-content');
      expect(userContents[0].textContent).toBe('Hello, this is a test');
    });
  });

  it('clears the chat when the clear button is clicked', async () => {
    renderChatInterface();
    
    // Wait for models to load
    await waitFor(() => {
      expect(apiService.getModels).toHaveBeenCalled();
    });
    
    // Type and send a message
    const inputField = screen.getByPlaceholderText('Type your message...');
    fireEvent.change(inputField, { target: { value: 'Hello, this is a test' } });
    
    const sendButton = screen.getByText('Send');
    fireEvent.click(sendButton);
    
    // Wait for the response
    await waitFor(() => {
      expect(apiService.createChatCompletion).toHaveBeenCalled();
    });
    
    // Check that messages are displayed
    await waitFor(() => {
      const messageElements = screen.getAllByTestId('chat-message');
      expect(messageElements.length).toBe(2);
    });
    
    // Click the clear button
    const clearButton = screen.getByRole('button', { name: /clear chat/i });
    fireEvent.click(clearButton);
    
    // Check that the chat is cleared
    expect(screen.getByText('Start a conversation')).toBeInTheDocument();
    expect(screen.queryByTestId('chat-message')).not.toBeInTheDocument();
  });

  it('allows changing model selection', async () => {
    renderChatInterface();
    
    // Wait for models to load
    await waitFor(() => {
      expect(apiService.getModels).toHaveBeenCalled();
    });
    
    // Open settings
    const settingsButton = screen.getByRole('button', { name: /chat settings/i });
    fireEvent.click(settingsButton);
    
    // Open the model dropdown
    const modelSelect = screen.getByLabelText('Model');
    fireEvent.mouseDown(modelSelect);
    
    // Select a different model
    await waitFor(() => {
      const modelOption = screen.getByText('model2');
      fireEvent.click(modelOption);
    });
    
    // Type and send a message
    const inputField = screen.getByPlaceholderText('Type your message...');
    fireEvent.change(inputField, { target: { value: 'Test with model2' } });
    
    const sendButton = screen.getByText('Send');
    fireEvent.click(sendButton);
    
    // Check that the API was called with the correct model
    await waitFor(() => {
      expect(apiService.createChatCompletion).toHaveBeenCalledWith(
        expect.objectContaining({
          model_id: 'model2',
        })
      );
    });
  });

  it('allows toggling streaming mode', async () => {
    renderChatInterface();
    
    // Wait for models to load
    await waitFor(() => {
      expect(apiService.getModels).toHaveBeenCalled();
    });
    
    // Open settings
    const settingsButton = screen.getByRole('button', { name: /chat settings/i });
    fireEvent.click(settingsButton);
    
    // Toggle streaming off
    const streamingSwitch = screen.getByRole('checkbox', { name: /streaming/i });
    fireEvent.click(streamingSwitch);
    
    // Type and send a message
    const inputField = screen.getByPlaceholderText('Type your message...');
    fireEvent.change(inputField, { target: { value: 'Test without streaming' } });
    
    const sendButton = screen.getByText('Send');
    fireEvent.click(sendButton);
    
    // Check that the API was called with streaming disabled
    await waitFor(() => {
      expect(apiService.createChatCompletion).toHaveBeenCalledWith(
        expect.objectContaining({
          stream: false,
        })
      );
    });
  });

  it('handles errors gracefully', async () => {
    // Mock API error
    (apiService.createChatCompletion as jest.Mock).mockImplementation(() => {
      throw new Error('API Error');
    });
    
    renderChatInterface();
    
    // Wait for models to load
    await waitFor(() => {
      expect(apiService.getModels).toHaveBeenCalled();
    });
    
    // Type and send a message
    const inputField = screen.getByPlaceholderText('Type your message...');
    fireEvent.change(inputField, { target: { value: 'This will cause an error' } });
    
    const sendButton = screen.getByText('Send');
    fireEvent.click(sendButton);
    
    // Check that the user message is displayed
    await waitFor(() => {
      const userMessage = screen.getByTestId('message-role');
      expect(userMessage.textContent).toBe('user');
      
      const messageContent = screen.getByTestId('message-content');
      expect(messageContent.textContent).toBe('This will cause an error');
    });
    
    // Check that an assistant message is added (which would be the error message)
    await waitFor(() => {
      const messageElements = screen.getAllByTestId('chat-message');
      expect(messageElements.length).toBe(2); // User message and error message
    });
  });
});