import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  CardHeader,
  Collapse,
  IconButton,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tooltip,
  CircularProgress,
  Grid
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Build as BuildIcon,
  History as HistoryIcon,
  CalendarToday as CalendarIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { ToolCall, ToolResult } from '../../services/api';

interface ToolUsageHistoryProps {
  agentId: string;
  isLoading?: boolean;
}

// Mock data for tool usage history
const mockToolUsageHistory = [
  {
    date: '2023-06-15',
    sessions: [
      {
        sessionId: 'session-1',
        sessionName: 'Weather Session',
        toolCalls: [
          {
            id: 'call-1',
            type: 'function',
            function: {
              name: 'get_weather',
              arguments: JSON.stringify({
                location: 'New York',
                unit: 'celsius'
              })
            },
            timestamp: '2023-06-15T10:30:00Z',
            result: {
              tool_call_id: 'call-1',
              content: {
                temperature: 22,
                unit: 'celsius',
                description: 'Partly cloudy',
                location: 'New York, NY'
              }
            }
          },
          {
            id: 'call-2',
            type: 'function',
            function: {
              name: 'get_weather',
              arguments: JSON.stringify({
                location: 'San Francisco',
                unit: 'celsius'
              })
            },
            timestamp: '2023-06-15T10:35:00Z',
            result: {
              tool_call_id: 'call-2',
              content: {
                temperature: 18,
                unit: 'celsius',
                description: 'Foggy',
                location: 'San Francisco, CA'
              }
            }
          }
        ]
      }
    ]
  },
  {
    date: '2023-06-14',
    sessions: [
      {
        sessionId: 'session-2',
        sessionName: 'Search Session',
        toolCalls: [
          {
            id: 'call-3',
            type: 'function',
            function: {
              name: 'web_search',
              arguments: JSON.stringify({
                query: 'latest AI developments'
              })
            },
            timestamp: '2023-06-14T14:20:00Z',
            result: {
              tool_call_id: 'call-3',
              content: {
                results: [
                  { title: 'AI News 1', url: 'https://example.com/ai-news-1' },
                  { title: 'AI News 2', url: 'https://example.com/ai-news-2' }
                ]
              }
            }
          }
        ]
      },
      {
        sessionId: 'session-3',
        sessionName: 'Calculator Session',
        toolCalls: [
          {
            id: 'call-4',
            type: 'function',
            function: {
              name: 'calculator',
              arguments: JSON.stringify({
                expression: '(15 * 3) + 7'
              })
            },
            timestamp: '2023-06-14T16:45:00Z',
            result: {
              tool_call_id: 'call-4',
              content: {
                result: 52
              }
            }
          },
          {
            id: 'call-5',
            type: 'function',
            function: {
              name: 'calculator',
              arguments: JSON.stringify({
                expression: 'sqrt(144)'
              })
            },
            timestamp: '2023-06-14T16:50:00Z',
            result: {
              tool_call_id: 'call-5',
              error: 'Invalid expression format'
            }
          }
        ]
      }
    ]
  }
];

