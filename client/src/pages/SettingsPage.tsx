import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Grid,
  FormControlLabel,
  Switch,
  TextField,
  Button,
  Divider,
  Alert,
  Snackbar,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Api as ApiIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useTheme } from '../contexts/ThemeContext';
import apiService from '../services/api';

const SettingsPage: React.FC = () => {
  const { mode, toggleColorMode } = useTheme();
  const [apiUrl, setApiUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [serverInfo, setServerInfo] = useState<any>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info',
  });

  useEffect(() => {
    // Load settings from localStorage
    const savedApiUrl = localStorage.getItem('apiUrl');
    if (savedApiUrl) {
      setApiUrl(savedApiUrl);
    }

    // Fetch server info
    fetchServerInfo();
  }, []);

  const fetchServerInfo = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching server info from:', apiService.getCurrentBaseUrl());
      
      // Get version and health in parallel
      const [version, health] = await Promise.allSettled([
        apiService.getVersion(),
        apiService.getHealth()
      ]);
      
      console.log('Version response:', version);
      console.log('Health response:', health);
      
      // Check if both requests failed
      if (version.status === 'rejected' && health.status === 'rejected') {
        console.error('Both version and health checks failed');
        setServerInfo(null);
        setSnackbar({
          open: true,
          message: 'Could not connect to the server. Please check your connection settings.',
          severity: 'error',
        });
        setIsLoading(false);
        return;
      }
      
      // Create server info object with available data
      const serverInfoData: any = {
        version: version.status === 'fulfilled' ? version.value.version : 'Unknown',
        health: health.status === 'fulfilled' ? health.value.status : 'Unknown',
        timestamp: health.status === 'fulfilled' && health.value.timestamp 
          ? health.value.timestamp 
          : new Date().toISOString(),
      };
      
      console.log('Server info data:', serverInfoData);
      setServerInfo(serverInfoData);
      
      // Show a notification if we got partial data
      if (version.status === 'rejected' || health.status === 'rejected') {
        setSnackbar({
          open: true,
          message: 'Partial server information retrieved. Some endpoints may be unavailable.',
          severity: 'warning',
        });
      } else {
        // Show success notification
        setSnackbar({
          open: true,
          message: 'Server connection successful!',
          severity: 'success',
        });
      }
    } catch (error) {
      console.error('Error fetching server info:', error);
      setServerInfo(null);
      setSnackbar({
        open: true,
        message: 'Error connecting to server. See console for details.',
        severity: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      // Save the API URL to localStorage
      localStorage.setItem('apiUrl', apiUrl);
      
      // Update axios baseURL directly
      apiService.updateBaseUrl(apiUrl);
      
      // Show success message
      setSnackbar({
        open: true,
        message: 'Settings saved successfully',
        severity: 'success',
      });
      
      // Fetch server info with the new URL
      await fetchServerInfo();
    } catch (error) {
      console.error('Error saving settings:', error);
      setSnackbar({
        open: true,
        message: 'Error saving settings',
        severity: 'error',
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box>
      <Paper elevation={0} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Settings
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Configure your Llama Stack UI preferences and connections.
        </Typography>
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SettingsIcon sx={{ mr: 1 }} />
                <Typography variant="h6">UI Settings</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={mode === 'dark'}
                    onChange={toggleColorMode}
                    icon={<LightModeIcon />}
                    checkedIcon={<DarkModeIcon />}
                  />
                }
                label={`Theme: ${mode === 'dark' ? 'Dark' : 'Light'} Mode`}
              />
            </CardContent>
          </Card>

          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ApiIcon sx={{ mr: 1 }} />
                <Typography variant="h6">API Connection</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              <TextField
                label="API URL"
                fullWidth
                margin="normal"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="http://localhost:8321"
                helperText="Leave empty to use the default API URL"
              />
              
              <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveSettings}
                >
                  Save Settings
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={() => window.location.reload()}
                >
                  Reload Page
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ApiIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Server Information</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : serverInfo ? (
                <>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Connected to: <strong>{apiService.getCurrentBaseUrl()}</strong>
                    </Typography>
                  </Box>
                  
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <ApiIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Llama Stack Version"
                        secondary={
                          <Typography 
                            component="span" 
                            variant="body2"
                            color={serverInfo.version === 'Unknown' ? 'error.main' : 'text.primary'}
                          >
                            {serverInfo.version}
                          </Typography>
                        }
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <ApiIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Server Health"
                        secondary={
                          <Typography 
                            component="span" 
                            variant="body2"
                            color={serverInfo.health === 'Unknown' ? 'error.main' : 
                                  serverInfo.health === 'OK' ? 'success.main' : 'warning.main'}
                          >
                            {serverInfo.health}
                          </Typography>
                        }
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <ApiIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Last Check"
                        secondary={new Date(serverInfo.timestamp).toLocaleString()}
                      />
                    </ListItem>
                  </List>
                </>
              ) : (
                <Alert severity="error">
                  Could not connect to the server. Please check your connection settings.
                </Alert>
              )}
              
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={fetchServerInfo}
                sx={{ mt: 2 }}
                disabled={isLoading}
              >
                Refresh Server Info
              </Button>
            </CardContent>
          </Card>

          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SettingsIcon sx={{ mr: 1 }} />
                <Typography variant="h6">About</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              <Typography variant="body2" paragraph>
                Llama Stack UI is a comprehensive interface for interacting with Llama Stack API endpoints.
                It provides a user-friendly way to use Llama models, tools, and other features.
              </Typography>
              
              <Typography variant="body2">
                Version: 1.0.0
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SettingsPage;