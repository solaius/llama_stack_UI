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
  CircularProgress
} from '@mui/material';
import { 
  Chat as ChatIcon, 
  Code as CodeIcon, 
  Storage as StorageIcon,
  Assessment as AssessmentIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import apiService from '../services/api';

const HomePage: React.FC = () => {
  const [version, setVersion] = useState<string>('');
  const [modelCount, setModelCount] = useState<number>(0);
  const [toolCount, setToolCount] = useState<number>(0);
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
      title: 'Tool Integration', 
      description: 'Explore and test available tools with the Llama models', 
      icon: <CodeIcon fontSize="large" color="secondary" />,
      link: '/tools'
    },
    { 
      title: 'Model Management', 
      description: 'View and manage available Llama models', 
      icon: <StorageIcon fontSize="large" color="info" />,
      link: '/models'
    },
    { 
      title: 'Evaluations', 
      description: 'Run and view evaluations on model performance', 
      icon: <AssessmentIcon fontSize="large" color="success" />,
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
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Paper elevation={2} sx={{ p: 3, borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <InfoIcon color="primary" sx={{ mr: 1.5, fontSize: '1.75rem' }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Llama Stack Version</Typography>
                  </Box>
                  <Typography variant="h4" sx={{ mt: 'auto', fontWeight: 'bold', color: 'primary.main' }}>
                    {version}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper elevation={2} sx={{ p: 3, borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <StorageIcon color="secondary" sx={{ mr: 1.5, fontSize: '1.75rem' }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Available Models</Typography>
                  </Box>
                  <Typography variant="h4" sx={{ mt: 'auto', fontWeight: 'bold', color: 'secondary.main' }}>
                    {modelCount}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper elevation={2} sx={{ p: 3, borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <CodeIcon color="info" sx={{ mr: 1.5, fontSize: '1.75rem' }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Available Tools</Typography>
                  </Box>
                  <Typography variant="h4" sx={{ mt: 'auto', fontWeight: 'bold', color: 'info.main' }}>
                    {toolCount}
                  </Typography>
                </Paper>
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
                                    index === 1 ? 'secondary.main' : 
                                    index === 2 ? 'info.main' : 'success.main',
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
        <List>
          <ListItem sx={{ py: 1.5 }}>
            <ListItemIcon>
              <ChatIcon color="primary" sx={{ fontSize: '1.75rem' }} />
            </ListItemIcon>
            <ListItemText 
              primary={<Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Start a conversation</Typography>} 
              secondary={<Typography variant="body2" sx={{ mt: 0.5 }}>Head to the Chat page to start interacting with Llama models</Typography>} 
            />
          </ListItem>
          <ListItem sx={{ py: 1.5 }}>
            <ListItemIcon>
              <CodeIcon color="secondary" sx={{ fontSize: '1.75rem' }} />
            </ListItemIcon>
            <ListItemText 
              primary={<Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Explore available tools</Typography>} 
              secondary={<Typography variant="body2" sx={{ mt: 0.5 }}>Check out the Tools page to see what tools are available for use</Typography>} 
            />
          </ListItem>
          <ListItem sx={{ py: 1.5 }}>
            <ListItemIcon>
              <StorageIcon color="info" sx={{ fontSize: '1.75rem' }} />
            </ListItemIcon>
            <ListItemText 
              primary={<Typography variant="subtitle1" sx={{ fontWeight: 600 }}>View available models</Typography>} 
              secondary={<Typography variant="body2" sx={{ mt: 0.5 }}>Visit the Models page to see what models are available</Typography>} 
            />
          </ListItem>
        </List>
      </Paper>
    </Box>
  );
};

export default HomePage;