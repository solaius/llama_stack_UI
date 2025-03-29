import React from 'react';
import { render, screen } from '@testing-library/react';
import ChatMessage from './ChatMessage';
import { Message } from '../../services/api';
import { ThemeProvider } from '../../contexts/ThemeContext';

// Mock SyntaxHighlighter to avoid ESM issues
jest.mock('react-syntax-highlighter', () => {
  return {
    __esModule: true,
    default: ({ children, ...props }: any) => (
      <div data-testid="syntax-highlighter" {...props}>{children}</div>
    ),
  };
});

// Mock styles
jest.mock('react-syntax-highlighter/dist/esm/styles/hljs', () => ({
  docco: {},
  dark: {},
}));

describe('ChatMessage Component', () => {
  it('renders a user message correctly', () => {
    const message: Message = {
      role: 'user',
      content: 'Hello, how are you?',
    };

    render(
      <ThemeProvider>
        <ChatMessage message={message} />
      </ThemeProvider>
    );

    expect(screen.getByTestId('message-role')).toHaveTextContent('user');
    expect(screen.getByTestId('message-content')).toHaveTextContent('Hello, how are you?');
  });

  it('renders an assistant message correctly', () => {
    const message: Message = {
      role: 'assistant',
      content: 'I am doing well, thank you for asking!',
    };

    render(
      <ThemeProvider>
        <ChatMessage message={message} />
      </ThemeProvider>
    );

    expect(screen.getByTestId('message-role')).toHaveTextContent('assistant');
    expect(screen.getByTestId('message-content')).toHaveTextContent('I am doing well, thank you for asking!');
  });

  it('renders a message with tool calls correctly', () => {
    const message: Message = {
      role: 'assistant',
      content: 'I will calculate that for you.',
      tool_calls: [
        {
          id: 'call_123',
          type: 'function',
          function: {
            name: 'calculator',
            arguments: JSON.stringify({
              operation: 'add',
              a: 5,
              b: 3
            })
          }
        }
      ]
    };

    render(
      <ThemeProvider>
        <ChatMessage message={message} />
      </ThemeProvider>
    );

    expect(screen.getByTestId('message-role')).toHaveTextContent('assistant');
    expect(screen.getByTestId('message-content')).toHaveTextContent('I will calculate that for you.');
    const syntaxHighlighter = screen.getByTestId('syntax-highlighter');
    expect(syntaxHighlighter).toBeInTheDocument();
  });

  it('renders a message with code blocks correctly', () => {
    const message: Message = {
      role: 'assistant',
      content: 'Here is a code example:\n```javascript\nconst x = 10;\nconsole.log(x);\n```',
    };

    render(
      <ThemeProvider>
        <ChatMessage message={message} />
      </ThemeProvider>
    );

    expect(screen.getByTestId('message-role')).toHaveTextContent('assistant');
    expect(screen.getByTestId('syntax-highlighter')).toBeInTheDocument();
  });
});