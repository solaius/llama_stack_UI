import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Divider,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  CardHeader,
  Collapse,
  SvgIcon
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Code as CodeIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Build as BuildIcon
} from '@mui/icons-material';
import { ToolCall, ToolResult } from '../../services/api';

interface ToolUsageDisplayProps {
  toolCalls: ToolCall[];
  toolResults?: ToolResult[];
  onRerunTool?: (toolCall: ToolCall) => void;
}

const ToolUsageDisplay: React.FC<ToolUsageDisplayProps> = ({
  toolCalls,
  toolResults = [],
  onRerunTool
}) => {
  const [expandedTool, setExpandedTool] = useState<string | null>(null);

  const handleExpandTool = (toolId: string) => {
    setExpandedTool(expandedTool === toolId ? null : toolId);
  };

  // Match tool results with tool calls
  const getToolResult = (toolCallId: string) => {
    return toolResults.find(result => result.tool_call_id === toolCallId);
  };

  if (!toolCalls || toolCalls.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mt: 2, mb: 2 }}>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        Tool Usage ({toolCalls.length})
      </Typography>
      {toolCalls.map((toolCall) => {
        const toolResult = getToolResult(toolCall.id);
        const isSuccess = toolResult && !toolResult.error;
        
        return (
          <Card 
            key={toolCall.id} 
            variant="outlined" 
            sx={{ 
              mb: 1, 
              borderLeft: isSuccess 
                ? '4px solid #4caf50' 
                : toolResult?.error 
                  ? '4px solid #f44336' 
                  : '4px solid #ff9800'
            }}
          >
            <CardHeader
              avatar={
                <BuildIcon color={isSuccess ? "success" : toolResult?.error ? "error" : "warning"} />
              }
              title={
                <Box display="flex" alignItems="center">
                  <Typography variant="subtitle1" fontWeight="bold">
                    {toolCall.function.name}
                  </Typography>
                  <Chip 
                    size="small" 
                    label={isSuccess ? "Success" : toolResult?.error ? "Error" : "Pending"} 
                    color={isSuccess ? "success" : toolResult?.error ? "error" : "warning"}
                    sx={{ ml: 1 }}
                  />
                </Box>
              }
              action={
                <Box>
                  {onRerunTool && (
                    <Tooltip title="Rerun tool">
                      <IconButton 
                        size="small" 
                        onClick={(e) => {
                          e.stopPropagation();
                          onRerunTool(toolCall);
                        }}
                      >
                        <RefreshIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  <IconButton
                    onClick={() => handleExpandTool(toolCall.id)}
                    aria-expanded={expandedTool === toolCall.id}
                    aria-label="show more"
                    size="small"
                  >
                    <ExpandMoreIcon />
                  </IconButton>
                </Box>
              }
              sx={{ py: 1 }}
            />
            <Collapse in={expandedTool === toolCall.id}>
              <CardContent sx={{ pt: 0 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Arguments:
                </Typography>
                <Paper 
                  variant="outlined" 
                  sx={{ 
                    p: 1, 
                    my: 1, 
                    bgcolor: 'background.default',
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                    overflowX: 'auto'
                  }}
                >
                  <pre style={{ margin: 0 }}>
                    {JSON.stringify(JSON.parse(toolCall.function.arguments), null, 2)}
                  </pre>
                </Paper>

                {toolResult && (
                  <>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
                      {toolResult.error ? 'Error:' : 'Result:'}
                    </Typography>
                    <Paper 
                      variant="outlined" 
                      sx={{ 
                        p: 1, 
                        my: 1, 
                        bgcolor: toolResult.error ? '#ffebee' : 'background.default',
                        fontFamily: 'monospace',
                        fontSize: '0.875rem',
                        overflowX: 'auto'
                      }}
                    >
                      <pre style={{ margin: 0 }}>
                        {toolResult.error 
                          ? toolResult.error 
                          : typeof toolResult.content === 'string' 
                            ? toolResult.content 
                            : JSON.stringify(toolResult.content, null, 2)
                        }
                      </pre>
                    </Paper>
                  </>
                )}
              </CardContent>
            </Collapse>
          </Card>
        );
      })}
    </Box>
  );
};

export default ToolUsageDisplay;