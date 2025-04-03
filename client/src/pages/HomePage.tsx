import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Card, 
  CardContent, 
  CardActionArea,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Tooltip
} from '@mui/material';
import { 
  Chat as ChatIcon, 
  Code as CodeIcon, 
  Storage as StorageIcon,
  Assessment as AssessmentIcon,
  Info as InfoIcon,
  Settings as SettingsIcon,
  SmartToy as AgentIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import apiService from '../services/api';

const HomePage: React.FC = () => {
  const [version, setVersion] = useState<string>('');
  const [modelCount, setModelCount] = useState<number>(0);
  const [toolCount, setToolCount] = useState<number>(0);
  const [agentCount, setAgentCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch version
        const versionData = await apiService.getVersion();
        setVersion(versionData.version);
        
        // Fetch models
        const modelsData = await apiService.getModels();
        setModelCount(modelsData.length);
        
        // Fetch tools
        const toolsData = await apiService.getTools();
        setToolCount(toolsData.length);
        
        // Fetch agents
        const agentsData = await apiService.getAgents();
        setAgentCount(agentsData.length);
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const features = [
    { 
      title: 'Chat Interface', 
      description: 'Interact with Llama models through a user-friendly chat interface', 
      icon: <ChatIcon fontSize="large" color="primary" />,
      link: '/chat'
    },
    { 
      title: 'Agent Creation', 
      description: 'Create and manage specialized agents for different tasks', 
      icon: <AgentIcon fontSize="large" color="success" />,
      link: '/agents'
    },
    { 
      title: 'Tool Integration', 
      description: 'Explore and test available tools with the Llama models', 
      icon: <CodeIcon fontSize="large" color="info" />,
      link: '/tools'
    },
    { 
      title: 'Evaluations', 
      description: 'Run and view evaluations on model performance', 
      icon: <AssessmentIcon fontSize="large" color="error" />,
      link: '/evaluations'
    }
  ];

  return (
    <Box>
      <Paper elevation={0} sx={{ p: 4, mb: 4, borderRadius: 2 }}>
        <Typography variant="h3" gutterBottom sx={{ fontWeight: 700 }}>
          Welcome to Llama Stack UI
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom sx={{ fontSize: '1.1rem', maxWidth: '800px' }}>
          A comprehensive interface for interacting with Llama Stack API endpoints
        </Typography>
        
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h5" gutterBottom sx={{ mb: 2, fontWeight: 600 }}>
              System Dashboard
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Tooltip title="Current version of Llama Stack" arrow placement="top">
                  <Paper 
                    component={Link}
                    to="/settings"
                    elevation={2}
                    sx={(theme) => ({ 
                      p: 3, 
                      borderRadius: 2, 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                      transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                      textDecoration: 'none',
                      cursor: 'pointer',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)'
                      },
                      ...(theme.palette.mode === 'light' 
                        ? {
                            border: '1px solid rgba(238, 0, 0, 0.2)',
                            background: 'linear-gradient(to bottom, #ffffff, #fce3e3)',
                            boxShadow: 'none'
                          } 
                        : {
                            border: '1px solid rgba(238, 0, 0, 0.2)',
                            background: 'linear-gradient(to bottom, #202020, #3a0000)',
                            boxShadow: 'none'
                          }
                      )
                    })}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        minWidth: '40px', 
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(238, 0, 0, 0.1)'
                      }}>
                        <InfoIcon color="primary" sx={{ fontSize: '1.75rem' }} />
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, ml: 1, display: 'flex', alignItems: 'center', mt: '3px', color: 'text.primary' }}>Stack Version</Typography>
                    </Box>
                    <Typography variant="h3" sx={{ mt: 'auto', fontWeight: 'bold', color: 'primary.main', textAlign: 'center' }}>
                      {version}
                    </Typography>
                  </Paper>
                </Tooltip>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Tooltip title="Number of configured agents in the system" arrow placement="top">
                  <Paper 
                    component={Link}
                    to="/agents"
                    elevation={2}
                    sx={(theme) => ({ 
                      p: 3, 
                      borderRadius: 2, 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                      transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                      textDecoration: 'none',
                      cursor: 'pointer',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)'
                      },
                      ...(theme.palette.mode === 'light' 
                        ? {
                            border: '1px solid rgba(99, 153, 61, 0.2)',
                            background: 'linear-gradient(to bottom, #ffffff, #e8f5e0)',
                            boxShadow: 'none'
                          } 
                        : {
                            border: '1px solid rgba(99, 153, 61, 0.2)',
                            background: 'linear-gradient(to bottom, #202020, #1e3a0e)',
                            boxShadow: 'none'
                          }
                      )
                    })}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        minWidth: '40px', 
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(99, 153, 61, 0.1)'
                      }}>
                        <AgentIcon color="success" sx={{ fontSize: '1.75rem' }} />
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, ml: 1, display: 'flex', alignItems: 'center', mt: '3px', color: 'text.primary' }}>Agents</Typography>
                    </Box>
                    <Typography variant="h3" sx={{ mt: 'auto', fontWeight: 'bold', color: 'success.main', textAlign: 'center' }}>
                      {agentCount}
                    </Typography>
                  </Paper>
                </Tooltip>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Tooltip title="Number of available tools for model integration" arrow placement="top">
                  <Paper 
                    component={Link}
                    to="/tools"
                    elevation={2}
                    sx={(theme) => ({ 
                      p: 3, 
                      borderRadius: 2, 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                      transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                      textDecoration: 'none',
                      cursor: 'pointer',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)'
                      },
                      ...(theme.palette.mode === 'light' 
                        ? {
                            border: '1px solid rgba(55, 163, 163, 0.2)',
                            background: 'linear-gradient(to bottom, #ffffff, #daf2f2)',
                            boxShadow: 'none'
                          } 
                        : {
                            border: '1px solid rgba(55, 163, 163, 0.2)',
                            background: 'linear-gradient(to bottom, #202020, #003636)',
                            boxShadow: 'none'
                          }
                      )
                    })}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        minWidth: '40px', 
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(55, 163, 163, 0.1)'
                      }}>
                        <CodeIcon color="info" sx={{ fontSize: '1.75rem' }} />
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, ml: 1, display: 'flex', alignItems: 'center', mt: '3px', color: 'text.primary' }}>Tools</Typography>
                    </Box>
                    <Typography variant="h3" sx={{ mt: 'auto', fontWeight: 'bold', color: 'info.main', textAlign: 'center' }}>
                      {toolCount}
                    </Typography>
                  </Paper>
                </Tooltip>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Tooltip title="Number of available models in the system" arrow placement="top">
                  <Paper 
                    component={Link}
                    to="/models"
                    elevation={2}
                    sx={(theme) => ({ 
                      p: 3, 
                      borderRadius: 2, 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                      transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                      textDecoration: 'none',
                      cursor: 'pointer',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)'
                      },
                      ...(theme.palette.mode === 'light' 
                        ? {
                            border: '1px solid rgba(0, 102, 204, 0.2)',
                            background: 'linear-gradient(to bottom, #ffffff, #e0f0ff)',
                            boxShadow: 'none'
                          } 
                        : {
                            border: '1px solid rgba(0, 102, 204, 0.2)',
                            background: 'linear-gradient(to bottom, #202020, #002952)',
                            boxShadow: 'none'
                          }
                      )
                    })}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        minWidth: '40px', 
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(0, 102, 204, 0.1)'
                      }}>
                        <StorageIcon color="secondary" sx={{ fontSize: '1.75rem' }} />
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, ml: 1, display: 'flex', alignItems: 'center', mt: '3px', color: 'text.primary' }}>Models</Typography>
                    </Box>
                    <Typography variant="h3" sx={{ mt: 'auto', fontWeight: 'bold', color: 'secondary.main', textAlign: 'center' }}>
                      {modelCount}
                    </Typography>
                  </Paper>
                </Tooltip>
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>

      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 600, mt: 5 }}>
        Features
      </Typography>
      
      <Grid container spacing={3}>
        {features.map((feature, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
              <CardActionArea 
                component={Link} 
                to={feature.link} 
                sx={{ 
                  height: '100%',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '4px',
                    backgroundColor: index === 0 ? 'primary.main' : 
                                    index === 1 ? 'success.main' : 
                                    index === 2 ? 'info.main' : 'secondary.main',
                    opacity: 0,
                    transition: 'opacity 0.3s ease-in-out',
                  },
                  '&:hover::before': {
                    opacity: 1,
                  }
                }}
              >
                <CardContent sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  textAlign: 'center',
                  p: 3
                }}>
                  <Box sx={{ mb: 3, transform: 'scale(1.2)' }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    {feature.description}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
      
      <Paper elevation={2} sx={{ p: 4, mt: 5, borderRadius: 2, backgroundColor: theme => theme.palette.mode === 'light' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(41, 41, 41, 0.9)' }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
          Getting Started
        </Typography>
        <Divider sx={{ mb: 3, borderColor: 'primary.main', borderWidth: '2px', width: '60px' }} />
        
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: theme => theme.palette.mode === 'light' ? 'success.main' : '#99cc66' }}>
              Quick Start Guide
            </Typography>
            <List>
              <ListItem 
                component={Link} 
                to="/chat" 
                sx={{ 
                  py: 1.5, 
                  borderRadius: 1,
                  transition: 'all 0.2s',
                  '&:hover': {
                    backgroundColor: theme => theme.palette.mode === 'light' 
                      ? 'rgba(238, 0, 0, 0.08)' 
                      : 'rgba(238, 0, 0, 0.15)',
                    transform: 'translateX(5px)'
                  }
                }}
              >
                <ListItemIcon>
                  <ChatIcon color="primary" sx={{ fontSize: '1.75rem' }} />
                </ListItemIcon>
                <ListItemText 
                  primary={<Typography variant="subtitle1" sx={{ fontWeight: 600, color: theme => theme.palette.mode === 'light' ? 'text.primary' : '#ffffff' }}>Start a conversation</Typography>} 
                  secondary={<Typography variant="body2" sx={{ mt: 0.5, color: theme => theme.palette.mode === 'light' ? 'text.secondary' : 'rgba(255, 255, 255, 0.7)' }}>Chat with available models to test quality and tools</Typography>} 
                />
              </ListItem>
              
              <ListItem 
                component={Link} 
                to="/agents" 
                sx={{ 
                  py: 1.5, 
                  borderRadius: 1,
                  transition: 'all 0.2s',
                  '&:hover': {
                    backgroundColor: theme => theme.palette.mode === 'light' 
                      ? 'rgba(99, 153, 61, 0.08)' 
                      : 'rgba(99, 153, 61, 0.15)',
                    transform: 'translateX(5px)'
                  }
                }}
              >
                <ListItemIcon>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    width: '1.75rem',
                    height: '1.75rem',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(99, 153, 61, 0.1)',
                  }}>
                    <AgentIcon color="success" sx={{ fontSize: '1.25rem' }} />
                  </Box>
                </ListItemIcon>
                <ListItemText 
                  primary={<Typography variant="subtitle1" sx={{ fontWeight: 600, color: theme => theme.palette.mode === 'light' ? 'text.primary' : '#ffffff' }}>Configure agents</Typography>} 
                  secondary={<Typography variant="body2" sx={{ mt: 0.5, color: theme => theme.palette.mode === 'light' ? 'text.secondary' : 'rgba(255, 255, 255, 0.7)' }}>Create and manage specialized agents for different tasks</Typography>} 
                />
              </ListItem>
              
              <ListItem 
                component={Link} 
                to="/models" 
                sx={{ 
                  py: 1.5, 
                  borderRadius: 1,
                  transition: 'all 0.2s',
                  '&:hover': {
                    backgroundColor: theme => theme.palette.mode === 'light' 
                      ? 'rgba(55, 163, 163, 0.08)' 
                      : 'rgba(55, 163, 163, 0.15)',
                    transform: 'translateX(5px)'
                  }
                }}
              >
                <ListItemIcon>
                  <StorageIcon color="info" sx={{ fontSize: '1.75rem' }} />
                </ListItemIcon>
                <ListItemText 
                  primary={<Typography variant="subtitle1" sx={{ fontWeight: 600, color: theme => theme.palette.mode === 'light' ? 'text.primary' : '#ffffff' }}>View available models</Typography>} 
                  secondary={<Typography variant="body2" sx={{ mt: 0.5, color: theme => theme.palette.mode === 'light' ? 'text.secondary' : 'rgba(255, 255, 255, 0.7)' }}>Browse the models available in your Llama Stack deployment</Typography>} 
                />
              </ListItem>
            </List>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: theme => theme.palette.mode === 'light' ? 'primary.main' : '#ee0000' }}>
              Advanced Features
            </Typography>
            <List>
              <ListItem 
                component={Link} 
                to="/agents" 
                sx={{ 
                  py: 1.5, 
                  borderRadius: 1,
                  transition: 'all 0.2s',
                  '&:hover': {
                    backgroundColor: theme => theme.palette.mode === 'light' 
                      ? 'rgba(99, 153, 61, 0.08)' 
                      : 'rgba(99, 153, 61, 0.15)',
                    transform: 'translateX(5px)'
                  }
                }}
              >
                <ListItemIcon>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    width: '1.75rem',
                    height: '1.75rem',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(99, 153, 61, 0.1)',
                  }}>
                    <AgentIcon color="success" sx={{ fontSize: '1.25rem' }} />
                  </Box>
                </ListItemIcon>
                <ListItemText 
                  primary={<Typography variant="subtitle1" sx={{ fontWeight: 600, color: theme => theme.palette.mode === 'light' ? 'text.primary' : '#ffffff' }}>Configure agents</Typography>} 
                  secondary={<Typography variant="body2" sx={{ mt: 0.5, color: theme => theme.palette.mode === 'light' ? 'text.secondary' : 'rgba(255, 255, 255, 0.7)' }}>Create and manage specialized agents for different tasks</Typography>} 
                />
              </ListItem>
              
              <ListItem 
                component={Link} 
                to="/evaluations" 
                sx={{ 
                  py: 1.5, 
                  borderRadius: 1,
                  transition: 'all 0.2s',
                  '&:hover': {
                    backgroundColor: theme => theme.palette.mode === 'light' 
                      ? 'rgba(240, 86, 29, 0.08)' 
                      : 'rgba(240, 86, 29, 0.15)',
                    transform: 'translateX(5px)'
                  }
                }}
              >
                <ListItemIcon>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    width: '1.75rem',
                    height: '1.75rem',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(240, 86, 29, 0.1)',
                  }}>
                    <AssessmentIcon color="error" sx={{ fontSize: '1.25rem' }} />
                  </Box>
                </ListItemIcon>
                <ListItemText 
                  primary={<Typography variant="subtitle1" sx={{ fontWeight: 600, color: theme => theme.palette.mode === 'light' ? 'text.primary' : '#ffffff' }}>Run evaluations</Typography>} 
                  secondary={<Typography variant="body2" sx={{ mt: 0.5, color: theme => theme.palette.mode === 'light' ? 'text.secondary' : 'rgba(255, 255, 255, 0.7)' }}>Evaluate model performance on specific tasks and datasets</Typography>} 
                />
              </ListItem>
              
              <ListItem 
                component={Link} 
                to="/settings" 
                sx={{ 
                  py: 1.5, 
                  borderRadius: 1,
                  transition: 'all 0.2s',
                  '&:hover': {
                    backgroundColor: theme => theme.palette.mode === 'light' 
                      ? 'rgba(245, 146, 27, 0.08)' 
                      : 'rgba(245, 146, 27, 0.15)',
                    transform: 'translateX(5px)'
                  }
                }}
              >
                <ListItemIcon>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    width: '1.75rem',
                    height: '1.75rem',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(245, 146, 27, 0.1)',
                  }}>
                    <SettingsIcon color="warning" sx={{ fontSize: '1.25rem' }} />
                  </Box>
                </ListItemIcon>
                <ListItemText 
                  primary={<Typography variant="subtitle1" sx={{ fontWeight: 600, color: theme => theme.palette.mode === 'light' ? 'text.primary' : '#ffffff' }}>Configure settings</Typography>} 
                  secondary={<Typography variant="body2" sx={{ mt: 0.5, color: theme => theme.palette.mode === 'light' ? 'text.secondary' : 'rgba(255, 255, 255, 0.7)' }}>Customize your Llama Stack UI experience</Typography>} 
                />
              </ListItem>
            </List>
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="body2" sx={{ 
            fontStyle: 'italic',
            color: theme => theme.palette.mode === 'light' ? 'text.secondary' : 'rgba(255, 255, 255, 0.6)'
          }}>
            Tip: Use the theme toggle in the top-right corner to switch between light and dark modes.
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default HomePage;