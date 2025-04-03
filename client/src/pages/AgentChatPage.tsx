import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  CircularProgress,
  IconButton,
  Divider,
  Avatar,
  Card,
  CardContent,
  Snackbar,
  Alert,
  Tooltip,
  List,
  ListItem,
  FormControlLabel,
  Switch,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Collapse,
  useTheme
} from '@mui/material';
import {
  Send as SendIcon,
  ArrowBack as ArrowBackIcon,
  Refresh as RefreshIcon,
  AttachFile as AttachFileIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
  ExpandMore as ExpandMoreIcon,
  SmartToy as BotIcon,
  Person as PersonIcon,
  ContentCopy as ContentCopyIcon,
  NoteAdd as NoteAddIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
import { Agent, Message, TurnInfo, ToolCall, ToolResult, apiService } from '../services/api';
import ToolUsageDisplay from '../components/Chat/ToolUsageDisplay';
import ChatMessage from '../components/Chat/ChatMessage';
import { SSE } from 'sse.js';

const AgentChatPage: React.FC = () => {
  const { agentId, sessionId } = useParams<{ agentId: string; sessionId: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  
  // State variables
  const [agent, setAgent] = useState<Agent | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isStreaming, setIsStreaming] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const eventSourceRef = useRef<SSE | null>(null);
  
  // Fetch agent details and session history on component mount
  useEffect(() => {
    const fetchData = async () => {
      if (!agentId || !sessionId) return;
      
      try {
        setIsLoading(true);
        
        // Fetch agent details
        const agentData = await apiService.getAgent(agentId);
        setAgent(agentData);
        
        try {
          // Try to fetch session history
          const sessionData = await apiService.getAgentSession(agentId, sessionId);
          
          // Process session turns into messages
          if (sessionData && sessionData.turns) {
            const sessionMessages: Message[] = [];
            
            // Add system message if agent has instructions
            if (agentData.instructions) {
              sessionMessages.push({
                role: 'system',
                content: agentData.instructions
              });
            }
            
            // Process each turn
            sessionData.turns.forEach(turn => {
              // Add user messages
              turn.input_messages.forEach(msg => {
                if (msg.role === 'user') {
                  sessionMessages.push(msg);
                }
              });
              
              // Add assistant message
              if (turn.output_message) {
                sessionMessages.push(turn.output_message);
              }
            });
            
            setMessages(sessionMessages);
          } else {
            // If no turns, just add the system message
            if (agentData.instructions) {
              setMessages([{
                role: 'system',
                content: agentData.instructions
              }]);
            }
          }
        } catch (sessionError) {
          console.error('Error fetching session data:', sessionError);
          
          // If session fetch fails, just add the system message
          if (agentData.instructions) {
            setMessages([{
              role: 'system',
              content: agentData.instructions
            }]);
          }
          
          setNotification({
            open: true,
            message: 'Could not load chat history. Starting a new conversation.',
            severity: 'warning'
          });
        }
      } catch (error) {
        console.error('Error fetching agent data:', error);
        setNotification({
          open: true,
          message: 'Failed to load agent data. Please try again.',
          severity: 'error'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    
    // Cleanup function to close EventSource on unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [agentId, sessionId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!input.trim() || !agentId || !sessionId) return;
    
    const userMessage: Message = {
      role: 'user',
      content: input
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsSending(true);
    
    try {
      if (isStreaming) {
        // Handle streaming response
        await handleStreamingResponse(userMessage);
      } else {
        // Handle non-streaming response
        await handleNonStreamingResponse(userMessage);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setNotification({
        open: true,
        message: 'Failed to send message. Please try again.',
        severity: 'error'
      });
      setIsSending(false);
    }
  };

  // Handle streaming response
  const handleStreamingResponse = async (userMessage: Message) => {
    // Add a placeholder assistant message that will be updated with streaming content
    let assistantMessage: Message = { role: 'assistant', content: '' };
    setMessages(prev => [...prev, assistantMessage]);
    
    try {
      // Ensure agentId and sessionId are defined
      if (!agentId || !sessionId) {
        throw new Error('Agent ID or Session ID is undefined');
      }
      
      // Create a new EventSource for SSE
      const url = `${apiService.getCurrentBaseUrl()}/v1/agents/${agentId}/session/${sessionId}/turn?stream=true`;
      
      const eventSource = new SSE(url, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        payload: JSON.stringify({
          messages: [userMessage],
          stream: true
        })
      });
      
      eventSourceRef.current = eventSource;
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.event && data.event.event_type === 'progress') {
            // Update the assistant's message with new content
            if (data.event.delta && data.event.delta.text) {
              assistantMessage.content += data.event.delta.text;
              setMessages(prev => [...prev.slice(0, -1), { ...assistantMessage }]);
            }
          } else if (data.event && data.event.event_type === 'complete') {
            // Complete the message and add any tool calls
            if (data.completion_message?.tool_calls) {
              assistantMessage.tool_calls = data.completion_message.tool_calls;
            }
            
            if (data.event.stop_reason) {
              assistantMessage.stop_reason = data.event.stop_reason;
            }
            
            setMessages(prev => [...prev.slice(0, -1), { ...assistantMessage }]);
            setIsSending(false);
            eventSource.close();
            eventSourceRef.current = null;
          }
        } catch (error) {
          console.error('Error parsing SSE message:', error, event.data);
        }
      };
      
      eventSource.onerror = (error) => {
        console.error('EventSource error:', error);
        setIsSending(false);
        eventSource.close();
        eventSourceRef.current = null;
        
        // Add error notification
        setNotification({
          open: true,
          message: 'Connection error. Please try again.',
          severity: 'error'
        });
      };
      
      // Open the connection
      eventSource.stream();
      
    } catch (error) {
      console.error('Error setting up streaming:', error);
      setIsSending(false);
      
      // Update the placeholder message with an error
      assistantMessage.content = 'Sorry, there was an error processing your request.';
      setMessages(prev => [...prev.slice(0, -1), assistantMessage]);
      
      setNotification({
        open: true,
        message: 'Failed to connect to the server. Please try again.',
        severity: 'error'
      });
    }
  };

  // Handle non-streaming response
  const handleNonStreamingResponse = async (userMessage: Message) => {
    try {
      // Ensure agentId and sessionId are defined
      if (!agentId || !sessionId) {
        throw new Error('Agent ID or Session ID is undefined');
      }
      
      // Call the API to create a turn
      const turnResponse = await apiService.createAgentTurn(
        agentId,
        sessionId,
        [userMessage],
        false // non-streaming
      );
      
      // Add assistant message from the response
      if (turnResponse && turnResponse.output_message) {
        setMessages(prev => [...prev, turnResponse.output_message]);
      } else {
        // Fallback if no output message
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: 'I received your message, but there was an issue with the response.'
          }
        ]);
      }
    } catch (error) {
      console.error('Error in non-streaming response:', error);
      
      // Add error message
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, there was an error processing your request. Please try again.'
        }
      ]);
      
      setNotification({
        open: true,
        message: 'Failed to get a response. Please try again.',
        severity: 'error'
      });
    } finally {
      setIsSending(false);
    }
  };

  // Handle key press (Enter to send)
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    // In a real implementation, you would handle file uploads
    // For now, we'll just show a notification
    setNotification({
      open: true,
      message: `File "${files[0].name}" selected. File uploads are not implemented yet.`,
      severity: 'info'
    });
  };
  
  // Handle rerunning a tool
  const handleRerunTool = async (toolCall: ToolCall) => {
    // Ensure agentId and sessionId are defined
    if (!agentId || !sessionId) {
      setNotification({
        open: true,
        message: 'Cannot rerun tool: Agent ID or Session ID is missing',
        severity: 'error'
      });
      return;
    }
    
    setNotification({
      open: true,
      message: 'Rerunning tool...',
      severity: 'info'
    });
    
    try {
      // In a real implementation, you would call the API to rerun the tool
      // For now, we'll just show a notification
      setTimeout(() => {
        setNotification({
          open: true,
          message: 'Tool rerun functionality is not implemented yet.',
          severity: 'info'
        });
      }, 1000);
    } catch (error) {
      console.error('Error rerunning tool:', error);
      setNotification({
        open: true,
        message: 'Failed to rerun tool. Please try again.',
        severity: 'error'
      });
    }
  };
  
  // Handle clearing the chat
  const handleClearChat = () => {
    // Keep only the system message if it exists
    const systemMessage = messages.find(msg => msg.role === 'system');
    setMessages(systemMessage ? [systemMessage] : []);
  };
  
  // Close notification
  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  // Loading state
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Header */}
      <Paper 
        elevation={2} 
        sx={{ 
          borderRadius: 0,
          borderBottom: '1px solid',
          borderColor: 'divider',
          background: theme.palette.mode === 'dark' ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(8px)',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}
      >
        {/* Main Header */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          p: 1.5,
          px: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => navigate(`/agents/${agentId}`)}
              sx={{ mr: 2 }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="h6" noWrap sx={{ fontWeight: 500, display: 'flex', alignItems: 'center' }}>
                  {agent?.name || agent?.model || 'Agent Chat'}
                  <Tooltip 
                    title={agent?.instructions || "No system prompt provided"}
                    placement="bottom-start"
                    sx={{ maxWidth: 500, ml: 1.5 }}
                    componentsProps={{
                      tooltip: {
                        sx: {
                          bgcolor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                          color: theme.palette.mode === 'dark' ? 'white' : 'black',
                          boxShadow: '0px 2px 10px rgba(0,0,0,0.2)',
                          p: 2,
                          maxWidth: '400px',
                          fontSize: '0.8rem',
                          border: '1px solid',
                          borderColor: 'divider',
                          whiteSpace: 'pre-wrap'
                        }
                      }
                    }}
                  >
                    <Box 
                      sx={{ 
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'grey.200',
                        color: theme.palette.mode === 'dark' ? 'white' : 'inherit',
                        borderRadius: '50%',
                        width: 20,
                        height: 20,
                        transition: 'all 0.2s',
                        verticalAlign: 'middle',
                        ml: 1
                      }}
                    >
                      <DescriptionIcon fontSize="small" sx={{ fontSize: '0.9rem' }} />
                    </Box>
                  </Tooltip>
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                <Typography variant="caption" color="text.secondary" sx={{ mr: 2 }}>
                  <Box component="span" sx={{ opacity: 0.7, mr: 0.5 }}>ID:</Box> 
                  <Box component="span" sx={{ fontFamily: 'monospace', letterSpacing: '0.5px' }}>
                    {agentId?.substring(0, 8)}...
                  </Box>
                  <IconButton 
                    size="small" 
                    sx={{ ml: 0.5, opacity: 0.7 }}
                    onClick={() => {
                      if (agentId) {
                        navigator.clipboard.writeText(agentId);
                        setNotification({
                          open: true,
                          message: 'Agent ID copied to clipboard',
                          severity: 'success'
                        });
                      }
                    }}
                  >
                    <ContentCopyIcon fontSize="small" sx={{ fontSize: '0.8rem' }} />
                  </IconButton>
                </Typography>
                
                <Typography variant="caption" color="text.secondary">
                  <Box component="span" sx={{ opacity: 0.7, mr: 0.5 }}>Session:</Box> 
                  <Box component="span" sx={{ fontFamily: 'monospace', letterSpacing: '0.5px' }}>
                    {sessionId?.substring(0, 8)}...
                  </Box>
                  <IconButton 
                    size="small" 
                    sx={{ ml: 0.5, opacity: 0.7 }}
                    onClick={() => {
                      if (sessionId) {
                        navigator.clipboard.writeText(sessionId);
                        setNotification({
                          open: true,
                          message: 'Session ID copied to clipboard',
                          severity: 'success'
                        });
                      }
                    }}
                  >
                    <ContentCopyIcon fontSize="small" sx={{ fontSize: '0.8rem' }} />
                  </IconButton>
                </Typography>
              </Box>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex' }}>
            <Tooltip title="Chat Settings">
              <IconButton 
                onClick={() => setShowSettings(!showSettings)}
                sx={{ 
                  color: showSettings ? 'primary.main' : 'inherit',
                  transition: 'all 0.2s'
                }}
              >
                <SettingsIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="New Chat">
              <IconButton 
                onClick={async () => {
                  try {
                    if (!agentId) return;
                    
                    // Create a new session
                    const defaultSessionName = `Chat with ${agent?.name || 'Agent'} - ${new Date().toLocaleString()}`;
                    const newSessionId = await apiService.createAgentSession(
                      agentId,
                      defaultSessionName
                    );
                    
                    // Navigate to the new session
                    navigate(`/chat/${agentId}/${newSessionId}`);
                    
                    setNotification({
                      open: true,
                      message: 'New chat session created',
                      severity: 'success'
                    });
                  } catch (error) {
                    console.error('Error creating new session:', error);
                    setNotification({
                      open: true,
                      message: 'Failed to create new session',
                      severity: 'error'
                    });
                  }
                }}
                sx={{ 
                  color: theme.palette.primary.main,
                  transition: 'all 0.2s'
                }}
              >
                <NoteAddIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        {/* Settings Panel */}
        <Collapse in={showSettings}>
          <Box sx={{ 
            p: 2, 
            pt: 0,
            borderTop: '1px solid',
            borderColor: 'divider',
            background: theme.palette.mode === 'dark' ? 'rgba(20, 20, 20, 0.5)' : 'rgba(245, 245, 245, 0.5)'
          }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={isStreaming}
                    onChange={(e) => setIsStreaming(e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Typography variant="body2">
                    Streaming Responses
                    <Typography variant="caption" sx={{ display: 'block', opacity: 0.7 }}>
                      Show responses as they are generated
                    </Typography>
                  </Typography>
                }
              />
              
              {agent && (
                <>
                  <Divider />
                  <Typography variant="subtitle2" sx={{ fontWeight: 500, mb: 1 }}>
                    Agent Configuration
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    <Chip 
                      label={`Model: ${agent.model}`} 
                      size="small" 
                      sx={{ 
                        borderRadius: '4px',
                        fontWeight: 500
                      }}
                    />
                    {agent.config?.toolgroups && agent.config.toolgroups.length > 0 && (
                      <Chip 
                        label={`Tools: ${agent.config.toolgroups.length}`} 
                        size="small" 
                        color="primary" 
                        sx={{ 
                          borderRadius: '4px',
                          fontWeight: 500
                        }}
                      />
                    )}
                    {agent.config?.sampling_params?.temperature && (
                      <Chip 
                        label={`Temp: ${agent.config.sampling_params.temperature}`} 
                        size="small"
                        sx={{ 
                          borderRadius: '4px',
                          fontWeight: 500
                        }}
                      />
                    )}
                  </Box>
                </>
              )}
            </Box>
          </Box>
        </Collapse>
      </Paper>

      {/* Messages */}
      <Box
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          p: 2,
          pb: 4, // Add padding at bottom to ensure messages don't get hidden behind input
          bgcolor: 'background.default',
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100vh - 200px)' // Adjust height to leave room for header and input
        }}
      >
        {messages.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              opacity: 0.7,
            }}
          >
            <Typography variant="h6" color="text.secondary">
              Start a conversation
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Send a message to begin chatting with the agent
            </Typography>
          </Box>
        ) : (
          <List>
            {messages
              .filter(msg => msg.role !== 'system') // Don't show system messages
              .map((message, index) => (
                <ListItem
                  key={index}
                  sx={{
                    display: 'flex',
                    justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                    p: 0,
                    mb: 2
                  }}
                >
                  <ChatMessage
                    message={message}
                    isLast={index === messages.length - 1 && isSending}
                  />
                </ListItem>
              ))}
          </List>
        )}
        <div ref={messagesEndRef} />
      </Box>
      
      {/* Input */}
      <Paper
        elevation={3}
        sx={{
          p: 0,
          borderRadius: 0,
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          boxShadow: '0px -2px 10px rgba(0,0,0,0.1)',
          background: theme.palette.mode === 'dark' ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(8px)',
          [theme.breakpoints.up('md')]: {
            marginLeft: '260px', // Match the width of the sidebar on larger screens
          },
          [theme.breakpoints.down('md')]: {
            marginLeft: 0, // No margin on smaller screens
          }
        }}
      >
        <Box sx={{ 
          maxWidth: '1200px', // Match the max-width of the content area
          width: '100%',
          mx: 'auto', // Center the box
          p: 2
        }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            px: 2,
            py: 1,
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(50, 50, 50, 0.4)' : 'rgba(240, 240, 240, 0.6)',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider'
          }}>
          <IconButton
            color="primary"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending}
            sx={{ mr: 1 }}
          >
            <AttachFileIcon />
          </IconButton>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />
          <TextField
            fullWidth
            placeholder="Type your message..."
            variant="standard" // Changed to standard for cleaner look
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isSending}
            multiline
            maxRows={4}
            sx={{ 
              mx: 1,
              '& .MuiInput-underline:before': { borderBottom: 'none' },
              '& .MuiInput-underline:after': { borderBottom: 'none' },
              '& .MuiInput-underline:hover:not(.Mui-disabled):before': { borderBottom: 'none' }
            }}
          />
          <Button
            variant="contained"
            color="primary"
            endIcon={isSending ? <CircularProgress size={20} /> : <SendIcon />}
            onClick={handleSendMessage}
            disabled={!input.trim() || isSending}
            sx={{ ml: 1 }}
          >
            Send
          </Button>
          </Box>
        </Box>
      </Paper>

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

export default AgentChatPage;