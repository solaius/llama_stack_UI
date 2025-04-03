import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  IconButton,
  Divider,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Chip,
  Stack,
  FormControlLabel,
  Switch,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
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
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Settings as SettingsIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  AttachFile as AttachFileIcon,
} from '@mui/icons-material';
import ChatMessage from './ChatMessage';
import apiService, { Message, Model, Tool, ChatCompletionRequest } from '../../services/api';
import { SSE } from 'sse.js';

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [tools, setTools] = useState<Tool[]>([]);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [isStreaming, setIsStreaming] = useState(true);
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1024);
  const [toolChoice, setToolChoice] = useState<'auto' | 'required' | 'none'>('auto');
  const [systemPrompt, setSystemPrompt] = useState('');
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
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<SSE | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch models and tools on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const modelsData = await apiService.getModels();
        setModels(modelsData.filter(model => model.model_type === 'llm'));
        
        if (modelsData.length > 0) {
          setSelectedModel(modelsData[0].identifier);
        }
        
        const toolsData = await apiService.getTools();
        setTools(toolsData);
      } catch (error) {
        console.error('Error fetching initial data:', error);
        setNotification({
          open: true,
          message: 'Failed to load models and tools. Please refresh the page.',
          severity: 'error'
        });
      }
    };
    
    fetchData();
    
    // Cleanup function to close EventSource on unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current && typeof messagesEndRef.current.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || !selectedModel) return;
    
    // Add user message
    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    // Add system message if provided and it's the first message
    const allMessages: Message[] = [...messages];
    if (systemPrompt && messages.length === 0) {
      const systemMessage: Message = { role: 'system', content: systemPrompt };
      allMessages.unshift(systemMessage);
    }
    allMessages.push(userMessage);
    
    try {
      // Prepare tool definitions if tools are selected
      const toolDefinitions = selectedTools.length > 0
        ? tools
            .filter(tool => selectedTools.includes(tool.identifier))
            .map(tool => ({
              tool_name: tool.identifier,
              description: tool.description,
              parameters: tool.parameters.reduce((acc, param) => {
                acc[param.name] = {
                  param_type: param.parameter_type,
                  description: param.description,
                  required: param.required,
                  default: param.default,
                };
                return acc;
              }, {} as Record<string, any>),
            }))
        : undefined;
      
      // Prepare request
      const request: ChatCompletionRequest = {
        model_id: selectedModel,
        messages: allMessages,
        tools: toolDefinitions,
        tool_choice: toolChoice,
        stream: isStreaming,
        temperature,
        max_tokens: maxTokens,
      };
      
      if (isStreaming) {
        // Handle streaming response
        let assistantMessage: Message = { role: 'assistant', content: '' };
        setMessages(prev => [...prev, assistantMessage]);
        
        // Create a new EventSource for SSE
        
        const eventSource = new SSE(
          process.env.REACT_APP_API_URL + '/v1/inference/chat-completion?stream=true', {headers: {'Content-Type': 'application/json',
                'Accept': "text/event-stream"},
          payload: JSON.stringify(request) });

        eventSourceRef.current = eventSource;
        
        eventSource.onmessage = (event) => {
          const data = JSON.parse(event.data);
          
          if (data.event.event_type === 'progress') {
            // Update the assistant's message with new content
            assistantMessage.content += data.event.delta.text;
            setMessages(prev => [...prev.slice(0, -1), { ...assistantMessage }]);
          } else if (data.event.event_type === 'complete') {
            // Complete the message and add any tool calls
            if (data.completion_message?.tool_calls) {
              assistantMessage.tool_calls = data.completion_message.tool_calls;
            }
            assistantMessage.stop_reason = data.event.stop_reason;

            setMessages(prev => [...prev.slice(0, -1), { ...assistantMessage }]);
            setIsLoading(false);
            eventSource.close();
            eventSourceRef.current = null;
          }
        };
        
        eventSource.onerror = (error) => {
          console.error('EventSource error:', error);
          setIsLoading(false);
          eventSource.close();
          eventSourceRef.current = null;
          
          // Show notification
          setNotification({
            open: true,
            message: 'Error in streaming response. Please try again.',
            severity: 'error'
          });
        };
      } else {
        // Handle non-streaming response
        const response = await apiService.createChatCompletion(request);
        
        // Add assistant message
        const assistantMessage: Message = {
          role: 'assistant',
          content: response.completion_message.content,
          stop_reason: response.completion_message.stop_reason,
          tool_calls: response.completion_message.tool_calls,
        };
        
        setMessages(prev => [...prev, assistantMessage]);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setIsLoading(false);
      
      // Add error message
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, there was an error processing your request. Please try again.',
        },
      ]);
      
      // Show notification
      setNotification({
        open: true,
        message: 'Failed to send message. Please try again.',
        severity: 'error'
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  const handleModelChange = (event: SelectChangeEvent) => {
    setSelectedModel(event.target.value);
  };

  const handleToolChange = (event: SelectChangeEvent<string[]>) => {
    setSelectedTools(
      typeof event.target.value === 'string' ? event.target.value.split(',') : event.target.value,
    );
  };

  const handleToolChoiceChange = (event: SelectChangeEvent) => {
    setToolChoice(event.target.value as 'auto' | 'required' | 'none');
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

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Paper elevation={0} sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6">Chat with Available Models</Typography>
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
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Interact with Available LLMs through a conversational interface. Test various models and tools for enhanced capabilities.
        </Typography>
        
        <Accordion expanded={showSettings} onChange={() => setShowSettings(!showSettings)}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Chat Settings</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Model</InputLabel>
                <Select
                  value={selectedModel}
                  label="Model"
                  onChange={handleModelChange}
                >
                  {models.map((model) => (
                    <MenuItem key={model.identifier} value={model.identifier}>
                      {model.identifier}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth size="small">
                <InputLabel>Tools</InputLabel>
                <Select
                  multiple
                  value={selectedTools}
                  label="Tools"
                  onChange={handleToolChange}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {tools.map((tool) => (
                    <MenuItem key={tool.identifier} value={tool.identifier}>
                      {tool.identifier} - {tool.description}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              {selectedTools.length > 0 && (
                <FormControl fullWidth size="small">
                  <InputLabel>Tool Choice</InputLabel>
                  <Select
                    value={toolChoice}
                    label="Tool Choice"
                    onChange={handleToolChoiceChange}
                  >
                    <MenuItem value="auto">Auto</MenuItem>
                    <MenuItem value="required">Required</MenuItem>
                    <MenuItem value="none">None</MenuItem>
                  </Select>
                </FormControl>
              )}
              
              <TextField
                label="System Prompt"
                multiline
                rows={2}
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                fullWidth
                size="small"
                placeholder="Optional system instructions"
              />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={isStreaming}
                      onChange={(e) => setIsStreaming(e.target.checked)}
                    />
                  }
                  label="Streaming"
                />
                
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ mr: 1 }}>
                    Temperature: {temperature}
                  </Typography>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  />
                </Box>
              </Box>
            </Stack>
          </AccordionDetails>
        </Accordion>
      </Paper>
      
      <Box
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          p: 2,
          mb: 2,
          maxHeight: 'calc(100vh - 300px)',
          bgcolor: 'background.default',
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
              Select a model and start chatting
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
                            <ChatMessage
                              message={message}
                              isLast={index === messages.length - 1 && isLoading}
                            />
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Box>
                </ListItem>
              ))}
          </List>
        )}
        <div ref={messagesEndRef} />
      </Box>
      
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
            disabled={isLoading}
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
            disabled={isLoading}
            multiline
            maxRows={4}
            sx={{ mx: 1 }}
          />
          <Button
            variant="contained"
            color="primary"
            endIcon={isLoading ? <CircularProgress size={20} /> : <SendIcon />}
            onClick={handleSendMessage}
            disabled={isLoading || !input.trim() || !selectedModel}
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

export default ChatInterface;