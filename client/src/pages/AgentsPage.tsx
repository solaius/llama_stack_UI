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
      setAgents([
        {
          agent_id: 'meeting-minutes-agent',
          id: 'meeting-minutes-agent',
          model: 'meta-llama/Llama-3.1-8B-Instruct',
          instructions: 'You are a meeting minutes assistant. Help users create meeting minutes from notes or transcripts.',
          config: {
            model: 'meta-llama/Llama-3.1-8B-Instruct',
            instructions: 'You are a meeting minutes assistant. Help users create meeting minutes from notes or transcripts.',
            sampling_params: {
              temperature: 0.2,
              top_p: 0.95,
              max_tokens: 1000
            },
            toolgroups: ['summarization-tools'],
            max_infer_iters: 10,
            enable_session_persistence: false
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          agent_id: 'customer-support-agent',
          id: 'customer-support-agent',
          model: 'meta-llama/Llama-3.1-8B-Instruct',
          instructions: 'You are a customer support assistant. Help users with their questions and issues.',
          config: {
            model: 'meta-llama/Llama-3.1-8B-Instruct',
            instructions: 'You are a customer support assistant. Help users with their questions and issues.',
            sampling_params: {
              temperature: 0.7,
              top_p: 0.9,
              max_tokens: 500
            },
            toolgroups: ['knowledge-base-tools'],
            max_infer_iters: 5,
            enable_session_persistence: true
          },
          created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          updated_at: new Date(Date.now() - 86400000).toISOString()
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
    setCurrentAgent({
      ...agent,
      agent_id: newId,
      id: newId,
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

  const handleFormSubmit = async (values: AgentConfig) => {
    try {
      if (isEditing && currentAgent) {
        // Update existing agent
        const agentId = currentAgent.agent_id || currentAgent.id;
        const updatedAgent = await apiService.updateAgent(agentId, values);
        setNotification({
          open: true,
          message: `Agent "${updatedAgent.agent_id || updatedAgent.id}" updated successfully`,
          severity: 'success'
        });
      } else {
        // Create new agent
        const newAgent = await apiService.createAgent(values);
        setNotification({
          open: true,
          message: `Agent "${newAgent.agent_id || newAgent.id}" created successfully`,
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
        <Typography variant="h4" component="h1" gutterBottom>
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
            initialValues={currentAgent?.config}
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