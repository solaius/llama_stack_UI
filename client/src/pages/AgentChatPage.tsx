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
        
        // In a real implementation, you would fetch the session and its turns
        // const sessionData = await apiService.getAgentSession(agentId, sessionId);
        
        // For now, we'll use mock messages
        const mockMessages: Message[] = [
          {
            role: 'system',
            content: agentData.instructions
          },
          {
            role: 'user',
            content: 'Hello! Can you help me with something?'
          },
          {
            role: 'assistant',
            content: 'Of course! I\'m here to help. What do you need assistance with?'
          },
          {
            role: 'user',
            content: 'What\'s the weather in New York?'
          },
          {
            role: 'assistant',
            content: 'I\'ll check the weather in New York for you.',
            tool_calls: [
              {
                id: 'call_01',
                type: 'function',
                function: {
                  name: 'get_weather',
                  arguments: JSON.stringify({
                    location: 'New York',
                    unit: 'celsius'
                  })
                }
              }
            ]
          }
        ];
        
        // Mock tool results
        const mockToolResults: ToolResult[] = [
          {
            tool_call_id: 'call_01',
            content: {
              temperature: 22,
              unit: 'celsius',
              description: 'Partly cloudy',
              location: 'New York, NY'
            }
          }
        ];
        
        setMessages(mockMessages);
        
        // Extract tool calls from messages
        const extractedToolCalls: ToolCall[] = [];
        mockMessages.forEach(msg => {
          if (msg.tool_calls && msg.tool_calls.length > 0) {
            extractedToolCalls.push(...msg.tool_calls);
          }
        });
        
        setToolCalls(extractedToolCalls);
        setToolResults(mockToolResults);
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
    
    setMessages([...messages, userMessage]);
    setInput('');
    setIsSending(true);
    
    try {
      // In a real implementation, you would call the API to create a turn
      // const turnResponse = await apiService.createAgentTurn(agentId, sessionId, [userMessage]);
      
      // For now, we'll simulate a response after a delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Check if the input contains keywords that might trigger tool usage
      const shouldUseTool = input.toLowerCase().includes('weather') || 
                           input.toLowerCase().includes('calculate') ||
                           input.toLowerCase().includes('search');
      
      let mockResponse: Message;
      
      if (shouldUseTool) {
        // Create a mock tool call
        const toolCallId = `call_${Date.now()}`;
        const toolName = input.toLowerCase().includes('weather') 
          ? 'get_weather' 
          : input.toLowerCase().includes('calculate')
            ? 'calculator'
            : 'web_search';
            
        const toolArgs = input.toLowerCase().includes('weather')
          ? { location: input.includes('New York') ? 'New York' : 'San Francisco', unit: 'celsius' }
          : input.toLowerCase().includes('calculate')
            ? { expression: '2 + 2' }
            : { query: input.replace(/search for |search |look up /gi, '') };
        
        mockResponse = {
          role: 'assistant',
          content: `I'll help you with that. Let me ${toolName === 'get_weather' ? 'check the weather' : toolName === 'calculator' ? 'calculate that' : 'search for that information'}.`,
          tool_calls: [
            {
              id: toolCallId,
              type: 'function',
              function: {
                name: toolName,
                arguments: JSON.stringify(toolArgs)
              }
            }
          ]
        };
        
        // Add the tool call to our state
        const newToolCall = mockResponse.tool_calls![0];
        setToolCalls(prev => [...prev, newToolCall]);
        
        // Simulate tool execution
        setTimeout(() => {
          const toolResult: ToolResult = {
            tool_call_id: toolCallId,
            content: toolName === 'get_weather' 
              ? {
                  temperature: Math.floor(Math.random() * 30),
                  unit: 'celsius',
                  description: ['Sunny', 'Cloudy', 'Rainy', 'Partly cloudy'][Math.floor(Math.random() * 4)],
                  location: toolArgs.location
                }
              : toolName === 'calculator'
                ? { result: 4 }
                : { 
                    results: [
                      { title: 'Search result 1', url: 'https://example.com/1' },
                      { title: 'Search result 2', url: 'https://example.com/2' }
                    ]
                  }
          };
          
          setToolResults(prev => [...prev, toolResult]);
          
          // Add a follow-up message with the tool result
          const followUpMessage: Message = {
            role: 'assistant',
            content: toolName === 'get_weather'
              ? `The weather in ${toolArgs.location} is ${toolResult.content.description.toLowerCase()} with a temperature of ${toolResult.content.temperature}°C.`
              : toolName === 'calculator'
                ? `The result of the calculation is 4.`
                : `Here are some search results for "${toolArgs.query}". The top result is "${toolResult.content.results[0].title}".`
          };
          
          setMessages(prev => [...prev, followUpMessage]);
        }, 2000);
      } else {
        // Regular response without tool calls
        mockResponse = {
          role: 'assistant',
          content: `I'm a simulated response to: "${input}"`
        };
      }
      
      setMessages(prev => [...prev, mockResponse]);
    } catch (error) {
      console.error('Error sending message:', error);
      setNotification({
        open: true,
        message: 'Failed to send message. Please try again.',
        severity: 'error'
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const handleRerunTool = (toolCall: ToolCall) => {
    setIsProcessingTool(true);
    
    // Find the existing tool result
    const existingResult = toolResults.find(result => result.tool_call_id === toolCall.id);
    
    // Remove the existing result if it exists
    if (existingResult) {
      setToolResults(prev => prev.filter(result => result.tool_call_id !== toolCall.id));
    }
    
    // Simulate tool execution with a delay
    setTimeout(() => {
      const toolName = toolCall.function.name;
      const toolArgs = JSON.parse(toolCall.function.arguments);
      
      const toolResult: ToolResult = {
        tool_call_id: toolCall.id,
        content: toolName === 'get_weather' 
          ? {
              temperature: Math.floor(Math.random() * 30),
              unit: 'celsius',
              description: ['Sunny', 'Cloudy', 'Rainy', 'Partly cloudy'][Math.floor(Math.random() * 4)],
              location: toolArgs.location
            }
          : toolName === 'calculator'
            ? { result: 4 }
            : { 
                results: [
                  { title: 'Updated search result 1', url: 'https://example.com/updated1' },
                  { title: 'Updated search result 2', url: 'https://example.com/updated2' }
                ]
              }
      };
      
      setToolResults(prev => [...prev, toolResult]);
      setIsProcessingTool(false);
      
      // Show notification
      setNotification({
        open: true,
        message: 'Tool execution completed successfully',
        severity: 'success'
      });
    }, 1500);
  };

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
    <Box sx={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
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
            {agent?.model || 'Agent Chat'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Session ID: {sessionId}
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
          {messages
            .filter(msg => msg.role !== 'system') // Don't show system messages
            .map((message, index) => (
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
      </Box>

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