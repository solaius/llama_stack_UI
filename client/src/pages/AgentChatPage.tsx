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
  AccordionDetails
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
  Person as PersonIcon
} from '@mui/icons-material';
import { Agent, Message, TurnInfo, ToolCall, ToolResult, apiService } from '../services/api';
import ToolUsageDisplay from '../components/Chat/ToolUsageDisplay';
import ChatMessage from '../components/Chat/ChatMessage';
import { SSE } from 'sse.js';

const AgentChatPage: React.FC = () => {
  const { agentId, sessionId } = useParams<{ agentId: string; sessionId: string }>();
  const navigate = useNavigate();
  
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
    <Box sx={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper elevation={1} sx={{ p: 2, borderRadius: 0 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
              <Typography variant="h6" noWrap>
                {agent?.name || agent?.model || 'Agent Chat'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Session ID: {sessionId}
              </Typography>
            </Box>
          </Box>
          <Box>
            <Tooltip title="Chat Settings">
              <IconButton onClick={() => setShowSettings(!showSettings)}>
                <SettingsIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Clear Chat">
              <IconButton onClick={handleClearChat} color="error">
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        <Accordion expanded={showSettings} onChange={() => setShowSettings(!showSettings)}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Chat Settings</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={isStreaming}
                    onChange={(e) => setIsStreaming(e.target.checked)}
                  />
                }
                label="Streaming Responses"
              />
              
              {agent && (
                <>
                  <Divider />
                  <Typography variant="subtitle2">Agent Configuration</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    <Chip label={`Model: ${agent.model}`} size="small" />
                    {agent.config?.toolgroups && agent.config.toolgroups.length > 0 && (
                      <Chip 
                        label={`Tools: ${agent.config.toolgroups.length}`} 
                        size="small" 
                        color="primary" 
                      />
                    )}
                    {agent.config?.sampling_params?.temperature && (
                      <Chip 
                        label={`Temp: ${agent.config.sampling_params.temperature}`} 
                        size="small" 
                      />
                    )}
                  </Box>
                </>
              )}
            </Box>
          </AccordionDetails>
        </Accordion>
      </Paper>

      {/* Messages */}
      <Box
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          p: 2,
          bgcolor: 'background.default'
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
                    justifyContent: 'center',
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
          p: 2,
          borderRadius: 0
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton
            color="primary"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending}
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
            variant="outlined"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isSending}
            multiline
            maxRows={4}
            sx={{ mx: 1 }}
          />
          <Button
            variant="contained"
            color="primary"
            endIcon={isSending ? <CircularProgress size={20} /> : <SendIcon />}
            onClick={handleSendMessage}
            disabled={!input.trim() || isSending}
          >
            Send
          </Button>
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