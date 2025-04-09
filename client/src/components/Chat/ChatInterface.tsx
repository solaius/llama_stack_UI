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
} from '@mui/material';
import {
  Send as SendIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Settings as SettingsIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Code as CodeIcon,
} from '@mui/icons-material';
import ChatMessage from './ChatMessage';
import apiService, { Message, Model, Tool, ToolCall, ToolResult, ChatCompletionRequest } from '../../services/api';
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
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<SSE | null>(null);

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
        
        try {
          // Create a new EventSource for SSE
          const eventSource = new SSE(
            process.env.REACT_APP_API_URL + '/v1/inference/chat-completion?stream=true', {
              headers: {
                'Content-Type': 'application/json',
                'Accept': "text/event-stream"
              },
              payload: JSON.stringify(request) 
            }
          );
          
          eventSourceRef.current = eventSource;
          
          eventSource.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data);
              
              if (data.event.event_type === 'progress') {
                // Update the assistant's message with new content
                assistantMessage.content += data.event.delta.text;
                setMessages(prev => [...prev.slice(0, -1), { ...assistantMessage }]);
              } else if (data.event.event_type === 'complete') {
                // Check for Python code in the content
                const hasPythonCode = data.completion_message?.content && 
                                    data.completion_message.content.includes('<|python_tag|>');
                
                // Complete the message and add any tool calls
                if (data.completion_message?.tool_calls) {
                  assistantMessage.tool_calls = data.completion_message.tool_calls;
                } 
                // If Python code is detected but no tool calls, check available tools
                else if (hasPythonCode) {
                  console.log('Python code detected in completion message');
                  
                  // Extract the Python code
                  const pythonCode = data.completion_message.content.replace('<|python_tag|>', '').trim();
                  
                  // Check if code_interpreter is in the selected tools
                  const hasCodeInterpreter = selectedTools.includes('code_interpreter');
                  
                  // Check if websearch is in the selected tools
                  const hasWebSearch = selectedTools.includes('web_search') || 
                                    selectedTools.includes('websearch');
                  
                  console.log('Selected tools:', selectedTools);
                  console.log('Has code_interpreter:', hasCodeInterpreter);
                  console.log('Has websearch:', hasWebSearch);
                  
                  if (hasCodeInterpreter) {
                    // If code_interpreter is available, create a code_interpreter tool call
                    console.log('Converting Python code to code_interpreter tool call');
                    
                    // Create a synthetic tool call for code_interpreter
                    const codeToolCall: ToolCall = {
                      id: `code-${Date.now()}`,
                      type: 'function',
                      function: {
                        name: 'code_interpreter',
                        arguments: JSON.stringify({ code: pythonCode })
                      }
                    };
                    
                    // Add the tool call to the message
                    assistantMessage.tool_calls = [codeToolCall];
                    
                    console.log('Created synthetic tool call for code_interpreter:', codeToolCall);
                  } else if (hasWebSearch) {
                    // If websearch is available but not code_interpreter, create a websearch tool call
                    console.log('Converting Python code to websearch tool call');
                    
                    // Extract a search query from the Python code
                    // Remove the "br>" prefix and any "Let me check..." preamble
                    let searchQuery = pythonCode.replace(/^br>/, '').trim();
                    
                    // Extract the actual query by removing common preambles
                    searchQuery = searchQuery.replace(/^Let me check (the current )?weather (conditions )?(in|for) /i, '');
                    searchQuery = searchQuery.replace(/^I'll search for /i, '');
                    searchQuery = searchQuery.replace(/^Let me search for /i, '');
                    searchQuery = searchQuery.replace(/^Let me look up /i, '');
                    searchQuery = searchQuery.replace(/for you\.?$/i, '');
                    
                    // If the query is about weather, make it more specific
                    if (searchQuery.toLowerCase().includes('weather') && 
                        !searchQuery.toLowerCase().includes('current weather')) {
                      searchQuery = `current weather ${searchQuery}`;
                    }
                    
                    console.log('Extracted search query:', searchQuery);
                    
                    // Create a synthetic tool call for websearch
                    const searchToolCall: ToolCall = {
                      id: `search-${Date.now()}`,
                      type: 'function',
                      function: {
                        name: 'web_search',
                        arguments: JSON.stringify({ query: searchQuery })
                      }
                    };
                    
                    // Add the tool call to the message
                    assistantMessage.tool_calls = [searchToolCall];
                    
                    console.log('Created synthetic tool call for websearch:', searchToolCall);
                  } else {
                    // If neither tool is available, just display the message as is
                    console.log('No code_interpreter or websearch tools available. Displaying message as is.');
                  }
                }
                
                assistantMessage.stop_reason = data.event.stop_reason;

                setMessages(prev => [...prev.slice(0, -1), { ...assistantMessage }]);
                
                // Execute tool calls if present
                if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
                  setTimeout(async () => {
                    try {
                      // Execute each tool call
                      const toolResults = await Promise.all(
                        assistantMessage.tool_calls!.map(async (toolCall: ToolCall) => {
                          try {
                            // Call the API to execute the tool
                            const result = await apiService.executeToolCall(toolCall);
                            return result;
                          } catch (error) {
                            console.error('Error executing tool call:', error);
                            return {
                              tool_call_id: toolCall.id,
                              content: null,
                              error: error instanceof Error ? error.message : 'Unknown error executing tool'
                            };
                          }
                        })
                      );
                      
                      // Add tool results as messages
                      const toolMessages: Message[] = toolResults.map(result => ({
                        role: 'tool',
                        content: typeof result.content === 'string' 
                          ? result.content 
                          : JSON.stringify(result.content),
                        tool_call_id: result.tool_call_id,
                        error: result.error
                      }));
                      
                      // Add tool messages to the chat
                      setMessages(prev => [...prev, ...toolMessages]);
                      
                    } catch (error) {
                      console.error('Error handling tool calls:', error);
                    }
                  }, 500);
                }
                
                setIsLoading(false);
                if (eventSourceRef.current) {
                  eventSourceRef.current.close();
                }
                eventSourceRef.current = null;
              }
            } catch (error) {
              console.error('Error parsing SSE message:', error, event.data);
            }
          };
          
          eventSource.onerror = (error: Event) => {
            console.error('EventSource error:', error);
            setIsLoading(false);
            if (eventSourceRef.current) {
              eventSourceRef.current.close();
            }
            eventSourceRef.current = null;
          };
          
          // Start the connection
          eventSource.stream();
        } catch (streamError) {
          console.error('Error setting up streaming:', streamError);
          setIsLoading(false);
          
          // Update the message with an error
          setMessages(prev => {
            const newMessages = [...prev];
            const errorMessage: Message = {
              role: 'assistant',
              content: 'Sorry, there was an error with the streaming connection. Please try again.'
            };
            if (newMessages.length > 0) {
              newMessages[newMessages.length - 1] = errorMessage;
            } else {
              newMessages.push(errorMessage);
            }
            return newMessages;
          });
        }
      } else {
        // Handle non-streaming response
        try {
          const response = await apiService.createChatCompletion(request);
          
          // Add assistant message
          const assistantMessage: Message = {
            role: 'assistant',
            content: response.completion_message.content,
            stop_reason: response.completion_message.stop_reason,
            tool_calls: response.completion_message.tool_calls,
          };
          
          // Check for Python code in the content
          const hasPythonCode = assistantMessage.content && 
                              assistantMessage.content.includes('<|python_tag|>');
          
          // If Python code is detected but no tool calls, check available tools
          if (hasPythonCode && (!assistantMessage.tool_calls || assistantMessage.tool_calls.length === 0)) {
            console.log('Python code detected in non-streaming response');
            
            // Extract the Python code
            const pythonCode = assistantMessage.content.replace('<|python_tag|>', '').trim();
            
            // Check if code_interpreter is in the selected tools
            const hasCodeInterpreter = selectedTools.includes('code_interpreter');
            
            // Check if websearch is in the selected tools
            const hasWebSearch = selectedTools.includes('web_search') || 
                              selectedTools.includes('websearch');
            
            console.log('Selected tools:', selectedTools);
            console.log('Has code_interpreter:', hasCodeInterpreter);
            console.log('Has websearch:', hasWebSearch);
            
            if (hasCodeInterpreter) {
              // If code_interpreter is available, create a code_interpreter tool call
              console.log('Converting Python code to code_interpreter tool call');
              
              // Create a synthetic tool call for code_interpreter
              const codeToolCall: ToolCall = {
                id: `code-${Date.now()}`,
                type: 'function',
                function: {
                  name: 'code_interpreter',
                  arguments: JSON.stringify({ code: pythonCode })
                }
              };
              
              // Add the tool call to the message
              assistantMessage.tool_calls = [codeToolCall];
              
              console.log('Created synthetic tool call for code_interpreter:', codeToolCall);
            } else if (hasWebSearch) {
              // If websearch is available but not code_interpreter, create a websearch tool call
              console.log('Converting Python code to websearch tool call');
              
              // Extract a search query from the Python code
              // Remove the "br>" prefix and any "Let me check..." preamble
              let searchQuery = pythonCode.replace(/^br>/, '').trim();
              
              // Extract the actual query by removing common preambles
              searchQuery = searchQuery.replace(/^Let me check (the current )?weather (conditions )?(in|for) /i, '');
              searchQuery = searchQuery.replace(/^I'll search for /i, '');
              searchQuery = searchQuery.replace(/^Let me search for /i, '');
              searchQuery = searchQuery.replace(/^Let me look up /i, '');
              searchQuery = searchQuery.replace(/for you\.?$/i, '');
              
              // If the query is about weather, make it more specific
              if (searchQuery.toLowerCase().includes('weather') && 
                  !searchQuery.toLowerCase().includes('current weather')) {
                searchQuery = `current weather ${searchQuery}`;
              }
              
              console.log('Extracted search query:', searchQuery);
              
              // Create a synthetic tool call for websearch
              const searchToolCall: ToolCall = {
                id: `search-${Date.now()}`,
                type: 'function',
                function: {
                  name: 'web_search',
                  arguments: JSON.stringify({ query: searchQuery })
                }
              };
              
              // Add the tool call to the message
              assistantMessage.tool_calls = [searchToolCall];
              
              console.log('Created synthetic tool call for websearch:', searchToolCall);
            } else {
              // If neither tool is available, just display the message as is
              console.log('No code_interpreter or websearch tools available. Displaying message as is.');
            }
          }
          
          setMessages(prev => [...prev, assistantMessage]);
          
          // Execute tool calls if present
          if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
            setTimeout(async () => {
              try {
                // Execute each tool call
                const toolResults = await Promise.all(
                  assistantMessage.tool_calls!.map(async (toolCall) => {
                    try {
                      // Call the API to execute the tool
                      const result = await apiService.executeToolCall(toolCall);
                      return result;
                    } catch (error) {
                      console.error('Error executing tool call:', error);
                      return {
                        tool_call_id: toolCall.id,
                        content: null,
                        error: error instanceof Error ? error.message : 'Unknown error executing tool'
                      };
                    }
                  })
                );
                
                // Add tool results as messages
                const toolMessages: Message[] = toolResults.map(result => ({
                  role: 'tool',
                  content: typeof result.content === 'string' 
                    ? result.content 
                    : JSON.stringify(result.content),
                  tool_call_id: result.tool_call_id,
                  error: result.error
                }));
                
                // Add tool messages to the chat
                setMessages(prev => [...prev, ...toolMessages]);
                
              } catch (error) {
                console.error('Error handling tool calls:', error);
              }
            }, 500);
          }
          
          setIsLoading(false);
        } catch (nonStreamError) {
          console.error('Error in non-streaming response:', nonStreamError);
          setIsLoading(false);
          
          // Add error message
          setMessages(prev => [
            ...prev,
            {
              role: 'assistant',
              content: 'An error occurred while processing your request. Please try again.',
            },
          ]);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setIsLoading(false);
      
      // Add error message
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'An error occurred while processing your request. Please try again.',
        },
      ]);
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
  
  // Handle rerunning a tool
  const handleRerunTool = async (toolCall: ToolCall) => {
    try {
      console.log('Rerunning tool call:', toolCall);
      
      // Execute the tool call
      const result = await apiService.executeToolCall(toolCall);
      console.log('Tool execution result:', result);
      
      // Add the tool result as a message
      const toolMessage: Message = {
        role: 'tool',
        content: typeof result.content === 'string' 
          ? result.content 
          : JSON.stringify(result.content),
        tool_call_id: result.tool_call_id,
        error: result.error
      };
      
      // Add tool message to the chat
      setMessages(prevMessages => [...prevMessages, toolMessage]);
      
    } catch (error) {
      console.error('Error rerunning tool:', error);
    }
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

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Accordion expanded={showSettings} onChange={() => setShowSettings(!showSettings)}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Settings</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Model</InputLabel>
              <Select
                value={selectedModel}
                label="Model"
                onChange={handleModelChange}
                disabled={isLoading}
              >
                {models.map((model) => (
                  <MenuItem key={model.identifier} value={model.identifier}>
                    {model.identifier}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl fullWidth>
              <InputLabel>Tools</InputLabel>
              <Select
                multiple
                value={selectedTools}
                label="Tools"
                onChange={handleToolChange}
                disabled={isLoading}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} />
                    ))}
                  </Box>
                )}
              >
                {tools.map((tool) => (
                  <MenuItem key={tool.identifier} value={tool.identifier}>
                    {tool.identifier}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl fullWidth>
              <InputLabel>Tool Choice</InputLabel>
              <Select
                value={toolChoice}
                label="Tool Choice"
                onChange={handleToolChoiceChange}
                disabled={isLoading}
              >
                <MenuItem value="auto">Auto</MenuItem>
                <MenuItem value="required">Required</MenuItem>
                <MenuItem value="none">None</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              label="System Prompt"
              multiline
              rows={3}
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              disabled={isLoading}
            />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={isStreaming}
                    onChange={(e) => setIsStreaming(e.target.checked)}
                    disabled={isLoading}
                  />
                }
                label="Streaming"
              />
              
              <Button
                variant="outlined"
                startIcon={<DeleteIcon />}
                onClick={handleClearChat}
                disabled={isLoading}
              >
                Clear Chat
              </Button>
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>
      
      <Paper
        elevation={0}
        sx={{
          p: 2,
          flexGrow: 1,
          overflow: 'auto',
          maxHeight: 'calc(100vh - 200px)',
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
          messages.map((message, index) => (
            <ChatMessage
              key={index}
              message={message}
              isLast={index === messages.length - 1 && isLoading}
              onRerunTool={handleRerunTool}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </Paper>
      
      <Paper elevation={1} sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-end' }}>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            sx={{ mr: 1 }}
          />
          <Button
            variant="contained"
            color="primary"
            endIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
            onClick={handleSendMessage}
            disabled={isLoading || !input.trim() || !selectedModel}
          >
            Send
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default ChatInterface;