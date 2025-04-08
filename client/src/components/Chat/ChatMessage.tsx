import React from 'react';
import { Box, Paper, Typography, Avatar, Chip, useTheme, Link } from '@mui/material';
import { 
  Person as PersonIcon, 
  SmartToy as BotIcon, 
  Code as CodeIcon,
  InsertDriveFile as FileIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  AttachFile as AttachFileIcon
} from '@mui/icons-material';
import { Message, ToolCall } from '../../services/api';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { docco, dark } from 'react-syntax-highlighter/dist/esm/styles/hljs';

interface ChatMessageProps {
  message: Message;
  isLast?: boolean;
  textSize?: number;
}

// Helper function to get file icon based on file type
const getFileIcon = (fileType: string | undefined) => {
  if (!fileType) return <AttachFileIcon />;
  
  if (fileType.startsWith('image/')) {
    return <ImageIcon />;
  } else if (fileType === 'application/pdf') {
    return <PdfIcon />;
  } else {
    return <FileIcon />;
  }
};

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isLast = false, textSize = 1 }) => {
  const theme = useTheme();
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';
  const isTool = message.role === 'tool';
  const isSystem = message.role === 'system';

  const renderToolCalls = (toolCalls: ToolCall[]) => {
    return toolCalls.map((toolCall, index) => (
      <Box key={toolCall.id || `tool-call-${index}`} sx={{ mt: 1, mb: 1 }}>
        <Chip
          icon={<CodeIcon />}
          label={`Tool: ${toolCall.tool_name}`}
          color="primary"
          variant="outlined"
          size="small"
          sx={{ mb: 1 }}
        />
        <SyntaxHighlighter
          language="json"
          style={theme.palette.mode === 'dark' ? dark : docco}
          customStyle={{
            borderRadius: '8px',
            padding: '12px',
            fontSize: '0.85rem',
          }}
          data-testid="syntax-highlighter"
        >
          {JSON.stringify(toolCall.arguments, null, 2)}
        </SyntaxHighlighter>
      </Box>
    ));
  };

  // Function to detect and format code blocks in messages
  const formatMessageContent = (content: string) => {
    if (!content) return null;

    // Simple regex to detect code blocks with language specification
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        parts.push(
          <Typography key={`text-${lastIndex}`} variant="body1" component="div" sx={{ whiteSpace: 'pre-wrap', fontSize: `${textSize}rem` }} data-testid="message-content">
            {content.substring(lastIndex, match.index)}
          </Typography>
        );
      }

      // Add code block
      const language = match[1] || 'text';
      const code = match[2];

      parts.push(
        <Box key={`code-${match.index}`} sx={{ my: 1 }}>
          <SyntaxHighlighter
            language={language}
            style={theme.palette.mode === 'dark' ? dark : docco}
            customStyle={{
              borderRadius: '8px',
              padding: '12px',
              fontSize: '0.85rem',
            }}
            data-testid="syntax-highlighter"
          >
            {code}
          </SyntaxHighlighter>
        </Box>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text after last code block
    if (lastIndex < content.length) {
      parts.push(
        <Typography key={`text-${lastIndex}`} variant="body1" component="div" sx={{ whiteSpace: 'pre-wrap', fontSize: `${textSize}rem` }} data-testid="message-content">
          {content.substring(lastIndex)}
        </Typography>
      );
    }

    return parts.length > 0 ? parts : (
      <Typography variant="body1" component="div" sx={{ whiteSpace: 'pre-wrap', fontSize: `${textSize}rem` }} data-testid="message-content">
        {content}
      </Typography>
    );
  };

  return (
    <Box
      data-testid="chat-message"
      sx={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        mb: 2,
        maxWidth: '100%',
      }}
    >
      <Avatar
        sx={{
          bgcolor: isUser
            ? 'primary.main'
            : isAssistant
              ? 'secondary.main'
              : isTool
                ? 'info.main'
                : 'text.secondary',
          mr: isUser ? 0 : 1,
          ml: isUser ? 1 : 0,
        }}
      >
        <span data-testid="message-role" style={{ display: 'none' }}>{message.role}</span>
        {isUser ? (
          <PersonIcon />
        ) : isAssistant ? (
          <BotIcon />
        ) : (
          <CodeIcon />
        )}
      </Avatar>
      <Paper
        elevation={1}
        sx={{
          p: 2,
          maxWidth: '80%',
          borderRadius: 2,
          bgcolor: isUser
            ? 'primary.light'
            : isSystem
              ? 'text.disabled'
              : 'background.paper',
          color: isUser
            ? 'primary.contrastText'
            : isSystem
              ? 'common.white'
              : 'text.primary',
          position: 'relative',
          '&::after': isLast && isAssistant ? {
            content: '""',
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            bgcolor: 'success.main',
            animation: 'pulse 1.5s infinite',
            '@keyframes pulse': {
              '0%': {
                transform: 'scale(0.95)',
                boxShadow: '0 0 0 0 rgba(76, 175, 80, 0.7)',
              },
              '70%': {
                transform: 'scale(1)',
                boxShadow: '0 0 0 10px rgba(76, 175, 80, 0)',
              },
              '100%': {
                transform: 'scale(0.95)',
                boxShadow: '0 0 0 0 rgba(76, 175, 80, 0)',
              },
            },
          } : {},
        }}
      >
        {isTool && (
          <Chip
            label={`Tool Response: ${message.tool_name}`}
            color="info"
            size="small"
            sx={{ mb: 1 }}
          />
        )}

        {formatMessageContent(message.content)}

        {/* Display file attachment if present */}
        {message.file && (
          <Box 
            sx={{ 
              mt: 2,
              p: 1.5,
              borderRadius: 1,
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(30, 30, 30, 0.6)' : 'rgba(245, 245, 245, 0.8)',
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {getFileIcon(message.file.type)}
              <Box sx={{ ml: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {message.file.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {message.file.type}
                </Typography>
              </Box>
            </Box>
            
            {message.file.type.startsWith('image/') && (
              <Box sx={{ mt: 2, width: '100%', maxWidth: '300px', mx: 'auto' }}>
                <img 
                  src={message.file.content.startsWith('data:') 
                    ? message.file.content 
                    : `data:${message.file.type};base64,${message.file.content}`} 
                  alt={message.file.name}
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '200px',
                    borderRadius: '4px',
                    display: 'block',
                    margin: '0 auto'
                  }}
                />
              </Box>
            )}
          </Box>
        )}

        {message.tool_calls && message.tool_calls.length > 0 && renderToolCalls(message.tool_calls)}
      </Paper>
    </Box>
  );
};

export default ChatMessage;