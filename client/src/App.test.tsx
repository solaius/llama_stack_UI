import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

// The react-router-dom components are mocked in __mocks__/react-router-dom.tsx
jest.mock('react-router-dom');

// Mock the Layout component
jest.mock('./components/Layout', () => {
  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => <div data-testid="layout">{children}</div>
  };
});

// Mock the page components
jest.mock('./pages', () => ({
  HomePage: () => <div data-testid="home-page">Home Page</div>,
  ChatPage: () => <div data-testid="chat-page">Chat Page</div>,
  ModelsPage: () => <div data-testid="models-page">Models Page</div>,
  ToolsPage: () => <div data-testid="tools-page">Tools Page</div>,
  EvaluationsPage: () => <div data-testid="evaluations-page">Evaluations Page</div>,
  SettingsPage: () => <div data-testid="settings-page">Settings Page</div>,
  NotFoundPage: () => <div data-testid="not-found-page">Not Found Page</div>,
  AgentsPage: () => <div data-testid="agents-page">Agents Page</div>
}));

// Mock the AgentDetailsPage and AgentChatPage components
jest.mock('./pages/AgentDetailsPage', () => {
  return {
    __esModule: true,
    default: () => <div data-testid="agent-details-page">Agent Details Page</div>
  };
});

jest.mock('./pages/AgentChatPage', () => {
  return {
    __esModule: true,
    default: () => <div data-testid="agent-chat-page">Agent Chat Page</div>
  };
});

describe('App Component', () => {
  test('renders without crashing', () => {
    render(<App />);
    const layoutElement = screen.getByTestId('layout');
    expect(layoutElement).toBeInTheDocument();
  });

  test('contains the HomePage component', () => {
    render(<App />);
    const homePageElement = screen.getByTestId('home-page');
    expect(homePageElement).toBeInTheDocument();
  });
});
