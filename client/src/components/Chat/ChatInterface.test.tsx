import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '../../contexts/ThemeContext';
import apiService from '../../services/api';

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

// Mock ChatMessage component to avoid syntax highlighter issues
jest.mock('./ChatMessage', () => {
  return {
    __esModule: true,
    default: ({ message }: any) => (
      <div className="chat-message" data-testid="chat-message">
        <div className="message-header">
          <span data-testid="message-role">{message.role}</span>
        </div>
        <div className="message-content" data-testid="message-content">
          {message.content}
        </div>
      </div>
    )
  };
});

// Mock SSE.js
jest.mock('sse.js', () => {
  return {
    SSE: class MockSSE {
      constructor(url: string, options: any) {
        this.url = url;
        this.options = options;
      }
      
      stream() {
        return this;
      }
      
      close() {
        // Do nothing
      }
      
      url: string;
      options: any;
      onmessage: ((event: any) => void) | null = null;
      onerror: ((error: any) => void) | null = null;
    }
  };
});

// Mock scrollIntoView
if (!window.Element.prototype.scrollIntoView) {
  window.Element.prototype.scrollIntoView = jest.fn();
}

// Import the component after all mocks are set up
import ChatInterface from './ChatInterface';

describe('ChatInterface Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock API responses
    (apiService.getModels as jest.Mock).mockResolvedValue([
      { identifier: 'model1', provider_id: 'provider1', model_type: 'llm' },
      { identifier: 'model2', provider_id: 'provider2', model_type: 'llm' },
    ]);
    
    (apiService.getTools as jest.Mock).mockResolvedValue([
      { identifier: 'tool1', description: 'Tool 1 description' },
      { identifier: 'tool2', description: 'Tool 2 description' },
    ]);
    
    (apiService.createChatCompletion as jest.Mock).mockResolvedValue({
      completion_message: {
        role: 'assistant',
        content: 'This is a test response',
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

  it.skip('renders the chat interface correctly', async () => {
    renderChatInterface();
    
    // Wait for models to load
    await waitFor(() => {
      expect(apiService.getModels).toHaveBeenCalled();
    });
    
    // Check that the input field and send button are rendered
    expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument();
    expect(screen.getByText('Send')).toBeInTheDocument();
    
    // Check that the settings button is rendered
    expect(screen.getByLabelText('Settings')).toBeInTheDocument();
  });

  it.skip('allows opening and closing the settings panel', async () => {
    renderChatInterface();
    
    // Wait for models to load
    await waitFor(() => {
      expect(apiService.getModels).toHaveBeenCalled();
    });
    
    // Open settings panel
    const settingsButton = screen.getByLabelText('Settings');
    fireEvent.click(settingsButton);
    
    // Check that the settings panel is open
    expect(screen.getByText('Chat Settings')).toBeInTheDocument();
    expect(screen.getByText('Model')).toBeInTheDocument();
    expect(screen.getByText('Temperature')).toBeInTheDocument();
    
    // Close setting panel
    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);
    
    // Check that the setting panel is closed
    await waitFor(() => {
      expect(screen.queryByText('Chat Settings')).not.toBeInTheDocument();
    });
  });

  it.skip('sends a message and displays the response', async () => {
    renderChatInterface();
    
    // Wait for models to load
    await waitFor(() => {
      expect(apiService.getModels).toHaveBeenCalled();
    });
    
    // Type and send a message
    const inputField = screen.getByPlaceholderText('Type your message...');
    fireEvent.change(inputField, { target: { value: 'Hello, how are you?' } });
    
    const sendButton = screen.getByText('Send');
    fireEvent.click(sendButton);
    
    // Check that the user message is displayed
    await waitFor(() => {
      const userMessage = screen.getByText('user');
      expect(userMessage).toBeInTheDocument();
      
      const messageContent = screen.getByText('Hello, how are you?');
      expect(messageContent).toBeInTheDocument();
    });
    
    // Check that the API was called with the correct parameters
    expect(apiService.createChatCompletion).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [{ role: 'user', content: 'Hello, how are you?' }],
      })
    );
    
    // Check that the assistant response is displayed
    await waitFor(() => {
      const assistantMessage = screen.getAllByText('assistant');
      expect(assistantMessage.length).toBeGreaterThan(0);
      
      const responseContent = screen.getByText('This is a test response');
      expect(responseContent).toBeInTheDocument();
    });
  });

  it.skip('clears the chat when the clear button is clicked', async () => {
    renderChatInterface();
    
    // Wait for models to load
    await waitFor(() => {
      expect(apiService.getModels).toHaveBeenCalled();
    });
    
    // Type and send a message
    const inputField = screen.getByPlaceholderText('Type your message...');
    fireEvent.change(inputField, { target: { value: 'Hello, how are you?' } });
    
    const sendButton = screen.getByText('Send');
    fireEvent.click(sendButton);
    
    // Wait for the response
    await waitFor(() => {
      const messageElements = screen.getAllByTestId('chat-message');
      expect(messageElements.length).toBe(2); // User message and assistant response
    });
    
    // Click the clear button
    const clearButton = screen.getByLabelText('Clear chat');
    fireEvent.click(clearButton);
    
    // Check that the chat is cleared
    await waitFor(() => {
      const messageElements = screen.queryAllByTestId('chat-message');
      expect(messageElements.length).toBe(0);
    });
  });

  it.skip('allows changing model selection', async () => {
    renderChatInterface();
    
    // Wait for models to load
    await waitFor(() => {
      expect(apiService.getModels).toHaveBeenCalled();
    });
    
    // Open settings panel
    const settingsButton = screen.getByLabelText('Settings');
    fireEvent.click(settingsButton);
    
    // Select a different model
    const modelSelect = screen.getByLabelText('Model');
    fireEvent.mouseDown(modelSelect);
    
    // Wait for the dropdown to open
    await waitFor(() => {
      const modelOption = screen.getByText('model2');
      fireEvent.click(modelOption);
    });
    
    // Type and send a message
    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);
    
    const inputField = screen.getByPlaceholderText('Type your message...');
    fireEvent.change(inputField, { target: { value: 'Hello with model2' } });
    
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

  it.skip('allows toggling streaming mode', async () => {
    renderChatInterface();
    
    // Wait for models to load
    await waitFor(() => {
      expect(apiService.getModels).toHaveBeenCalled();
    });
    
    // Open settings panel
    const settingsButton = screen.getByLabelText('Settings');
    fireEvent.click(settingsButton);
    
    // Toggle streaming mode
    const streamingSwitch = screen.getByLabelText('Streaming');
    fireEvent.click(streamingSwitch);
    
    // Close settings panel
    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);
    
    // Type and send a message
    const inputField = screen.getByPlaceholderText('Type your message...');
    fireEvent.change(inputField, { target: { value: 'Hello with streaming' } });
    
    const sendButton = screen.getByText('Send');
    fireEvent.click(sendButton);
    
    // Check that the API was called with streaming enabled
    await waitFor(() => {
      expect(apiService.createChatCompletion).toHaveBeenCalledWith(
        expect.objectContaining({
          stream: true,
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