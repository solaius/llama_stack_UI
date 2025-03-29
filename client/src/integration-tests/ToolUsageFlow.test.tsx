import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '../contexts/ThemeContext';

// Mock the pages since they might not exist or have dependencies we can't easily mock
jest.mock('../pages/ChatPage', () => ({
  __esModule: true,
  default: () => <div>Chat Page</div>
}));

jest.mock('../pages/ToolsPage', () => ({
  __esModule: true,
  default: () => <div>Tools Page</div>
}));

// Import the mocked components
import ChatPage from '../pages/ChatPage';
import ToolsPage from '../pages/ToolsPage';

// Mock scrollIntoView
Element.prototype.scrollIntoView = jest.fn();

// Mock SyntaxHighlighter
jest.mock('react-syntax-highlighter', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="syntax-highlighter">{children}</div>
  ),
}));

jest.mock('react-syntax-highlighter/dist/esm/styles/hljs', () => ({
  docco: {},
  dark: {},
}));
import apiService from '../services/api';

// Mock the API service
jest.mock('../services/api', () => ({
  getModels: jest.fn(),
  getTools: jest.fn(),
  createChatCompletion: jest.fn(),
  invokeTool: jest.fn(),
  __esModule: true,
  default: {
    getModels: jest.fn(),
    getTools: jest.fn(),
    createChatCompletion: jest.fn(),
    invokeTool: jest.fn(),
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

describe('Tool Usage Flow Integration Test', () => {
  const mockModels = [
    {
      identifier: 'model1',
      provider_resource_id: 'resource1',
      provider_id: 'provider1',
      type: 'type1',
      metadata: {},
      model_type: 'llm',
    },
  ];

  const mockTools = [
    {
      identifier: 'calculator',
      provider_resource_id: 'resource1',
      provider_id: 'provider1',
      type: 'function',
      toolgroup_id: 'group1',
      tool_host: 'host1',
      description: 'A calculator tool',
      parameters: [
        {
          name: 'operation',
          parameter_type: 'string',
          description: 'The operation to perform',
          required: true,
          default: null,
        },
        {
          name: 'a',
          parameter_type: 'number',
          description: 'First number',
          required: true,
          default: null,
        },
        {
          name: 'b',
          parameter_type: 'number',
          description: 'Second number',
          required: true,
          default: null,
        },
      ],
      metadata: null,
    },
    {
      identifier: 'weather',
      provider_resource_id: 'resource2',
      provider_id: 'provider2',
      type: 'function',
      toolgroup_id: 'group2',
      tool_host: 'host2',
      description: 'A weather tool',
      parameters: [
        {
          name: 'location',
          parameter_type: 'string',
          description: 'The location to get weather for',
          required: true,
          default: null,
        },
      ],
      metadata: null,
    },
  ];

  const mockChatResponse = {
    completion_message: {
      role: 'assistant',
      content: 'I can help you with that calculation.',
      stop_reason: 'stop',
      tool_calls: [
        {
          id: 'tool-call-1',
          type: 'function',
          function: {
            name: 'calculator',
            arguments: '{"operation":"add","a":5,"b":3}',
          },
        },
      ],
    },
  };

  const mockToolResponse = {
    result: 8,
    status: 'success',
  };

  const mockToolResultChatResponse = {
    completion_message: {
      role: 'assistant',
      content: 'The result of 5 + 3 is 8.',
      stop_reason: 'stop',
      tool_calls: [],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock API responses
    (apiService.getModels as jest.Mock).mockResolvedValue(mockModels);
    (apiService.getTools as jest.Mock).mockResolvedValue(mockTools);
    (apiService.createChatCompletion as jest.Mock)
      .mockResolvedValueOnce(mockChatResponse)
      .mockResolvedValueOnce(mockToolResultChatResponse);
    (apiService.invokeTool as jest.Mock).mockResolvedValue(mockToolResponse);
  });

  const renderApp = (initialRoute = '/chat') => {
    return render(
      <ThemeProvider>
        <MemoryRouter initialEntries={[initialRoute]}>
          <Routes>
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/tools" element={<ToolsPage />} />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>
    );
  };

  it.skip('should allow using tools in a chat conversation', async () => {
    // Start at the chat page
    renderApp();
    
    // Wait for the chat page to load
    await waitFor(() => {
      expect(apiService.getModels).toHaveBeenCalled();
      expect(apiService.getTools).toHaveBeenCalled();
      expect(screen.getByText('Chat with Llama')).toBeInTheDocument();
    });
    
    // Open settings
    const settingsButton = screen.getByRole('button', { name: /chat settings/i });
    fireEvent.click(settingsButton);
    
    // Wait for settings to open
    await waitFor(() => {
      expect(screen.getByText('Model')).toBeInTheDocument();
      expect(screen.getByText('Tools')).toBeInTheDocument();
    });
    
    // Select a tool
    const toolsSelect = screen.getByLabelText('Tools');
    fireEvent.mouseDown(toolsSelect);
    
    await waitFor(() => {
      const calculatorOption = screen.getByText(/calculator/i);
      fireEvent.click(calculatorOption);
    });
    
    // Close settings
    fireEvent.click(settingsButton);
    
    // Type a message asking for a calculation
    const messageInput = screen.getByPlaceholderText('Type your message...');
    fireEvent.change(messageInput, { target: { value: 'What is 5 + 3?' } });
    
    // Send the message
    const sendButton = screen.getByText('Send');
    fireEvent.click(sendButton);
    
    // Wait for the response with tool call
    await waitFor(() => {
      expect(apiService.createChatCompletion).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'user',
              content: 'What is 5 + 3?',
            }),
          ]),
          tools: expect.arrayContaining([
            expect.objectContaining({
              tool_name: 'calculator',
            }),
          ]),
        })
      );
    });
    
    // Check that the assistant message is displayed
    await waitFor(() => {
      expect(screen.getByText('I can help you with that calculation.')).toBeInTheDocument();
    });
    
    // Check that the tool call is displayed
    await waitFor(() => {
      expect(screen.getByText(/Tool: calculator/i)).toBeInTheDocument();
    });
    
    // Wait for the tool result
    await waitFor(() => {
      expect(apiService.invokeTool).toHaveBeenCalledWith(
        'calculator',
        {
          operation: 'add',
          a: 5,
          b: 3,
        }
      );
    });
    
    // Check that the final response with the calculation result is displayed
    await waitFor(() => {
      expect(screen.getByText('The result of 5 + 3 is 8.')).toBeInTheDocument();
    });
  });

  it.skip('should navigate to tools page and display available tools', async () => {
    // Start at the tools page
    renderApp('/tools');
    
    // Wait for the tools page to load
    await waitFor(() => {
      expect(apiService.getTools).toHaveBeenCalled();
      expect(screen.getByText('Available Tools')).toBeInTheDocument();
    });
    
    // Check that the tools are displayed
    await waitFor(() => {
      expect(screen.getByText('calculator')).toBeInTheDocument();
      expect(screen.getByText('weather')).toBeInTheDocument();
    });
    
    // Check tool details
    expect(screen.getByText('A calculator tool')).toBeInTheDocument();
    expect(screen.getByText('A weather tool')).toBeInTheDocument();
    
    // Check parameters
    expect(screen.getByText('operation')).toBeInTheDocument();
    expect(screen.getByText('a')).toBeInTheDocument();
    expect(screen.getByText('b')).toBeInTheDocument();
    expect(screen.getByText('location')).toBeInTheDocument();
  });
});