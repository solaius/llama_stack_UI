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
  Alert,
  Tooltip,
  Collapse
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  Chat as ChatIcon,
  Build as BuildIcon,
  ContentCopy as ContentCopyIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import ToolUsageHistory from '../components/Agents/ToolUsageHistory';
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
  const [isLoadingToolHistory, setIsLoadingToolHistory] = useState(false);
  const [createSessionDialogOpen, setCreateSessionDialogOpen] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [systemPromptExpanded, setSystemPromptExpanded] = useState(false);
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  const handleCopyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setNotification({
          open: true,
          message: `${label} copied to clipboard`,
          severity: 'success'
        });
      },
      (err) => {
        console.error('Could not copy text: ', err);
        setNotification({
          open: true,
          message: 'Failed to copy to clipboard',
          severity: 'error'
        });
      }
    );
  };

  useEffect(() => {
    const fetchAgentDetails = async () => {
      if (!agentId) return;
      
      try {
        setLoading(true);
        const agentData = await apiService.getAgent(agentId);
        setAgent(agentData);
        
        // Initialize with empty sessions array
        // When the API supports listing sessions, we can fetch them here
        setSessions([]);
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
      
      // Create a session using the API
      const sessionId = await apiService.createAgentSession(agentId, newSessionName.trim());
      
      setNotification({
        open: true,
        message: 'Starting new chat session...',
        severity: 'info'
      });
      
      setCreateSessionDialogOpen(false);
      setNewSessionName('');
      
      // Navigate to the chat page with the new session
      navigate(`/chat/${agentId}/${sessionId}`);
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
      // When the API supports session deletion, we can implement it here
      // For now, just show a message that this feature is not yet available
      setNotification({
        open: true,
        message: 'Session management is not yet available in the API',
        severity: 'info'
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
    <Box p={3} sx={{ position: 'relative' }}>
      {/* Back button - positioned at the top left, flush with menu */}
      <Box sx={{ position: 'absolute', top: 0, left: -24, mb: 2 }}>
        <Button
          startIcon={<ArrowBackIcon sx={{ fontWeight: 'bold' }} />}
          onClick={() => navigate('/agents')}
          variant="contained"
          color="primary"
          sx={{ 
            borderRadius: '0 8px 8px 0',
            py: 1,
            px: 2,
            boxShadow: 2,
            fontWeight: 'bold',
            '&:hover': {
              transform: 'translateX(4px)',
              boxShadow: 3
            }
          }}
        >
          Back
        </Button>
      </Box>
      
      <Box mb={3} mt={5} sx={{ position: 'relative' }}>
        <Typography 
          variant="h4" 
          component="h1" 
          sx={{ 
            color: (theme) => theme.palette.mode === 'dark' ? 'white' : 'text.primary',
            textAlign: 'left'
          }}
        >
          Agent Details
        </Typography>
        
        {/* Chat button positioned absolutely on the right */}
        <Box sx={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)' }}>
          <Button
            variant="contained"
            color="success"
            startIcon={<ChatIcon />}
            onClick={async () => {
              try {
                // Create a new session with a default name and navigate to chat
                const defaultSessionName = `Chat with ${agent.name || 'Agent'} - ${new Date().toLocaleString()}`;
                const sessionId = await apiService.createAgentSession(agent.agent_id || agent.id, defaultSessionName);
                navigate(`/chat/${agent.agent_id || agent.id}/${sessionId}`);
              } catch (error) {
                console.error('Error creating session:', error);
                setNotification({
                  open: true,
                  message: 'Failed to create session. Please try again.',
                  severity: 'error'
                });
              }
            }}
            sx={{ 
              borderRadius: 2,
              px: 3,
              py: 1,
              boxShadow: 2,
              transition: 'all 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 3
              }
            }}
          >
            Chat with Agent
          </Button>
        </Box>
      </Box>

      <Paper sx={{ mb: 3, borderRadius: 2, boxShadow: 2, overflow: 'hidden' }}>
        <Box 
          p={3} 
          sx={{ 
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.08)'
          }}
        >
          <Typography 
            variant="h4" 
            gutterBottom 
            fontWeight="bold"
            sx={{ 
              color: (theme) => theme.palette.mode === 'dark' ? 'white' : 'text.primary',
              textShadow: (theme) => theme.palette.mode === 'dark' ? '0 0 8px rgba(255, 255, 255, 0.3)' : '0 0 1px rgba(0, 0, 0, 0.3)',
              letterSpacing: '0.5px'
            }}
          >
            {agent.name || 'Unnamed Agent'}
          </Typography>
          <Box display="flex" gap={2} flexWrap="wrap" sx={{ 
            '& .MuiChip-root': { 
              height: '32px',
              '& .MuiChip-label': {
                fontSize: '0.875rem',
                padding: '0 12px'
              },
              '& .MuiChip-icon': {
                marginLeft: '8px',
                color: 'inherit'
              }
            } 
          }}>
            <Chip 
              icon={<ContentCopyIcon fontSize="small" />}
              label={`ID: ${agent.agent_id}`} 
              variant="outlined" 
              size="small"
              onClick={() => handleCopyToClipboard(agent.agent_id, "Agent ID")}
              sx={{ 
                fontWeight: 'medium',
                bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.85)' : undefined,
                color: (theme) => theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.87)' : undefined,
                cursor: 'pointer',
                '&:hover': {
                  boxShadow: 1,
                  '& .MuiChip-icon': {
                    color: 'primary.main'
                  }
                },
                '& .MuiChip-icon': {
                  fontSize: '0.75rem',
                  marginLeft: '4px'
                }
              }}
            />
            <Chip 
              icon={<ContentCopyIcon fontSize="small" />}
              label={`Model: ${agent.model}`} 
              variant="outlined" 
              color="primary"
              size="small"
              onClick={() => handleCopyToClipboard(agent.model, "Model name")}
              sx={{ 
                fontWeight: 'medium',
                bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.85)' : undefined,
                cursor: 'pointer',
                '&:hover': {
                  boxShadow: 1,
                  '& .MuiChip-icon': {
                    color: 'primary.dark'
                  }
                },
                '& .MuiChip-icon': {
                  fontSize: '0.75rem',
                  marginLeft: '4px'
                }
              }}
            />
            <Chip 
              icon={<ContentCopyIcon fontSize="small" />}
              label={`Created: ${new Date(agent.created_at).toLocaleString()}`} 
              variant="outlined" 
              size="small"
              onClick={() => handleCopyToClipboard(new Date(agent.created_at).toLocaleString(), "Creation date")}
              sx={{ 
                fontWeight: 'medium',
                bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.85)' : undefined,
                color: (theme) => theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.87)' : undefined,
                cursor: 'pointer',
                '&:hover': {
                  boxShadow: 1,
                  '& .MuiChip-icon': {
                    color: 'primary.main'
                  }
                },
                '& .MuiChip-icon': {
                  fontSize: '0.75rem',
                  marginLeft: '4px'
                }
              }}
            />
          </Box>
        </Box>

      </Paper>

      <Box sx={{ 
          borderBottom: 1, 
          borderColor: 'divider', 
          mb: 3,
          bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.05)',
          borderRadius: '4px 4px 0 0',
        }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="agent details tabs"
          sx={{
            '& .MuiTab-root': {
              fontWeight: 'bold',
              transition: 'all 0.2s',
              py: 1.5,
              '&:hover': {
                color: 'primary.main',
                opacity: 1,
                bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'
              }
            },
            '& .Mui-selected': {
              color: 'primary.main',
              fontWeight: 'bold',
              bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.8)'
            },
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0'
            }
          }}
        >
          <Tab label="Configuration" {...a11yProps(0)} />
          <Tab label="JSON" {...a11yProps(1)} />
          <Tab label="Sessions" {...a11yProps(2)} />
          <Tab 
            label="Tool Usage" 
            {...a11yProps(3)} 
            icon={<BuildIcon fontSize="small" />} 
            iconPosition="start" 
          />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Card 
          sx={{ 
            mb: 3, 
            borderRadius: 2, 
            boxShadow: 1,
            overflow: 'hidden'
          }}
        >
          <Box 
            display="flex" 
            alignItems="center" 
            justifyContent="space-between" 
            mb={1}
            sx={{
              bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.08)',
              p: 2,
              borderBottom: 1,
              borderColor: 'divider',
              cursor: 'pointer',
              '&:hover': {
                bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.1)',
              }
            }}
            onClick={() => setSystemPromptExpanded(!systemPromptExpanded)}
          >
            <Typography 
              variant="h6" 
              fontWeight="bold"
              sx={{ 
                color: (theme) => theme.palette.mode === 'dark' ? 'white' : 'text.primary',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              System Prompt
              <ExpandMoreIcon 
                sx={{ 
                  ml: 1, 
                  transform: systemPromptExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s'
                }} 
              />
            </Typography>
            <Box>
              <Tooltip title="Copy system prompt">
                <IconButton 
                  size="small" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopyToClipboard(agent.instructions, "System prompt");
                  }}
                  sx={{ 
                    '&:hover': { 
                      color: 'primary.main',
                      bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
                    }
                  }}
                >
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
          <Collapse in={systemPromptExpanded}>
            <Box p={3}>
              <Typography 
                sx={{ 
                  whiteSpace: 'pre-wrap', 
                  lineHeight: 1.6,
                  color: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)'
                }}
              >
                {agent.instructions}
              </Typography>
            </Box>
          </Collapse>
        </Card>
        
        <Card 
          sx={{ 
            mb: 3, 
            borderRadius: 2, 
            boxShadow: 1,
            overflow: 'hidden'
          }}
        >
          <Box 
            sx={{ 
              bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.08)',
              borderBottom: 1,
              borderColor: 'divider',
              py: 1.5,
              px: 3
            }}
          >
            <Typography 
              variant="h6" 
              fontWeight="bold"
              sx={{ color: (theme) => theme.palette.mode === 'dark' ? 'white' : 'text.primary' }}
            >
              Sampling Parameters
            </Typography>
          </Box>
          <CardContent sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Typography variant="subtitle2" fontWeight="bold" color="text.secondary">
                    Temperature
                  </Typography>
                  <Chip 
                    label={agent.config?.sampling_params?.temperature || 'Default'} 
                    variant="outlined" 
                    size="small"
                    sx={{ alignSelf: 'flex-start' }}
                  />
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Typography variant="subtitle2" fontWeight="bold" color="text.secondary">
                    Top P
                  </Typography>
                  <Chip 
                    label={agent.config?.sampling_params?.top_p || 'Default'} 
                    variant="outlined" 
                    size="small"
                    sx={{ alignSelf: 'flex-start' }}
                  />
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Typography variant="subtitle2" fontWeight="bold" color="text.secondary">
                    Max Tokens
                  </Typography>
                  <Chip 
                    label={agent.config?.sampling_params?.max_tokens || 'Default'} 
                    variant="outlined" 
                    size="small"
                    sx={{ alignSelf: 'flex-start' }}
                  />
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card 
          sx={{ 
            mb: 3, 
            borderRadius: 2, 
            boxShadow: 1,
            overflow: 'hidden'
          }}
        >
          <Box 
            sx={{ 
              bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.08)',
              borderBottom: 1,
              borderColor: 'divider',
              py: 1.5,
              px: 3
            }}
          >
            <Typography 
              variant="h6" 
              fontWeight="bold"
              sx={{ color: (theme) => theme.palette.mode === 'dark' ? 'white' : 'text.primary' }}
            >
              Tool Configuration
            </Typography>
          </Box>
          <CardContent sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Typography variant="subtitle2" fontWeight="bold" color="text.secondary">
                    Tool Choice
                  </Typography>
                  <Chip 
                    label={agent.config?.tool_config?.tool_choice || 'Default'} 
                    variant="outlined" 
                    size="small"
                    sx={{ alignSelf: 'flex-start' }}
                  />
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Typography variant="subtitle2" fontWeight="bold" color="text.secondary">
                    Tool Prompt Format
                  </Typography>
                  <Chip 
                    label={agent.config?.tool_config?.tool_prompt_format || 'Default'} 
                    variant="outlined" 
                    size="small"
                    sx={{ alignSelf: 'flex-start' }}
                  />
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" fontWeight="bold" color="text.secondary" gutterBottom>
                  Tool Groups
                </Typography>
                <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {agent.config?.toolgroups && agent.config.toolgroups.length > 0 ? (
                    agent.config.toolgroups.map((tg, index) => (
                      <Chip
                        key={index}
                        label={typeof tg === 'string' ? tg : tg.name}
                        variant="outlined"
                        size="small"
                        sx={{ fontWeight: 'medium' }}
                      />
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary" fontStyle="italic">
                      No tool groups assigned
                    </Typography>
                  )}
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card 
          sx={{ 
            borderRadius: 2, 
            boxShadow: 1,
            overflow: 'hidden'
          }}
        >
          <Box 
            sx={{ 
              bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.08)',
              borderBottom: 1,
              borderColor: 'divider',
              py: 1.5,
              px: 3
            }}
          >
            <Typography 
              variant="h6" 
              fontWeight="bold"
              sx={{ color: (theme) => theme.palette.mode === 'dark' ? 'white' : 'text.primary' }}
            >
              Advanced Settings
            </Typography>
          </Box>
          <CardContent sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Typography variant="subtitle2" fontWeight="bold" color="text.secondary">
                    Max Inference Iterations
                  </Typography>
                  <Chip 
                    label={agent.config?.max_infer_iters || 'Default'} 
                    variant="outlined" 
                    size="small"
                    sx={{ alignSelf: 'flex-start' }}
                  />
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Typography variant="subtitle2" fontWeight="bold" color="text.secondary">
                    Session Persistence
                  </Typography>
                  <Chip 
                    label={agent.config?.enable_session_persistence ? 'Enabled' : 'Disabled'} 
                    color={agent.config?.enable_session_persistence ? 'success' : 'default'}
                    variant="outlined" 
                    size="small"
                    sx={{ alignSelf: 'flex-start' }}
                  />
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Box p={3}>
          <Typography variant="h6" gutterBottom fontWeight="bold">
            Agent Configuration JSON
          </Typography>
          <Paper 
            variant="outlined" 
            sx={{ 
              p: 3, 
              bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.01)',
              borderRadius: 2,
              borderColor: 'divider',
              maxHeight: '600px',
              overflow: 'auto'
            }}
          >
            <pre style={{ 
              whiteSpace: 'pre-wrap', 
              wordBreak: 'break-word',
              margin: 0,
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              lineHeight: 1.5
            }}>
              {JSON.stringify(agent, null, 2)}
            </pre>
          </Paper>
          <Box display="flex" justifyContent="flex-end" mt={2}>
            <Button
              variant="outlined"
              startIcon={<ContentCopyIcon />}
              onClick={() => handleCopyToClipboard(JSON.stringify(agent, null, 2), "Agent JSON")}
            >
              Copy JSON
            </Button>
          </Box>
        </Box>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography 
            variant="h6" 
            fontWeight="bold"
            sx={{ color: (theme) => theme.palette.mode === 'dark' ? 'white' : 'text.primary' }}
          >
            Sessions
          </Typography>
          <Box display="flex" gap={1}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              sx={{ 
                borderRadius: 2,
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'rotate(180deg)',
                  boxShadow: 1
                }
              }}
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
              sx={{ 
                borderRadius: 2,
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 2
                }
              }}
            >
              New Session
            </Button>
            <Button
              variant="contained"
              color="success"
              startIcon={<ChatIcon />}
              onClick={async () => {
                try {
                  // Create a new session with a default name and navigate to chat
                  const defaultSessionName = `Quick Chat - ${new Date().toLocaleString()}`;
                  const sessionId = await apiService.createAgentSession(agent.agent_id || agent.id, defaultSessionName);
                  navigate(`/chat/${agent.agent_id || agent.id}/${sessionId}`);
                } catch (error) {
                  console.error('Error creating session:', error);
                  setNotification({
                    open: true,
                    message: 'Failed to create session. Please try again.',
                    severity: 'error'
                  });
                }
              }}
              sx={{ 
                borderRadius: 2,
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 2
                }
              }}
            >
              New Chat
            </Button>
          </Box>
        </Box>

        {sessions.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              Session management is not yet available in the API.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              You can start a new chat session with this agent using the button below.
            </Typography>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 2 }}>
              <Button
                variant="contained"
                color="success"
                startIcon={<ChatIcon />}
                onClick={async () => {
                  try {
                    // Create a new session with a default name and navigate to chat
                    const defaultSessionName = `Start Chat - ${new Date().toLocaleString()}`;
                    const sessionId = await apiService.createAgentSession(agent.agent_id || agent.id, defaultSessionName);
                    navigate(`/chat/${agent.agent_id || agent.id}/${sessionId}`);
                  } catch (error) {
                    console.error('Error creating session:', error);
                    setNotification({
                      open: true,
                      message: 'Failed to create session. Please try again.',
                      severity: 'error'
                    });
                  }
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

      <TabPanel value={tabValue} index={3}>
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography 
              variant="h6" 
              fontWeight="bold"
              sx={{ color: (theme) => theme.palette.mode === 'dark' ? 'white' : 'text.primary' }}
            >
              Tool Usage History
            </Typography>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              sx={{ 
                borderRadius: 2,
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'rotate(180deg)',
                  boxShadow: 1
                }
              }}
              onClick={() => {
                setIsLoadingToolHistory(true);
                // In a real implementation, you would refresh the tool usage history
                setTimeout(() => {
                  setIsLoadingToolHistory(false);
                  setNotification({
                    open: true,
                    message: 'Tool usage history refreshed',
                    severity: 'info'
                  });
                }, 1000);
              }}
            >
              Refresh
            </Button>
          </Box>
          
          <ToolUsageHistory 
            agentId={agent.agent_id || agent.id} 
            isLoading={isLoadingToolHistory} 
          />
        </Box>
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