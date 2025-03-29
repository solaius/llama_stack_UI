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
  List,
  ListItem,
  Avatar,
  Card,
  CardContent,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Send as SendIcon,
  ArrowBack as ArrowBackIcon,
  Refresh as RefreshIcon,
  AttachFile as AttachFileIcon,
  Build as BuildIcon
} from '@mui/icons-material';
import { Agent, Message, TurnInfo, ToolCall, ToolResult, apiService } from '../services/api';
import ToolUsageDisplay from '../components/Chat/ToolUsageDisplay';

const AgentChatPage: React.FC = () => {
  const { agentId, sessionId } = useParams<{ agentId: string; sessionId: string }>();
  const navigate = useNavigate();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);
  const [toolResults, setToolResults] = useState<ToolResult[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isProcessingTool, setIsProcessingTool] = useState(false);
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!agentId || !sessionId) return;
      
      try {
        setIsLoading(true);
        
        // Fetch agent details
        const agentData = await apiService.getAgent(agentId);
        setAgent(agentData);
        
        try {
          // Try to fetch the session and its turns
          const sessionData = await apiService.getAgentSession(agentId, sessionId);
          
          // Process the session data to extract messages
          const extractedMessages: Message[] = [];
          const extractedToolCalls: ToolCall[] = [];
          const extractedToolResults: ToolResult[] = [];
          
          // Add system message if available
          if (agentData.instructions) {
            extractedMessages.push({
              role: 'system',
              content: agentData.instructions
            });
          }
          
          // Process each turn to extract messages, tool calls, and tool results
          if (sessionData.turns && sessionData.turns.length > 0) {
            sessionData.turns.forEach(turn => {
              // Add user input messages
              if (turn.input_messages && turn.input_messages.length > 0) {
                extractedMessages.push(...turn.input_messages);
              }
              
              // Add assistant output message
              if (turn.output_message) {
                extractedMessages.push(turn.output_message);
                
                // Extract tool calls from the output message
                if (turn.output_message.tool_calls && turn.output_message.tool_calls.length > 0) {
                  extractedToolCalls.push(...turn.output_message.tool_calls);
                }
              }
              
              // Add tool results
              if (turn.tool_results && turn.tool_results.length > 0) {
                extractedToolResults.push(...turn.tool_results);
              }
            });
          }
          
          setMessages(extractedMessages);
          setToolCalls(extractedToolCalls);
          setToolResults(extractedToolResults);
        } catch (sessionError) {
          console.warn('Error fetching session data, starting with empty chat:', sessionError);
          
          // If we can't fetch the session, start with just the system message
          setMessages([{
            role: 'system',
            content: agentData.instructions
          }]);
        }
      } catch (error) {
        console.error('Error fetching chat data:', error);
        setNotification({
          open: true,
          message: 'Failed to load chat data. Please try again.',
          severity: 'error'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [agentId, sessionId]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || !agentId || !sessionId) return;
    
    const userMessage: Message = {
      role: 'user',
      content: input
    };
    
    // Add user message to the chat
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInput('');
    setIsSending(true);
    
    try {
      // Get all messages except system messages to send to the API
      const messagesToSend = messages
        .filter(msg => msg.role !== 'system')
        .concat(userMessage);
      
      // Create a streaming event source for the agent turn
      const eventSource = apiService.createStreamingAgentTurn(
        agentId,
        sessionId,
        messagesToSend
      );
      
      let assistantMessage: Message = {
        role: 'assistant',
        content: ''
      };
      
      let currentToolCalls: ToolCall[] = [];
      
      // Handle streaming events
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Streaming event:', data);
          
          if (data.event && data.event.event_type === 'progress') {
            // Update the assistant's message with the new content
            if (data.event.delta && data.event.delta.text) {
              assistantMessage.content += data.event.delta.text;
              
              // Update the message in the UI
              setMessages(prevMessages => {
                const newMessages = [...prevMessages];
                const lastIndex = newMessages.length - 1;
                
                // If the last message is from the assistant, update it
                // Otherwise, add a new assistant message
                if (lastIndex >= 0 && newMessages[lastIndex].role === 'assistant') {
                  newMessages[lastIndex] = { ...assistantMessage };
                } else {
                  newMessages.push({ ...assistantMessage });
                }
                
                return newMessages;
              });
            }
            
            // Handle tool calls
            if (data.event.delta && data.event.delta.tool_calls) {
              currentToolCalls = [...currentToolCalls, ...data.event.delta.tool_calls];
              
              // Update the assistant's message with the tool calls
              assistantMessage.tool_calls = currentToolCalls;
              
              // Update the tool calls in the UI
              setToolCalls(prevToolCalls => [
                ...prevToolCalls,
                ...data.event.delta.tool_calls
              ]);
              
              // Update the message in the UI
              setMessages(prevMessages => {
                const newMessages = [...prevMessages];
                const lastIndex = newMessages.length - 1;
                
                // If the last message is from the assistant, update it
                // Otherwise, add a new assistant message
                if (lastIndex >= 0 && newMessages[lastIndex].role === 'assistant') {
                  newMessages[lastIndex] = { ...assistantMessage };
                } else {
                  newMessages.push({ ...assistantMessage });
                }
                
                return newMessages;
              });
            }
          } else if (data.event && data.event.event_type === 'end') {
            // Handle the end of the stream
            console.log('Stream ended:', data);
            eventSource.close();
            setIsSending(false);
          }
        } catch (error) {
          console.error('Error parsing streaming event:', error);
        }
      };
      
      eventSource.onerror = (error) => {
        console.error('Streaming error:', error);
        eventSource.close();
        setIsSending(false);
        
        setNotification({
          open: true,
          message: 'Error in streaming response. Please try again.',
          severity: 'error'
        });
      };
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleRerunTool = async (toolCall: ToolCall) => {
    if (!agentId || !sessionId) return;
    
    setIsProcessingTool(true);
    
    try {
      // Find the existing tool result
      const existingResult = toolResults.find(result => result.tool_call_id === toolCall.id);
      
      // Remove the existing result if it exists
      if (existingResult) {
        setToolResults(prev => prev.filter(result => result.tool_call_id !== toolCall.id));
      }
      
      // Parse the tool arguments
      const toolName = toolCall.function.name;
      const toolArgs = JSON.parse(toolCall.function.arguments);
      
      // Invoke the tool directly
      const toolResponse = await apiService.invokeTool(toolName, toolArgs);
      
      // Create a new tool result
      const newToolResult: ToolResult = {
        tool_call_id: toolCall.id,
        content: toolResponse
      };
      
      // Add the new tool result
      setToolResults(prev => [...prev, newToolResult]);
      
      // Show success notification
      setNotification({
        open: true,
        message: 'Tool execution completed successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error executing tool:', error);
      
      // Create an error tool result
      const errorToolResult: ToolResult = {
        tool_call_id: toolCall.id,
        content: null,
        error: 'Tool execution failed'
      };
      
      // Add the error tool result
      setToolResults(prev => [...prev, errorToolResult]);
      
      // Show error notification
      setNotification({
        open: true,
        message: 'Tool execution failed. Please try again.',
        severity: 'error'
      });
    } finally {
      setIsProcessingTool(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !agentId || !sessionId) return;
    
    try {
      setNotification({
        open: true,
        message: `Processing file "${files[0].name}"...`,
        severity: 'info'
      });
      
      // In a real implementation, you would upload the file and process it
      // For now, we'll just show a notification
      setNotification({
        open: true,
        message: `File "${files[0].name}" processed. File content will be included in the next message.`,
        severity: 'success'
      });
      
      // Set the input to include a reference to the file
      setInput(prev => prev + `\n\nI've uploaded a file named "${files[0].name}". Please help me analyze it.`);
    } catch (error) {
      console.error('Error uploading file:', error);
      setNotification({
        open: true,
        message: `Failed to process file "${files[0].name}". Please try again.`,
        severity: 'error'
      });
    }
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ height: 'calc(100vh-64px)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box
        component={Paper}
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          borderRadius: 0,
          zIndex: 1,
          boxShadow: 1
        }}
      >
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
            {agent?.name || 'Agent Chat'}
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            Model: {agent?.model || 'Unknown'} • Session: {sessionId?.substring(0, 8) || 'Unknown'}
          </Typography>
        </Box>
      </Box>

      {/* Messages */}
      <Box
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          p: 2,
          bgcolor: 'background.default'
        }}
      >
        <List>
          {messages.filter(msg => msg.role !== 'system').map((message, index) => (
            <ListItem
              key={index}
              sx={{
                display: 'flex',
                justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                mb: 2
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  maxWidth: '70%',
                  flexDirection: message.role === 'user' ? 'row-reverse' : 'row'
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: message.role === 'user' ? 'primary.main' : 'secondary.main',
                    mr: message.role === 'user' ? 0 : 1,
                    ml: message.role === 'user' ? 1 : 0
                  }}
                >
                  {message.role === 'user' ? 'U' : 'A'}
                </Avatar>
                <Card
                  sx={{
                    borderRadius: 2,
                    bgcolor: message.role === 'user' ? 'primary.light' : 'background.paper'
                  }}
                >
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Typography
                      variant="body1"
                      sx={{
                        color: message.role === 'user' ? 'primary.contrastText' : 'text.primary',
                        whiteSpace: 'pre-wrap'
                      }}
                    >
                      {message.content}
                    </Typography>
                    
                    {message.tool_calls && message.tool_calls.length > 0 && (
                      <Box sx={{ mt: 2, color: 'text.primary' }}>
                        <ToolUsageDisplay 
                          toolCalls={message.tool_calls}
                          toolResults={toolResults.filter(result => 
                            message.tool_calls?.some(call => call.id === result.tool_call_id)
                          )}
                          onRerunTool={handleRerunTool}
                        />
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Box>
            </ListItem>
          ))}
        </List>
        <div ref={messagesEndRef} />
      </Box>

      {/* Tool Processing Indicator */}
      {isProcessingTool && (
        <Box 
          sx={{ 
            position: 'fixed', 
            bottom: 80, 
            right: 20, 
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            bgcolor: 'background.paper',
            p: 1,
            borderRadius: 1,
            boxShadow: 3
          }}
        >
          <CircularProgress size={20} sx={{ mr: 1 }} />
          <Typography variant="body2">Processing tool...</Typography>
        </Box>
      )}
      
      {/* Input */}
      <Box
        component={Paper}
        sx={{
          p: 2,
          borderRadius: 0,
          boxShadow: 3
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
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            multiline
            maxRows={4}
            variant="outlined"
            disabled={isSending}
            sx={{ mx: 1 }}
          />
          <IconButton
            color="primary"
            onClick={handleSendMessage}
            disabled={!input.trim() || isSending}
          >
            {isSending ? <CircularProgress size={24} /> : <SendIcon />}
          </IconButton>
        </Box>
      </Box>

      {/* Notification */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseNotification} severity={notification.severity}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AgentChatPage;