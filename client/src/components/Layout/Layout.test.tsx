import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Layout from './Layout';
import { ThemeProvider } from '../../contexts/ThemeContext';

// The react-router-dom components are mocked in __mocks__/react-router-dom.tsx
jest.mock('react-router-dom');

// Mock the images
jest.mock('../../images/RHLS.svg', () => 'mocked-logo.svg');

// Mock the useMediaQuery hook
jest.mock('@mui/material', () => {
  const originalModule = jest.requireActual('@mui/material');
  return {
    ...originalModule,
    useMediaQuery: () => false // Desktop view by default
  };
});

describe('Layout Component', () => {
  const renderLayout = () => {
    return render(
      <ThemeProvider>
        <Layout>
          <div data-testid="child-content">Test Content</div>
        </Layout>
      </ThemeProvider>
    );
  };

  it('renders the logo and title', () => {
    renderLayout();
    
    const logos = screen.getAllByAltText('RHLS Logo');
    expect(logos[0]).toBeInTheDocument();
    expect(logos[0]).toHaveAttribute('src', 'mocked-logo.svg');
    
    const titles = screen.getAllByText('Llama Stack UI');
    expect(titles[0]).toBeInTheDocument();
  });

  it('renders all navigation items', () => {
    renderLayout();
    
    // Use getAllByText and check the first occurrence
    const homeLinks = screen.getAllByText('Home');
    const chatLinks = screen.getAllByText('Chat');
    const agentsLinks = screen.getAllByText('Agents');
    const toolsLinks = screen.getAllByText('Tools');
    const modelsLinks = screen.getAllByText('Models');
    const evaluationsLinks = screen.getAllByText('Evaluations');
    const settingsLinks = screen.getAllByText('Settings');
    
    expect(homeLinks[0]).toBeInTheDocument();
    expect(chatLinks[0]).toBeInTheDocument();
    expect(agentsLinks[0]).toBeInTheDocument();
    expect(toolsLinks[0]).toBeInTheDocument();
    expect(modelsLinks[0]).toBeInTheDocument();
    expect(evaluationsLinks[0]).toBeInTheDocument();
    expect(settingsLinks[0]).toBeInTheDocument();
  });

  it('renders the child content', () => {
    renderLayout();
    
    const childContent = screen.getByTestId('child-content');
    expect(childContent).toBeInTheDocument();
    expect(childContent).toHaveTextContent('Test Content');
  });

  it('toggles theme mode when the theme button is clicked', () => {
    renderLayout();
    
    // Find the theme toggle button by finding the button that contains the Brightness4Icon
    const themeToggleButton = screen.getAllByRole('button').find(button => 
      button.querySelector('[data-testid="Brightness4Icon"]')
    );
    expect(themeToggleButton).toBeDefined();
    
    // Click to toggle to dark mode
    if (themeToggleButton) {
      fireEvent.click(themeToggleButton);
    }
    
    // Now should show light mode icon
    const lightModeIcon = screen.getAllByRole('button').find(button => 
      button.querySelector('[data-testid="Brightness7Icon"]')
    );
    expect(lightModeIcon).toBeDefined();
  });
});