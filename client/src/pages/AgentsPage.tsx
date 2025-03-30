import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  Alert,
  Snackbar,
  Dialog,
  useTheme
} from '@mui/material';
import AgentList from '../components/Agents/AgentList';
import AgentForm from '../components/Agents/AgentForm';
import DeleteAgentModal from '../components/Agents/DeleteAgentModal';
import { Agent, AgentConfig, apiService } from '../services/api';

const AgentsPage: React.FC = () => {
  const theme = useTheme();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentAgent, setCurrentAgent] = useState<Agent | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const data = await apiService.getAgents();
      setAgents(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching agents:', err);
      setError('Failed to load agents. Please try again later.');
      // For demo purposes, create some mock agents if the API fails
      // We'll use a simpler mock data structure now that we have a real API
      setAgents([
        {
          agent_id: 'meeting-minutes-agent',
          id: 'meeting-minutes-agent',
          name: 'Meeting Minutes Assistant',
          model: 'meta-llama/Llama-3.2-3B-Instruct',
          instructions: 'You are a meeting minutes assistant. Help users create meeting minutes from notes or transcripts.',
          config: {
            model: 'meta-llama/Llama-3.2-3B-Instruct',
            instructions: 'You are a meeting minutes assistant. Help users create meeting minutes from notes or transcripts.',
            sampling_params: {
              strategy: { type: "greedy" },
              max_tokens: 1024,
              repetition_penalty: 1.0
            },
            max_infer_iters: 10,
            enable_session_persistence: false,
            name: 'Meeting Minutes Assistant'
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: 'Admin'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const handleCreateAgent = () => {
    setCurrentAgent(null);
    setIsEditing(false);
    setShowForm(true);
  };

  const handleEditAgent = (agent: Agent) => {
    setCurrentAgent(agent);
    setIsEditing(true);
    setShowForm(true);
  };

  const handleDuplicateAgent = (agent: Agent) => {
    const newId = `${agent.id || agent.agent_id}-copy`;
    const newName = agent.name ? `${agent.name} (Copy)` : `Copy of ${agent.id || agent.agent_id}`;
    
    setCurrentAgent({
      ...agent,
      agent_id: newId,
      id: newId,
      name: newName,
      config: {
        ...agent.config,
        name: newName
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    setIsEditing(false);
    setShowForm(true);
  };

  const handleDeleteClick = (agent: Agent) => {
    setCurrentAgent(agent);
    setShowDeleteModal(true);
  };

  const handleFormSubmit = async (values: AgentConfig & { name: string }) => {
    try {
      // Extract name from values and create a config object without name
      const { name, ...configValues } = values;
      
      if (isEditing && currentAgent) {
        // Update existing agent
        const agentId = currentAgent.agent_id || currentAgent.id;
        const updatedAgent = await apiService.updateAgent(agentId, {
          ...configValues,
          name: name // Include name in the update
        });
        setNotification({
          open: true,
          message: `Agent "${name}" updated successfully`,
          severity: 'success'
        });
      } else {
        // Create new agent
        const newAgent = await apiService.createAgent({
          ...configValues,
          name: name // Include name in the creation
        });
        setNotification({
          open: true,
          message: `Agent "${name}" created successfully`,
          severity: 'success'
        });
      }
      setShowForm(false);
      fetchAgents(); // Refresh the list
    } catch (err) {
      console.error('Error saving agent:', err);
      setNotification({
        open: true,
        message: `Failed to ${isEditing ? 'update' : 'create'} agent. Please try again.`,
        severity: 'error'
      });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!currentAgent) return;

    try {
      setIsDeleting(true);
      const agentId = currentAgent.agent_id || currentAgent.id;
      await apiService.deleteAgent(agentId);
      setNotification({
        open: true,
        message: `Agent "${agentId}" deleted successfully`,
        severity: 'success'
      });
      setShowDeleteModal(false);
      fetchAgents(); // Refresh the list
    } catch (err) {
      console.error('Error deleting agent:', err);
      setNotification({
        open: true,
        message: 'Failed to delete agent. Please try again.',
        severity: 'error'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCloseNotification = () => {
    setNotification((prev) => ({ ...prev, open: false }));
  };

  return (
    <Container maxWidth="lg">
      <Box my={4}>
        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom
          sx={{ color: (theme) => theme.palette.mode === 'dark' ? 'white' : 'text.primary' }}
        >
          Agent Management
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Paper
          elevation={3}
          sx={{
            p: 3,
            backgroundColor: theme.palette.background.paper
          }}
        >
          <AgentList
            agents={agents}
            loading={loading}
            onEdit={handleEditAgent}
            onDelete={handleDeleteClick}
            onDuplicate={handleDuplicateAgent}
            onCreateNew={handleCreateAgent}
          />
        </Paper>

        <Dialog
          open={showForm}
          onClose={() => setShowForm(false)}
          maxWidth="md"
          fullWidth
        >
          <AgentForm
            initialValues={{
              ...currentAgent?.config,
              name: currentAgent?.name || currentAgent?.config?.name || ''
            }}
            onSubmit={handleFormSubmit}
            onCancel={() => setShowForm(false)}
            isEditing={isEditing}
          />
        </Dialog>

        <DeleteAgentModal
          open={showDeleteModal}
          agent={currentAgent}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteConfirm}
          isDeleting={isDeleting}
        />

        <Snackbar
          open={notification.open}
          autoHideDuration={6000}
          onClose={handleCloseNotification}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={handleCloseNotification}
            severity={notification.severity}
            variant="filled"
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
};

export default AgentsPage;