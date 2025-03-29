import React from 'react';

// Mock the react-router-dom components
module.exports = {
  BrowserRouter: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="browser-router">{children}</div>
  ),
  Routes: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="routes">{children}</div>
  ),
  Route: ({ element }: { element: React.ReactNode }) => (
    <div data-testid="route">{element}</div>
  ),
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to} data-testid={`link-${to}`}>{children}</a>
  ),
  useLocation: () => ({ pathname: '/' }),
  useNavigate: () => jest.fn(),
  useParams: () => ({}),
};