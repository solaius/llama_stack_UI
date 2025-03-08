import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  Tabs,
  Tab,
  CircularProgress,
  Divider,
  Chip,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  Chat as ChatIcon
} from '@mui/icons-material';
import { Agent, SessionInfo, apiService } from '../services/api';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`agent-tabpanel-${index}`}
      aria-labelledby={`agent-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `agent-tab-${index}`,
    'aria-controls': `agent-tabpanel-${index}`
  };
}

const AgentDetailsPage: React.FC = () => {
  const { agentId } = useParams<{ agentId: string }>();
  const navigate = useNavigate();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [createSessionDialogOpen, setCreateSessionDialogOpen] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  useEffect(() => {
    const fetchAgentDetails = async () => {
      if (!agentId) return;
      
      try {
        setLoading(true);
        const agentData = await apiService.getAgent(agentId);
        setAgent(agentData);
        
        // For now, we'll use mock sessions since the API doesn't support listing sessions
        // In a real implementation, you would fetch sessions from the API
        const mockSessions: SessionInfo[] = [
          {
            session_id: 'session-1',
            session_name: 'Test Session 1',
            turns: [],
            started_at: new Date().toISOString()
          },
          {
            session_id: 'session-2',
            session_name: 'Test Session 2',
            turns: [],
            started_at: new Date(Date.now() - 86400000).toISOString() // 1 day ago
          }
        ];
        
        setSessions(mockSessions);
      } catch (error) {
        console.error('Error fetching agent details:', error);
        setNotification({
          open: true,
          message: 'Failed to load agent details. Please try again.',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAgentDetails();
  }, [agentId]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleCreateSession = async () => {
    if (!agentId || !newSessionName.trim()) return;
    
    try {
      setIsCreatingSession(true);
      
      // In a real implementation, you would call the API to create a session
      // const sessionId = await apiService.createAgentSession(agentId, newSessionName);
      
      // For now, we'll create a mock session
      const newSession: SessionInfo = {
        session_id: `session-${Date.now()}`,
        session_name: newSessionName,
        turns: [],
        started_at: new Date().toISOString()
      };
      
      setSessions([newSession, ...sessions]);
      
      setNotification({
        open: true,
        message: 'Session created successfully',
        severity: 'success'
      });
      
      setCreateSessionDialogOpen(false);
      setNewSessionName('');
    } catch (error) {
      console.error('Error creating session:', error);
      setNotification({
        open: true,
        message: 'Failed to create session. Please try again.',
        severity: 'error'
      });
    } finally {
      setIsCreatingSession(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!agentId) return;
    
    try {
      // In a real implementation, you would call the API to delete the session
      // await apiService.deleteAgentSession(agentId, sessionId);
      
      // For now, we'll just remove it from the local state
      setSessions(sessions.filter(session => session.session_id !== sessionId));
      
      setNotification({
        open: true,
        message: 'Session deleted successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error deleting session:', error);
      setNotification({
        open: true,
        message: 'Failed to delete session. Please try again.',
        severity: 'error'
      });
    }
  };

  const handleOpenChat = (sessionId: string) => {
    navigate(`/chat/${agentId}/${sessionId}`);
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

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
      <Box display="flex" alignItems="center" mb={3}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/agents')}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
          Agent Details
        </Typography>
        <Button
          variant="contained"
          color="success"
          startIcon={<ChatIcon />}
          onClick={() => {
            // Create a new session and navigate to chat
            const sessionId = `session-${Date.now()}`;
            navigate(`/chat/${agent.agent_id || agent.id}/${sessionId}`);
          }}
          sx={{ ml: 2 }}
        >
          Chat with Agent
        </Button>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Box p={3}>
          <Typography variant="h5" gutterBottom>
            {agent.agent_id}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1">
                <strong>Model:</strong> {agent.model}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1">
                <strong>Created:</strong> {new Date(agent.created_at).toLocaleString()}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1">
                <strong>Instructions:</strong>
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, mt: 1, bgcolor: 'background.default' }}>
                <Typography sx={{ whiteSpace: 'pre-wrap' }}>{agent.instructions}</Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="agent details tabs">
          <Tab label="Configuration" {...a11yProps(0)} />
          <Tab label="Sessions" {...a11yProps(1)} />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Sampling Parameters
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Typography>
                  <strong>Temperature:</strong> {agent.config?.sampling_params?.temperature || 'Default'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography>
                  <strong>Top P:</strong> {agent.config?.sampling_params?.top_p || 'Default'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography>
                  <strong>Max Tokens:</strong> {agent.config?.sampling_params?.max_tokens || 'Default'}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Tool Configuration
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography>
                  <strong>Tool Choice:</strong> {agent.config?.tool_config?.tool_choice || 'Default'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography>
                  <strong>Tool Prompt Format:</strong> {agent.config?.tool_config?.tool_prompt_format || 'Default'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography>
                  <strong>Tool Groups:</strong>
                </Typography>
                <Box sx={{ mt: 1 }}>
                  {agent.config?.toolgroups && agent.config.toolgroups.length > 0 ? (
                    agent.config.toolgroups.map((tg, index) => (
                      <Chip
                        key={index}
                        label={typeof tg === 'string' ? tg : tg.name}
                        sx={{ mr: 1, mb: 1 }}
                      />
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No tool groups assigned
                    </Typography>
                  )}
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Advanced Settings
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography>
                  <strong>Max Inference Iterations:</strong> {agent.config?.max_infer_iters || 'Default'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography>
                  <strong>Session Persistence:</strong>{' '}
                  {agent.config?.enable_session_persistence ? 'Enabled' : 'Disabled'}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Sessions</Typography>
          <Box>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              sx={{ mr: 1 }}
              onClick={() => {
                // In a real implementation, you would refresh the sessions list
                setNotification({
                  open: true,
                  message: 'Sessions refreshed',
                  severity: 'info'
                });
              }}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateSessionDialogOpen(true)}
              sx={{ mr: 1 }}
            >
              New Session
            </Button>
            <Button
              variant="contained"
              color="success"
              startIcon={<ChatIcon />}
              onClick={() => {
                // Create a new session and navigate to chat
                const sessionId = `session-${Date.now()}`;
                navigate(`/chat/${agent.agent_id || agent.id}/${sessionId}`);
              }}
            >
              New Chat
            </Button>
          </Box>
        </Box>

        {sessions.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              No sessions found for this agent.
            </Typography>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => setCreateSessionDialogOpen(true)}
              >
                Create a new session
              </Button>
              <Button
                variant="contained"
                color="success"
                startIcon={<ChatIcon />}
                onClick={() => {
                  // Create a new session and navigate to chat
                  const sessionId = `session-${Date.now()}`;
                  navigate(`/chat/${agent.agent_id || agent.id}/${sessionId}`);
                }}
              >
                Start chatting now
              </Button>
            </Box>
          </Paper>
        ) : (
          <List>
            {sessions.map((session) => (
              <Paper key={session.session_id} sx={{ mb: 2 }}>
                <ListItem
                  secondaryAction={
                    <Box>
                      <IconButton
                        edge="end"
                        aria-label="chat"
                        onClick={() => handleOpenChat(session.session_id)}
                        sx={{ mr: 1 }}
                      >
                        <ChatIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => handleDeleteSession(session.session_id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  }
                >
                  <ListItemText
                    primary={
                      <Typography variant="h6">{session.session_name}</Typography>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" color="text.secondary">
                          Session ID: {session.session_id}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Created: {new Date(session.started_at).toLocaleString()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Turns: {session.turns?.length || 0}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              </Paper>
            ))}
          </List>
        )}
      </TabPanel>

      {/* Create Session Dialog */}
      <Dialog open={createSessionDialogOpen} onClose={() => !isCreatingSession && setCreateSessionDialogOpen(false)}>
        <DialogTitle>Create New Session</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="session-name"
            label="Session Name"
            type="text"
            fullWidth
            variant="outlined"
            value={newSessionName}
            onChange={(e) => setNewSessionName(e.target.value)}
            disabled={isCreatingSession}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateSessionDialogOpen(false)} disabled={isCreatingSession}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateSession}
            variant="contained"
            disabled={!newSessionName.trim() || isCreatingSession}
          >
            {isCreatingSession ? <CircularProgress size={24} /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification Snackbar */}
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
  );
};

export default AgentDetailsPage;