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
      <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Typography variant="h4" gutterBottom>
          Welcome to Llama Stack UI
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
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
                <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <InfoIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Llama Stack Version</Typography>
                  </Box>
                  <Typography variant="h4" sx={{ mt: 2, fontWeight: 'bold' }}>
                    {version}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <StorageIcon color="secondary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Available Models</Typography>
                  </Box>
                  <Typography variant="h4" sx={{ mt: 2, fontWeight: 'bold' }}>
                    {modelCount}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CodeIcon color="info" sx={{ mr: 1 }} />
                    <Typography variant="h6">Available Tools</Typography>
                  </Box>
                  <Typography variant="h4" sx={{ mt: 2, fontWeight: 'bold' }}>
                    {toolCount}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>

      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        Features
      </Typography>
      
      <Grid container spacing={3}>
        {features.map((feature, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{ height: '100%' }}>
              <CardActionArea component={Link} to={feature.link} sx={{ height: '100%' }}>
                <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <Box sx={{ mb: 2 }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
      
      <Paper elevation={0} sx={{ p: 3, mt: 4, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          Getting Started
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <List>
          <ListItem>
            <ListItemIcon>
              <ChatIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="Start a conversation" 
              secondary="Head to the Chat page to start interacting with Llama models" 
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <CodeIcon color="secondary" />
            </ListItemIcon>
            <ListItemText 
              primary="Explore available tools" 
              secondary="Check out the Tools page to see what tools are available for use" 
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <StorageIcon color="info" />
            </ListItemIcon>
            <ListItemText 
              primary="View available models" 
              secondary="Visit the Models page to see what models are available" 
            />
          </ListItem>
        </List>
      </Paper>
    </Box>
  );
};

export default HomePage;