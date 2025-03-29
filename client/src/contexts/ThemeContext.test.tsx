import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, useTheme } from './ThemeContext';

// Test component that uses the theme context
const TestComponent = () => {
  const { mode, toggleColorMode } = useTheme();
  
  return (
    <div>
      <div data-testid="theme-mode">{mode}</div>
      <button data-testid="toggle-button" onClick={toggleColorMode}>
        Toggle Theme
      </button>
    </div>
  );
};

describe('ThemeContext', () => {
  it('provides the default theme mode (light)', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    
    const themeModeElement = screen.getByTestId('theme-mode');
    expect(themeModeElement).toHaveTextContent('light');
  });
  
  it('toggles the theme mode when toggleColorMode is called', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    
    const themeModeElement = screen.getByTestId('theme-mode');
    const toggleButton = screen.getByTestId('toggle-button');
    
    // Initial mode should be light
    expect(themeModeElement).toHaveTextContent('light');
    
    // Click the toggle button to change to dark mode
    fireEvent.click(toggleButton);
    expect(themeModeElement).toHaveTextContent('dark');
    
    // Click again to change back to light mode
    fireEvent.click(toggleButton);
    expect(themeModeElement).toHaveTextContent('light');
  });
  
  it('provides the theme context to nested components', () => {
    const NestedComponent = () => {
      const { mode } = useTheme();
      return <div data-testid="nested-theme-mode">{mode}</div>;
    };
    
    const ParentComponent = () => (
      <div>
        <NestedComponent />
      </div>
    );
    
    render(
      <ThemeProvider>
        <ParentComponent />
      </ThemeProvider>
    );
    
    const nestedThemeModeElement = screen.getByTestId('nested-theme-mode');
    expect(nestedThemeModeElement).toHaveTextContent('light');
  });
});