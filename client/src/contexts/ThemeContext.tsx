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
          fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        },
        components: {
          MuiAppBar: {
            styleOverrides: {
              root: {
                boxShadow: 'none',
                borderBottom: `1px solid ${mode === 'light' ? '#e0e0e0' : '#383838'}`, // gray-20 for light, gray-70 for dark
                backgroundColor: '#ee0000', // Red Hat red (red-50) as requested
                color: '#ffffff', // white text for better contrast
              },
            },
          },
          MuiDrawer: {
            styleOverrides: {
              paper: {
                backgroundColor: mode === 'light' ? '#e0e0e0' : '#151515', // gray-20 for light, gray-95 for dark as requested
              },
            },
          },
          MuiListItemButton: {
            styleOverrides: {
              root: {
                color: mode === 'light' ? '#151515' : '#ffffff', // dark text for light theme, white text for dark theme
                '&.Mui-selected': {
                  backgroundColor: '#ee0000', // Red Hat red (red-50) as requested
                  color: '#ffffff', // white text for better contrast on red background
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
              },
            },
          },
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: '4px',
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