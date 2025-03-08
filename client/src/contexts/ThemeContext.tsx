import React, { createContext, useState, useContext, useMemo, ReactNode } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import { PaletteMode } from '@mui/material';

// Define the context type
type ThemeContextType = {
  mode: PaletteMode;
  toggleColorMode: () => void;
};

// Create the context with a default value
const ThemeContext = createContext<ThemeContextType>({
  mode: 'light',
  toggleColorMode: () => {},
});

// Custom hook to use the theme context
export const useTheme = () => useContext(ThemeContext);

// Theme provider component
export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<PaletteMode>('light');

  // Function to toggle between light and dark mode
  const toggleColorMode = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  // Create the theme based on the current mode using Red Hat colors
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: '#ee0000', // Red Hat red (red-50)
            light: '#f56e6e', // red-40
            dark: '#a60000', // red-60
          },
          secondary: {
            main: '#0066cc', // blue-50
            light: '#4394e5', // blue-40
            dark: '#004d99', // blue-60
          },
          error: {
            main: '#f0561d', // danger-50
            light: '#f4784a', // danger-40
            dark: '#b1380b', // danger-60
          },
          success: {
            main: '#63993d', // success-50
            light: '#87bb62', // success-40
            dark: '#3d7317', // success-60
          },
          warning: {
            main: '#f5921b', // orange-40
            light: '#f8ae54', // orange-30
            dark: '#ca6c0f', // orange-50
          },
          info: {
            main: '#37a3a3', // teal-50
            light: '#63bdbd', // teal-40
            dark: '#147878', // teal-60
          },
          background: {
            default: mode === 'light' ? '#f2f2f2' : '#151515', // gray-10 for light, gray-95 for dark
            paper: mode === 'light' ? '#ffffff' : '#292929', // white for light, gray-80 for dark
          },
          text: {
            primary: mode === 'light' ? '#151515' : '#ffffff', // gray-95 for light, white for dark
            secondary: mode === 'light' ? '#4d4d4d' : '#c7c7c7', // gray-60 for light, gray-30 for dark
          },
        },
        typography: {
          fontFamily: '"Red Hat Text", "Roboto", "Helvetica", "Arial", sans-serif',
          h1: {
            fontSize: '2.5rem',
            fontWeight: 700,
            lineHeight: 1.2,
            letterSpacing: '-0.01562em',
            marginBottom: '0.5em',
          },
          h2: {
            fontSize: '2rem',
            fontWeight: 700,
            lineHeight: 1.2,
            letterSpacing: '-0.00833em',
            marginBottom: '0.5em',
          },
          h3: {
            fontSize: '1.75rem',
            fontWeight: 600,
            lineHeight: 1.2,
            letterSpacing: '0em',
            marginBottom: '0.5em',
          },
          h4: {
            fontSize: '1.5rem',
            fontWeight: 600,
            lineHeight: 1.2,
            letterSpacing: '0.00735em',
            marginBottom: '0.5em',
          },
          h5: {
            fontSize: '1.25rem',
            fontWeight: 600,
            lineHeight: 1.2,
            letterSpacing: '0em',
            marginBottom: '0.5em',
          },
          h6: {
            fontSize: '1.125rem',
            fontWeight: 600,
            lineHeight: 1.2,
            letterSpacing: '0.0075em',
            marginBottom: '0.5em',
          },
          subtitle1: {
            fontSize: '1rem',
            fontWeight: 500,
            lineHeight: 1.5,
            letterSpacing: '0.00938em',
          },
          subtitle2: {
            fontSize: '0.875rem',
            fontWeight: 500,
            lineHeight: 1.5,
            letterSpacing: '0.00714em',
          },
          body1: {
            fontSize: '1rem',
            fontWeight: 400,
            lineHeight: 1.5,
            letterSpacing: '0.00938em',
          },
          body2: {
            fontSize: '0.875rem',
            fontWeight: 400,
            lineHeight: 1.5,
            letterSpacing: '0.01071em',
          },
          button: {
            fontSize: '0.875rem',
            fontWeight: 500,
            lineHeight: 1.75,
            letterSpacing: '0.02857em',
            textTransform: 'none',
          },
          caption: {
            fontSize: '0.75rem',
            fontWeight: 400,
            lineHeight: 1.66,
            letterSpacing: '0.03333em',
          },
          overline: {
            fontSize: '0.75rem',
            fontWeight: 400,
            lineHeight: 2.66,
            letterSpacing: '0.08333em',
            textTransform: 'uppercase',
          },
        },
        components: {
          MuiAppBar: {
            styleOverrides: {
              root: {
                boxShadow: 'none',
                borderBottom: `1px solid ${mode === 'light' ? '#e0e0e0' : '#383838'}`, // gray-20 for light, gray-70 for dark
                backgroundColor: '#ee0000', // Red Hat red (red-50) as requested
                color: '#ffffff', // white text for better contrast
                borderRadius: 0, // Remove rounded edges
              },
            },
          },
          MuiDrawer: {
            styleOverrides: {
              paper: {
                backgroundColor: mode === 'light' ? '#e0e0e0' : '#151515', // gray-20 for light, gray-95 for dark as requested
                borderRadius: 0, // Remove rounded edges
              },
            },
          },
          MuiListItemButton: {
            styleOverrides: {
              root: {
                color: mode === 'light' ? '#151515' : '#ffffff', // dark text for light theme, white text for dark theme
                fontWeight: 600, // Bold text for all menu items
                '&.Mui-selected': {
                  backgroundColor: '#ee0000', // Red Hat red (red-50) as requested
                  color: '#ffffff', // white text for better contrast on red background
                  fontWeight: 700, // Extra bold for selected menu item
                  '&:hover': {
                    backgroundColor: '#ee0000', // same color on hover
                  },
                },
                '&.Mui-selected .MuiListItemIcon-root': {
                  color: '#ffffff', // white icon for better contrast on red background
                },
                '&.Mui-selected .MuiListItemText-root': {
                  color: '#ffffff', // white text for better contrast on red background
                },
              },
            },
          },
          MuiListItemIcon: {
            styleOverrides: {
              root: {
                color: mode === 'light' ? '#151515' : '#ffffff', // dark icon for light theme, white icon for dark theme
              },
            },
          },
          MuiListItemText: {
            styleOverrides: {
              primary: {
                color: mode === 'light' ? '#151515' : '#ffffff', // dark text for light theme, white text for dark theme
                fontWeight: 'inherit', // Inherit the font weight from the parent
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: '8px',
                boxShadow: mode === 'light' 
                  ? '0 2px 8px rgba(0, 0, 0, 0.08)' 
                  : '0 2px 8px rgba(0, 0, 0, 0.3)',
                transition: 'all 0.3s ease-in-out',
                overflow: 'hidden',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: mode === 'light' 
                    ? '0 6px 12px rgba(0, 0, 0, 0.12)' 
                    : '0 6px 12px rgba(0, 0, 0, 0.5)',
                },
              },
            },
          },
          MuiCardContent: {
            styleOverrides: {
              root: {
                padding: '24px',
                '&:last-child': {
                  paddingBottom: '24px',
                },
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                borderRadius: '8px',
                boxShadow: mode === 'light' 
                  ? '0 2px 8px rgba(0, 0, 0, 0.05)' 
                  : '0 2px 8px rgba(0, 0, 0, 0.2)',
              },
              elevation1: {
                boxShadow: mode === 'light' 
                  ? '0 2px 4px rgba(0, 0, 0, 0.05)' 
                  : '0 2px 4px rgba(0, 0, 0, 0.2)',
              },
              elevation2: {
                boxShadow: mode === 'light' 
                  ? '0 3px 6px rgba(0, 0, 0, 0.08)' 
                  : '0 3px 6px rgba(0, 0, 0, 0.25)',
              },
              elevation3: {
                boxShadow: mode === 'light' 
                  ? '0 4px 8px rgba(0, 0, 0, 0.1)' 
                  : '0 4px 8px rgba(0, 0, 0, 0.3)',
              },
            },
          },
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: '4px',
                padding: '8px 16px',
                fontWeight: 500,
                textTransform: 'none',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: mode === 'light' 
                    ? '0 2px 4px rgba(0, 0, 0, 0.1)' 
                    : '0 2px 4px rgba(0, 0, 0, 0.3)',
                },
                '&:active': {
                  transform: 'translateY(0)',
                  boxShadow: 'none',
                },
              },
              contained: {
                boxShadow: mode === 'light' 
                  ? '0 1px 3px rgba(0, 0, 0, 0.1)' 
                  : '0 1px 3px rgba(0, 0, 0, 0.3)',
                '&:hover': {
                  boxShadow: mode === 'light' 
                    ? '0 3px 6px rgba(0, 0, 0, 0.15)' 
                    : '0 3px 6px rgba(0, 0, 0, 0.4)',
                },
              },
              containedPrimary: {
                backgroundColor: '#ee0000', // Red Hat red
                color: '#ffffff',
                '&:hover': {
                  backgroundColor: '#a60000', // darker red
                },
              },
              containedSecondary: {
                backgroundColor: '#0066cc', // Blue
                color: '#ffffff',
                '&:hover': {
                  backgroundColor: '#004d99', // darker blue
                },
              },
              outlined: {
                borderWidth: '1px',
                '&:hover': {
                  borderWidth: '1px',
                },
              },
              outlinedPrimary: {
                borderColor: '#ee0000', // Red Hat red
                color: '#ee0000',
                '&:hover': {
                  backgroundColor: 'rgba(238, 0, 0, 0.04)',
                  borderColor: '#a60000', // darker red
                },
              },
              text: {
                '&:hover': {
                  backgroundColor: mode === 'light' 
                    ? 'rgba(0, 0, 0, 0.04)' 
                    : 'rgba(255, 255, 255, 0.08)',
                },
              },
              textPrimary: {
                color: '#ee0000', // Red Hat red
                '&:hover': {
                  backgroundColor: 'rgba(238, 0, 0, 0.04)',
                },
              },
              sizeSmall: {
                padding: '4px 10px',
                fontSize: '0.8125rem',
              },
              sizeLarge: {
                padding: '10px 22px',
                fontSize: '0.9375rem',
              },
            },
          },
        },
      }),
    [mode]
  );

  // Context value
  const contextValue = useMemo(
    () => ({
      mode,
      toggleColorMode,
    }),
    [mode]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;