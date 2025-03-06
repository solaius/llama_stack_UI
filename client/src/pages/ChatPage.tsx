import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import ChatInterface from '../components/Chat';

const ChatPage: React.FC = () => {
  return (
    <Box>
      <Paper elevation={0} sx={{ p: 2, mb: 2 }}>
        <Typography variant="h5" gutterBottom>
          Chat with Llama Models
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Interact with Llama models through a conversational interface. You can use various models and enable tools for enhanced capabilities.
        </Typography>
      </Paper>
      
      <ChatInterface />
    </Box>
  );
};

export default ChatPage;