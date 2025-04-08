import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as pdfjsLib from 'pdfjs-dist';
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
  Slider,
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
  Description as DescriptionIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  InsertDriveFile as FileIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { Agent, Message, TurnInfo, ToolCall, ToolResult, apiService } from '../services/api';
import ToolUsageDisplay from '../components/Chat/ToolUsageDisplay';
import ChatMessage from '../components/Chat/ChatMessage';
import { SSE } from 'sse.js';

// Helper function to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  else if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  else return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
};

// Extract text from PDF
const extractTextFromPDF = async (pdfData: string): Promise<string> => {
  try {
    // Initialize PDF.js
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    
    // Convert base64 to array buffer
    const binaryString = atob(pdfData);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({ data: bytes.buffer });
    const pdf = await loadingTask.promise;
    
    let extractedText = '';
    
    // Extract text from each page
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      extractedText += `Page ${i}:\n${pageText}\n\n`;
    }
    
    return extractedText;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    return 'Error extracting text from PDF. Please try a different file or format.';
  }
};

// Helper function to get file icon based on file type
const getFileIcon = (fileType: string) => {
  if (fileType.startsWith('image/')) {
    return <ImageIcon />;
  } else if (fileType === 'application/pdf') {
    return <PdfIcon />;
  } else {
    return <FileIcon />;
  }
};

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
  const [isFileLoading, setIsFileLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileContent, setSelectedFileContent] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number>(0);
  const [textSize, setTextSize] = useState<number>(0.9); // Default to slightly smaller text (0.9rem)
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

  // Function to scroll to bottom of messages
  const scrollToBottom = () => {
    console.log('Scrolling to bottom of messages');
    if (messagesEndRef.current) {
      // Force scroll to bottom with a slight delay to ensure DOM updates are complete
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 100);
    }
  };
  
  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    console.log('File selected:', file.name, 'Size:', file.size, 'Type:', file.type);
    
    // Check file size - limit to 10MB to be safe
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      setNotification({
        open: true,
        message: `File is too large (${formatFileSize(file.size)}). Maximum size is ${formatFileSize(MAX_FILE_SIZE)}.`,
        severity: 'error'
      });
      
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }
    
    setSelectedFile(file);
    setFileSize(file.size);
    setIsFileLoading(true);
    
    // For text files, read as text instead of data URL
    if (file.type === 'text/plain' || file.type === 'text/csv' || 
        file.name.endsWith('.txt') || file.name.endsWith('.csv') || 
        file.name.endsWith('.md') || file.name.endsWith('.json')) {
      const textReader = new FileReader();
      textReader.onload = (e) => {
        const content = e.target?.result as string;
        
        try {
          // For text files, we'll prefix with "data:text/plain;base64," to maintain consistency
          // Use encodeURIComponent to handle special characters properly
          const base64Content = btoa(unescape(encodeURIComponent(content)));
          const dataUrl = `data:text/plain;base64,${base64Content}`;
          setSelectedFileContent(dataUrl);
          setIsFileLoading(false);
          console.log('Text file content loaded, length:', content.length);
        } catch (error) {
          console.error('Error encoding text file content:', error);
          // If encoding fails, try a simpler approach
          try {
            const base64Content = btoa(content);
            const dataUrl = `data:text/plain;base64,${base64Content}`;
            setSelectedFileContent(dataUrl);
          } catch (e) {
            console.error('Failed to encode file content:', e);
            setNotification({
              open: true,
              message: 'Error processing text file. The file may contain invalid characters.',
              severity: 'error'
            });
            setSelectedFile(null);
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
          }
          setIsFileLoading(false);
        }
      };
      textReader.onerror = () => {
        setIsFileLoading(false);
        setNotification({
          open: true,
          message: 'Error reading text file. Please try again with a different file.',
          severity: 'error'
        });
        
        // Clear the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        setSelectedFile(null);
      };
      textReader.readAsText(file);
    } else {
      // For all other files, read as data URL
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setSelectedFileContent(content);
        setIsFileLoading(false);
        console.log('File content loaded, length:', content.length);
        
        // No notification popup - we'll show the file info in the UI instead
      };
      reader.onerror = () => {
        setIsFileLoading(false);
        setNotification({
          open: true,
          message: 'Error reading file. Please try again with a different file.',
          severity: 'error'
        });
        
        // Clear the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        setSelectedFile(null);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Handle removing the selected file
  const handleRemoveFile = () => {
    setSelectedFile(null);
    setSelectedFileContent(null);
    setFileSize(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    console.log('Messages changed, scrolling to bottom');
    scrollToBottom();
  }, [messages]);
  
  // Scroll to bottom when component mounts
  useEffect(() => {
    console.log('Component mounted, scrolling to bottom');
    scrollToBottom();
  }, []);

  // Handle sending a message
  const handleSendMessage = async () => {
    // Allow sending if there's text input OR a file is selected
    if ((!input.trim() && !selectedFile) || !agentId || !sessionId || isSending || isFileLoading) return;
    
    console.log('Sending message, current state:', { 
      input, 
      isSending, 
      isStreaming, 
      agentId, 
      sessionId 
    });
    
    // Create user message with detailed instructions based on file type
    let messageContent = input.trim();
    
    if (!messageContent && selectedFile) {
      if (selectedFile.type === 'application/pdf') {
        messageContent = `I'm sending you a PDF file: ${selectedFile.name}. The content is encoded in Base64 format. Please decode it, extract the text, and provide a detailed summary of the document's content.`;
      } else if (selectedFile.type.startsWith('image/')) {
        messageContent = `I'm sending you an image file: ${selectedFile.name}. The image is encoded in Base64 format. Please analyze this image and describe what you see in detail.`;
      } else if (selectedFile.type === 'text/plain' || 
                 selectedFile.name.endsWith('.txt') || 
                 selectedFile.name.endsWith('.md') || 
                 selectedFile.name.endsWith('.json') || 
                 selectedFile.name.endsWith('.csv')) {
        messageContent = `I'm sending you a text file: ${selectedFile.name}. The content is encoded in Base64 format. Please decode it and provide a detailed analysis of the text content.`;
      } else {
        messageContent = `I'm sending you a file: ${selectedFile.name} (${selectedFile.type}). The content is encoded in Base64 format. Please decode it and analyze what it contains.`;
      }
    }
    
    // If user provided their own message, add a note about the file
    if (messageContent && selectedFile) {
      messageContent += `\n\nI've also attached a file: ${selectedFile.name}. The file content is encoded in Base64 format.`;
    }
    
    const userMessage: Message = {
      role: 'user',
      content: messageContent
    };
    
    // Add file if one is selected
    if (selectedFile && selectedFileContent) {
      console.log('Adding file to message:', selectedFile.name, 'Type:', selectedFile.type);
      
      // For PDF files, we'll use text/plain as the type to help the agent process it
      const fileType = selectedFile.type === 'application/pdf' ? 'text/plain' : selectedFile.type;
      
      // Extract just the base64 content if it's a data URL
      let fileContent = selectedFileContent;
      if (selectedFileContent.includes(',')) {
        fileContent = selectedFileContent.split(',')[1];
      }
      
      // For PDF files, try to extract the text content
      if (selectedFile.type === 'application/pdf' || selectedFile.name.endsWith('.pdf')) {
        try {
          // Extract text from the PDF
          const extractedText = await extractTextFromPDF(fileContent);
          
          // Update the user message with the extracted text
          userMessage.content += `\n\nHere is the extracted text from the PDF:\n\n${extractedText}`;
        } catch (error) {
          console.error('Error extracting text from PDF:', error);
          // If extraction fails, just continue with the base64 content
          userMessage.content += '\n\nAttempted to extract text from the PDF but encountered an error. The file is still attached as Base64 content.';
        }
      }
      // For text files, add the content directly to the message
      else if (selectedFile.type === 'text/plain' || 
          selectedFile.name.endsWith('.txt') || 
          selectedFile.name.endsWith('.md') || 
          selectedFile.name.endsWith('.json') || 
          selectedFile.name.endsWith('.csv')) {
        try {
          // Try to decode the base64 content and add it to the message
          const decodedContent = atob(fileContent);
          userMessage.content += `\n\nHere is the decoded content of the file:\n\n${decodedContent}`;
        } catch (error) {
          console.error('Error decoding file content:', error);
          // If decoding fails, just continue with the base64 content
        }
      }
      
      userMessage.file = {
        name: selectedFile.name,
        content: fileContent,
        type: fileType
      };
      
      // Log the file attachment for debugging
      console.log('File attachment added to message:', {
        name: selectedFile.name,
        type: fileType,
        contentLength: fileContent.length
      });
    }
    
    console.log('Created user message:', userMessage);
    
    // Add user message to the chat
    setMessages(prevMessages => {
      console.log('Adding user message to state, previous messages:', prevMessages);
      const newMessages = [...prevMessages, userMessage];
      console.log('New messages state after adding user message:', newMessages);
      return newMessages;
    });
    
    // Clear input and file
    setInput('');
    setSelectedFile(null);
    setSelectedFileContent(null);
    
    // Set sending state
    setIsSending(true);
    
    // Scroll to bottom
    setTimeout(() => {
      scrollToBottom();
    }, 100);
    
    try {

      // Handle response based on streaming preference
      if (isStreaming) {
        console.log('Using streaming response handler');
        await handleStreamingResponse(userMessage);
      } else {
        console.log('Using non-streaming response handler');
        await handleNonStreamingResponse(userMessage);
      }
    } catch (error) {
      console.error('Error in handleSendMessage:', error);
      setIsSending(false);
      
      setNotification({
        open: true,
        message: 'An unexpected error occurred. Please try again.',
        severity: 'error'
      });
    }
    
    // Force a scroll to bottom after response is received
    setTimeout(() => {
      scrollToBottom();
    }, 200);
  };

  // Handle streaming response
  const handleStreamingResponse = async (userMessage: Message) => {
    console.log('Starting streaming response for message:', userMessage);
    
    // Create a new assistant message object that we'll update with streaming content
    const assistantMessage: Message = { role: 'assistant', content: '' };
    
    // Add the placeholder message to the state
    setMessages(prevMessages => {
      console.log('Adding placeholder assistant message to state');
      return [...prevMessages, assistantMessage];
    });
    
    try {
      // Ensure agentId and sessionId are defined
      if (!agentId || !sessionId) {
        throw new Error('Agent ID or Session ID is undefined');
      }
      
      // Create a new EventSource for SSE
      const url = `${apiService.getCurrentBaseUrl()}/v1/agents/${agentId}/session/${sessionId}/turn?stream=true`;
      console.log('Streaming URL:', url);
      
      const payload = {
        messages: [userMessage],
        stream: true,
        documents: [] // We don't need to include documents since we're sending the file directly in the message
      };
      console.log('Streaming payload:', JSON.stringify(payload, (key, value) => {
        // Truncate long content strings in the log for readability
        if (key === 'content' && typeof value === 'string' && value.length > 100) {
          return value.substring(0, 100) + '... [truncated]';
        }
        return value;
      }, 2));
      
      const eventSource = new SSE(url, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        payload: JSON.stringify(payload)
      });
      
      eventSourceRef.current = eventSource;
      
      // Track content to avoid duplicate updates
      let currentContent = '';
      
      eventSource.onmessage = (event) => {
        try {
          console.log('SSE message received:', event.data);
          const data = JSON.parse(event.data);

          if (data.error) {
            setMessages(prevMessages => {
              const newMessages = [...prevMessages];
              const errorMessage: Message = {
                role: 'assistant',
                content: data.error.message
              };
              newMessages[newMessages.length - 1] = errorMessage;
              return newMessages;
            });


            // Add error notification
            setNotification({
              open: true,
              message: 'Llama Stack could not handle the last request.',
              severity: 'error'
            });

            // Clean up
            setIsSending(false);
            eventSource.close();
            eventSourceRef.current = null;
          }
          
          if (data.event && data.event.payload && data.event.payload.event_type === 'step_progress') {
            // Update the assistant's message with new content
            if (data.event.payload.delta && data.event.payload.delta.text) {
              const newText = data.event.payload.delta.text;
              currentContent += newText;
              
              console.log('Updating message with new content:', newText);
              console.log('Current total content:', currentContent);
              
              // Update the state immutably by creating a new object based on the last message
              setMessages(prev => {
                // Grab the last message
                const lastMessage = prev[prev.length - 1];
                
                // Create a new object with updated content
                const updatedMessage = {
                  ...lastMessage,
                  content: lastMessage.content + newText,
                };
                
                // Return a brand-new array
                return [...prev.slice(0, -1), updatedMessage];
              });
              
              // Force scroll to bottom with each update
              setTimeout(scrollToBottom, 10);
            }
          } else if (data.event && data.event.payload && data.event.payload.event_type === 'turn_complete') {
            console.log('Turn complete event received:', data);
            
            // Extract the output message from the turn data
            if (data.event.payload && data.event.payload.turn && data.event.payload.turn.output_message) {
              const outputMessage = data.event.payload.turn.output_message;
              console.log('Output message from turn_complete:', outputMessage);
              
              // Update the state with the final message using immutable approach
              setMessages(prevMessages => {
                if (prevMessages.length > 0) {
                  // Create a new array with all messages except the last one
                  const allButLast = prevMessages.slice(0, -1);

                  const lastMessage = prevMessages[prevMessages.length - 1];

                  // If the last message contains tool_calls, carry them over to the finalMessage
                  if (lastMessage.tool_calls) {
                    outputMessage.tool_calls = lastMessage.tool_calls;
                  }

                  // Return a new array with the output message appended
                  return [...allButLast, outputMessage];
                }
                // If there are no messages, just return an array with the output message
                return [outputMessage];
              });
              
              // Clean up
              setIsSending(false);
              eventSource.close();
              eventSourceRef.current = null;
            }
          } else if (data.event && data.event.payload && data.event.payload.event_type === 'step_complete') {
            console.log('Step complete event received:', data);
            
            // Check if there's a model response in the step details
            if (data.event.payload.step_details && data.event.payload.step_details.model_response) {
              const modelResponse = data.event.payload.step_details.model_response;
              
              // Create the final message with all data
              const finalMessage: Message = {
                role: 'assistant',
                content: modelResponse.content || currentContent,
                stop_reason: modelResponse.stop_reason || undefined
              };
              
              // Add tool calls if present
              if (modelResponse.tool_calls) {
                console.log('Tool calls received:', modelResponse.tool_calls);
                finalMessage.tool_calls = modelResponse.tool_calls;
              }
              
              // Update the state with the final message using immutable approach
              setMessages(prevMessages => {
                if (prevMessages.length > 0) {
                  // Create a new array with all messages except the last one
                  const allButLast = prevMessages.slice(0, -1);

                  const lastMessage = prevMessages[prevMessages.length - 1];

                  // If the last message contains tool_calls, carry them over to the finalMessage
                  if (lastMessage.tool_calls) {
                    finalMessage.tool_calls = lastMessage.tool_calls;
                  }

                  // Return a new array with the final message appended
                  return [...allButLast, finalMessage];
                }
                // If there are no messages, just return an array with the final message
                return [finalMessage];
              });

              // Final scroll to bottom
              setTimeout(scrollToBottom, 50);
            }
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
        
        // Update the message with an error
        setMessages(prevMessages => {
          const newMessages = [...prevMessages];
          const errorMessage: Message = {
            role: 'assistant',
            content: 'Sorry, there was an error with the streaming connection. Please try again.'
          };
          newMessages[newMessages.length - 1] = errorMessage;
          return newMessages;
        });
        
        // Add error notification
        setNotification({
          open: true,
          message: 'Connection error. Please try again.',
          severity: 'error'
        });
      };
      
      // Open the connection
      console.log('Starting SSE stream');
      eventSource.stream();
      
    } catch (error) {
      console.error('Error setting up streaming:', error);
      setIsSending(false);
      
      // Update the placeholder message with an error
      setMessages(prevMessages => {
        const newMessages = [...prevMessages];
        const errorMessage: Message = {
          role: 'assistant',
          content: 'Sorry, there was an error processing your request.'
        };
        newMessages[newMessages.length - 1] = errorMessage;
        return newMessages;
      });
      
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
      
      console.log('Sending non-streaming message:', JSON.stringify(userMessage, (key, value) => {
        // Truncate long content strings in the log for readability
        if (key === 'content' && typeof value === 'string' && value.length > 100) {
          return value.substring(0, 100) + '... [truncated]';
        }
        return value;
      }, 2));
      
      // Call the API to create a turn
      const turnResponse = await apiService.createAgentTurn(
        agentId,
        sessionId,
        [userMessage],
        false, // non-streaming
        [], // We don't need to include documents since we're sending the file directly in the message
        [] // toolgroups
      );
      
      console.log('Received turn response:', turnResponse);
      
      // Add assistant message from the response
      if (turnResponse && turnResponse.output_message) {
        console.log('Adding assistant message to state:', turnResponse.output_message);
        
        // Use a callback function to ensure we're working with the latest state
        setMessages(prevMessages => {
          console.log('Previous messages:', prevMessages);
          const newMessages = [...prevMessages, turnResponse.output_message];
          console.log('New messages array:', newMessages);
          return [...newMessages]; // Return a new array to ensure React detects the change
        });
        
        // Force scroll to bottom
        setTimeout(scrollToBottom, 50);
      } else {
        console.warn('No output message in turn response:', turnResponse);
        
        // Fallback if no output message
        setMessages(prev => {
          const fallbackMessage: Message = {
            role: 'assistant',
            content: 'I received your message, but there was an issue with the response.'
          };
          const newMessages = [...prev, fallbackMessage];
          return [...newMessages]; // Return a new array to ensure React detects the change
        });
        
        // Force scroll to bottom
        setTimeout(scrollToBottom, 50);
      }
    } catch (error) {
      console.error('Error in non-streaming response:', error);
      
      // Add error message
      setMessages(prev => {
        const errorMessage: Message = {
          role: 'assistant',
          content: 'Sorry, there was an error processing your request. Please try again.'
        };
        return [...prev, errorMessage];
      });
      
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
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isSending) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Note: handleFileUpload function is defined earlier in the file
  
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
      {/* Header - Fixed Position */}
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
          zIndex: 10,
          width: '100%'
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
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                {/* Streaming Responses Toggle */}
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
                
                {/* Text Size Slider */}
                <Box sx={{ width: '40%' }}>
                  <Typography variant="body2" gutterBottom>
                    Text Size: {Math.round(textSize * 12)}pt
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>A</Typography>
                    <Slider
                      value={textSize}
                      min={0.7}
                      max={1.4}
                      step={0.1}
                      onChange={(_event: Event, value: number | number[]) => setTextSize(typeof value === 'number' ? value : value[0])}
                      aria-labelledby="text-size-slider"
                      size="small"
                    />
                    <Typography variant="caption" sx={{ fontSize: '1.1rem' }}>A</Typography>
                  </Box>
                </Box>
              </Box>
              
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

      {/* Messages - Scrollable Container */}
      <Box
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          p: 2,
          pb: 4, // Add padding at bottom to ensure messages don't get hidden behind input
          bgcolor: 'background.default',
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100vh - 200px)', // Adjust height to leave room for header and input
          scrollBehavior: 'smooth' // Enable smooth scrolling
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
          <>
            {/* Debug info - only visible in development */}
            {process.env.NODE_ENV === 'development' && (
              <Box sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.05)', mb: 2, borderRadius: 1, fontSize: '0.75rem' }}>
                <Typography variant="caption" component="div" sx={{ fontWeight: 'bold' }}>
                  Debug Info (only visible in development):
                </Typography>
                <Typography variant="caption" component="div">
                  Messages count: {messages.length}
                </Typography>
                <Typography variant="caption" component="div">
                  Is sending: {isSending ? 'true' : 'false'}
                </Typography>
              </Box>
            )}
            
            <List sx={{ width: '100%' }}>
              {messages
                .filter(msg => msg.role !== 'system') // Don't show system messages
                .map((message, index, filteredArray) => {
                  console.log(`Rendering message ${index}:`, message);
                  const isLastMessage = index === filteredArray.length - 1;
                  
                  return (
                    <ListItem
                      key={`message-${index}-${message.role}`}
                      sx={{
                        display: 'flex',
                        justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                        p: 0,
                        mb: 2,
                        width: '100%'
                      }}
                    >
                      <ChatMessage
                        message={message}
                        isLast={isLastMessage && isSending}
                        textSize={textSize}
                      />
                    </ListItem>
                  );
                })}
            </List>
          </>
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
            marginLeft: '265px', // Match the width of the sidebar on larger screens
            marginRight: '24px', // Add margin on the right side
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
          {/* File Indicator */}
          {selectedFile && (
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                mb: 1,
                p: 1,
                pl: 2,
                borderRadius: 1,
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(60, 60, 60, 0.6)' : 'rgba(230, 230, 230, 0.8)',
                border: '1px dashed',
                borderColor: isFileLoading ? 'primary.main' : 'divider'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {isFileLoading ? (
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                ) : (
                  getFileIcon(selectedFile.type)
                )}
                <Typography variant="body2" sx={{ ml: 1, fontWeight: 500 }}>
                  {selectedFile.name}
                </Typography>
                <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                  {formatFileSize(fileSize)}
                </Typography>
                {isFileLoading && (
                  <Typography variant="caption" sx={{ ml: 1, color: 'primary.main' }}>
                    Loading file...
                  </Typography>
                )}
              </Box>
              <IconButton 
                size="small" 
                onClick={handleRemoveFile}
                disabled={isFileLoading}
                sx={{ 
                  color: 'text.secondary',
                  '&:hover': {
                    color: 'error.main'
                  }
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          )}
          
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
            disabled={isSending || !!selectedFile}
            sx={{ 
              mr: 1,
              color: selectedFile ? 'success.main' : 'primary.main',
              opacity: selectedFile || isSending ? 0.6 : 1
            }}
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
            placeholder={selectedFile ? `Type your message about ${selectedFile.name}...` : "Type your message..."}
            variant="outlined" // Changed back to outlined to fix the periods issue
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSending}
            multiline
            maxRows={4}
            sx={{ 
              mx: 1,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                backgroundColor: theme.palette.background.paper,
                '& fieldset': {
                  borderColor: 'transparent'
                },
                '&:hover fieldset': {
                  borderColor: 'divider'
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'primary.main',
                  borderWidth: 1
                }
              }
            }}
          />
          <Button
            variant="contained"
            color="primary"
            endIcon={isSending || isFileLoading ? <CircularProgress size={20} /> : <SendIcon />}
            onClick={handleSendMessage}
            disabled={(!input.trim() && !selectedFile) || isSending || isFileLoading}
            sx={{ ml: 1 }}
          >
            {isFileLoading ? 'Loading File...' : 'Send'}
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