const ToolUsageHistory: React.FC<ToolUsageHistoryProps> = ({ agentId, isLoading = false }) => {
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [expandedTool, setExpandedTool] = useState<string | null>(null);

  const handleExpandDate = (date: string) => {
    setExpandedDate(expandedDate === date ? null : date);
  };

  const handleExpandSession = (sessionId: string) => {
    setExpandedSession(expandedSession === sessionId ? null : sessionId);
  };

  const handleExpandTool = (toolId: string) => {
    setExpandedTool(expandedTool === toolId ? null : toolId);
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="200px">
        <CircularProgress />
      </Box>
    );
  }

  // In a real implementation, you would fetch this data from the API
  const toolUsageHistory = mockToolUsageHistory;

  if (toolUsageHistory.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          No tool usage history found for this agent.
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Tool Usage History
      </Typography>
      
      <List>
        {toolUsageHistory.map((dateGroup) => (
          <Paper key={dateGroup.date} sx={{ mb: 2 }}>
            <ListItem
              onClick={() => handleExpandDate(dateGroup.date)}
              sx={{ bgcolor: 'background.paper', cursor: 'pointer' }}
            >
              <ListItemIcon>
                <CalendarIcon />
              </ListItemIcon>
              <ListItemText 
                primary={new Date(dateGroup.date).toLocaleDateString(undefined, { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })} 
                secondary={`${dateGroup.sessions.length} sessions, ${dateGroup.sessions.map(
                  (session: any) => session.toolCalls.length
                ).reduce((a: number, b: number) => a + b, 0)} tool calls`}
              />
              <IconButton
                edge="end"
                onClick={(e) => {
                  e.stopPropagation();
                  handleExpandDate(dateGroup.date);
                }}
              >
                <ExpandMoreIcon 
                  sx={{ 
                    transform: expandedDate === dateGroup.date ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s'
                  }} 
                />
              </IconButton>
            </ListItem>
            
            <Collapse in={expandedDate === dateGroup.date}>
              <Box sx={{ pl: 4, pr: 2, pb: 2 }}>
                {dateGroup.sessions.map((session) => (
                  <Card key={session.sessionId} variant="outlined" sx={{ mb: 2, mt: 2 }}>
                    <CardHeader
                      title={
                        <Box display="flex" alignItems="center">
                          <HistoryIcon sx={{ mr: 1 }} />
                          <Typography variant="subtitle1">
                            {session.sessionName}
                          </Typography>
                        </Box>
                      }
                      action={
                        <IconButton
                          onClick={() => handleExpandSession(session.sessionId)}
                        >
                          <ExpandMoreIcon 
                            sx={{ 
                              transform: expandedSession === session.sessionId ? 'rotate(180deg)' : 'rotate(0deg)',
                              transition: 'transform 0.3s'
                            }} 
                          />
                        </IconButton>
                      }
                    />
                    
                    <Collapse in={expandedSession === session.sessionId}>
                      <CardContent>
                        <List>
                          {session.toolCalls.map((toolCall: any) => {
                            const isSuccess = toolCall.result && !toolCall.result.error;
                            
                            return (
                              <React.Fragment key={toolCall.id}>
                                <ListItem 
                                  sx={{ 
                                    bgcolor: 'background.default',
                                    mb: 1,
                                    borderRadius: 1,
                                    borderLeft: isSuccess 
                                      ? '4px solid #4caf50' 
                                      : toolCall.result?.error 
                                        ? '4px solid #f44336' 
                                        : '4px solid #ff9800'
                                  }}
                                >
                                  <ListItemIcon>
                                    <BuildIcon color={isSuccess ? "success" : toolCall.result?.error ? "error" : "warning"} />
                                  </ListItemIcon>
                                  <ListItemText
                                    primary={
                                      <Box display="flex" alignItems="center">
                                        <Typography variant="subtitle2" fontWeight="bold">
                                          {toolCall.function.name}
                                        </Typography>
                                        <Chip 
                                          size="small" 
                                          label={isSuccess ? "Success" : toolCall.result?.error ? "Error" : "Pending"} 
                                          color={isSuccess ? "success" : toolCall.result?.error ? "error" : "warning"}
                                          sx={{ ml: 1 }}
                                        />
                                      </Box>
                                    }
                                    secondary={
                                      <Typography variant="caption" color="text.secondary">
                                        {new Date(toolCall.timestamp).toLocaleTimeString()}
                                      </Typography>
                                    }
                                  />
                                  <IconButton
                                    edge="end"
                                    onClick={() => handleExpandTool(toolCall.id)}
                                  >
                                    <ExpandMoreIcon 
                                      sx={{ 
                                        transform: expandedTool === toolCall.id ? 'rotate(180deg)' : 'rotate(0deg)',
                                        transition: 'transform 0.3s'
                                      }} 
                                    />
                                  </IconButton>
                                </ListItem>
                                
                                <Collapse in={expandedTool === toolCall.id}>
                                  <Box sx={{ pl: 4, pr: 2, pb: 2 }}>
                                    <Grid container spacing={2}>
                                      <Grid item xs={12} md={6}>
                                        <Typography variant="subtitle2" color="text.secondary">
                                          Arguments:
                                        </Typography>
                                        <Paper 
                                          variant="outlined" 
                                          sx={{ 
                                            p: 1, 
                                            my: 1, 
                                            bgcolor: 'background.paper',
                                            fontFamily: 'monospace',
                                            fontSize: '0.875rem',
                                            overflowX: 'auto'
                                          }}
                                        >
                                          <pre style={{ margin: 0 }}>
                                            {JSON.stringify(JSON.parse(toolCall.function.arguments), null, 2)}
                                          </pre>
                                        </Paper>
                                      </Grid>
                                      
                                      <Grid item xs={12} md={6}>
                                        <Typography variant="subtitle2" color="text.secondary">
                                          {toolCall.result?.error ? 'Error:' : 'Result:'}
                                        </Typography>
                                        <Paper 
                                          variant="outlined" 
                                          sx={{ 
                                            p: 1, 
                                            my: 1, 
                                            bgcolor: toolCall.result?.error ? '#ffebee' : 'background.paper',
                                            fontFamily: 'monospace',
                                            fontSize: '0.875rem',
                                            overflowX: 'auto'
                                          }}
                                        >
                                          <pre style={{ margin: 0 }}>
                                            {toolCall.result?.error 
                                              ? toolCall.result.error 
                                              : typeof toolCall.result?.content === 'string' 
                                                ? toolCall.result.content 
                                                : JSON.stringify(toolCall.result?.content, null, 2)
                                            }
                                          </pre>
                                        </Paper>
                                      </Grid>
                                    </Grid>
                                  </Box>
                                </Collapse>
                              </React.Fragment>
                            );
                          })}
                        </List>
                      </CardContent>
                    </Collapse>
                  </Card>
                ))}
              </Box>
            </Collapse>
          </Paper>
        ))}
      </List>
    </Box>
  );
};

export default ToolUsageHistory;