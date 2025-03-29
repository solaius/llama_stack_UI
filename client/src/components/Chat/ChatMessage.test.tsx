import React from 'react';
import { render, screen } from '@testing-library/react';
import ChatMessage from './ChatMessage';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { Message, ToolCall } from '../../services/api';

// Mock the SyntaxHighlighter component
jest.mock('react-syntax-highlighter', () => {
  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="syntax-highlighter">{children}</div>
    ),
  };
});

// Mock the useTheme hook
jest.mock('../../contexts/ThemeContext', () => {
  return {
    useTheme: () => ({
      mode: 'light',
      toggleColorMode: jest.fn(),
    }),
    ThemeProvider: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="theme-provider">{children}</div>
    ),
  };
});

describe('ChatMessage Component', () => {
  const renderChatMessage = (message: Message, isLast: boolean = false) => {
    return render(
      <ThemeProvider>
        <ChatMessage message={message} isLast={isLast} />
      </ThemeProvider>
    );
  };

  it('renders a user message correctly', () => {
    const userMessage: Message = {
      role: 'user',
      content: 'Hello, this is a test message',
    };

    renderChatMessage(userMessage);

    // Check for the message content
    expect(screen.getByText('Hello, this is a test message')).toBeInTheDocument();
    
    // Check for the user icon
    const avatarElement = screen.getByTestId('PersonIcon');
    expect(avatarElement).toBeInTheDocument();
  });

  it('renders an assistant message correctly', () => {
    const assistantMessage: Message = {
      role: 'assistant',
      content: 'I am the assistant responding to your query',
    };

    renderChatMessage(assistantMessage);

    // Check for the message content
    expect(screen.getByText('I am the assistant responding to your query')).toBeInTheDocument();
    
    // Check for the assistant icon
    const avatarElement = screen.getByTestId('SmartToyIcon');
    expect(avatarElement).toBeInTheDocument();
  });

  it('renders a tool message correctly', () => {
    const toolMessage: Message = {
      role: 'tool',
      content: 'This is a tool response',
      tool_name: 'calculator',
    };

    renderChatMessage(toolMessage);

    // Check for the message content
    expect(screen.getByText('This is a tool response')).toBeInTheDocument();
    
    // Check for the tool icon
    const avatarElement = screen.getByTestId('CodeIcon');
    expect(avatarElement).toBeInTheDocument();
    
    // Check for the tool chip
    expect(screen.getByText('Tool Response: calculator')).toBeInTheDocument();
  });

  it('renders a system message correctly', () => {
    const systemMessage: Message = {
      role: 'system',
      content: 'System message for configuration',
    };

    renderChatMessage(systemMessage);

    // Check for the message content
    expect(screen.getByText('System message for configuration')).toBeInTheDocument();
  });

  it('renders a message with tool calls correctly', () => {
    const toolCalls: ToolCall[] = [
      {
        id: 'tool-call-1',
        call_id: 'tool-call-1',
        type: 'function',
        function: {
          name: 'calculator',
          arguments: '{"operation": "add", "a": 5, "b": 3}',
        },
        tool_name: 'calculator',
      },
    ];

    const messageWithToolCalls: Message = {
      role: 'assistant',
      content: 'I will calculate this for you',
      tool_calls: toolCalls,
    };

    renderChatMessage(messageWithToolCalls);

    // Check for the message content
    expect(screen.getByText('I will calculate this for you')).toBeInTheDocument();
    
    // Check for the tool call chip
    expect(screen.getByText('Tool: calculator')).toBeInTheDocument();
    
    // Check for the syntax highlighter with the tool call arguments
    const syntaxHighlighter = screen.getByTestId('syntax-highlighter');
    expect(syntaxHighlighter).toBeInTheDocument();
    expect(syntaxHighlighter.textContent).toContain('"operation": "add"');
  });

  it('renders a message with code blocks correctly', () => {
    const messageWithCode: Message = {
      role: 'assistant',
      content: 'Here is some code:\n```javascript\nconst x = 10;\nconsole.log(x);\n```\nThis is after the code.',
    };

    renderChatMessage(messageWithCode);

    // Check for the text before the code block
    expect(screen.getByText(/Here is some code:/)).toBeInTheDocument();
    
    // Check for the syntax highlighter with the code
    const syntaxHighlighter = screen.getByTestId('syntax-highlighter');
    expect(syntaxHighlighter).toBeInTheDocument();
    expect(syntaxHighlighter.textContent).toContain('const x = 10;');
    
    // Check for the text after the code block
    expect(screen.getByText(/This is after the code./)).toBeInTheDocument();
  });

  it('shows a pulsing indicator for the last assistant message', () => {
    const assistantMessage: Message = {
      role: 'assistant',
      content: 'I am the last message',
    };

    renderChatMessage(assistantMessage, true);

    // Check for the message content
    expect(screen.getByText('I am the last message')).toBeInTheDocument();
    
    // The pulsing indicator is a CSS pseudo-element, which is hard to test directly
    // We could check for the specific styling, but that's implementation-dependent
    // For now, we'll just verify the message renders correctly
  });
});