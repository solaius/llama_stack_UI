import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { Agent, apiService } from '../services/api';

const AgentDetailsPage: React.FC = () => {
  const { agentId } = useParams<{ agentId: string }>();
  const navigate = useNavigate();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAgentDetails = async () => {
      try {
        setLoading(true);
        const agentData = await apiService.getAgent(agentId || '');
        setAgent(agentData);
      } catch (error) {
        console.error('Error fetching agent details:', error);
      } finally {
        setLoading(false);
      }
    };

    if (agentId) {
      fetchAgentDetails();
    }
  }, [agentId]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!agent) {
    return (
      <Box p={3}>
        <Typography variant="h5" color="error">
          Agent not found
        </Typography>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/agents')}
          sx={{ mt: 2 }}
        >
          Back to Agents
        </Button>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/agents')}
        variant="contained"
        sx={{ mb: 2 }}
      >
        Back to Agents
      </Button>
      
      <Typography variant="h4" gutterBottom>
        {agent.name || 'Unnamed Agent'}
      </Typography>
      
      <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          System Prompt
        </Typography>
        <Typography sx={{ whiteSpace: 'pre-wrap' }}>
          {agent.instructions}
        </Typography>
      </Paper>
      
      <Button
        variant="contained"
        color="primary"
        sx={{ mt: 2 }}
        onClick={() => {
          const sessionId = `session-${Date.now()}`;
          navigate(`/chat/${agent.agent_id || agent.id}/${sessionId}`);
        }}
      >
        Chat with Agent
      </Button>
    </Box>
  );
};

export default AgentDetailsPage;
// Updated with full functionality - v1
