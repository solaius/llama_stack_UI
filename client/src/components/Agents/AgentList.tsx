import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  CircularProgress,
  Button,
  TablePagination,
  TextField,
  InputAdornment,
  Chip,
  Pagination,
  Stack,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  useTheme,
  useMediaQuery,
  SelectChangeEvent
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as DuplicateIcon,
  Search as SearchIcon,
  Add as AddIcon,
  Visibility as VisibilityIcon,
  Chat as ChatIcon,
  ContentCopy as ContentCopyIcon,
  Description as DescriptionIcon,
  Build as BuildIcon,
  NavigateNext as NavigateNextIcon,
  NavigateBefore as NavigateBeforeIcon,
  FirstPage as FirstPageIcon,
  LastPage as LastPageIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Agent } from '../../services/api';

interface AgentListProps {
  agents: Agent[];
  loading: boolean;
  onEdit: (agent: Agent) => void;
  onDelete: (agent: Agent) => void;
  onDuplicate: (agent: Agent) => void;
  onCreateNew: () => void;
}

const AgentList: React.FC<AgentListProps> = ({
  agents,
  loading,
  onEdit,
  onDelete,
  onDuplicate,
  onCreateNew
}) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredAgents, setFilteredAgents] = useState<Agent[]>(agents);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredAgents(agents);
    } else {
      const lowercasedSearch = searchTerm.toLowerCase();
      setFilteredAgents(
        agents.filter(
          (agent) =>
            (agent.name || '').toLowerCase().includes(lowercasedSearch) ||
            (agent.id || agent.agent_id || '').toLowerCase().includes(lowercasedSearch) ||
            (agent.instructions || '').toLowerCase().includes(lowercasedSearch) ||
            (agent.model || '').toLowerCase().includes(lowercasedSearch)
        )
      );
    }
  }, [agents, searchTerm]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage - 1); // Pagination component is 1-indexed, but our state is 0-indexed
  };

  const handleChangeRowsPerPage = (event: SelectChangeEvent) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Calculate pagination values
  const pageCount = Math.ceil(filteredAgents.length / rowsPerPage);
  const startIndex = page * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, filteredAgents.length);
  const currentPageItems = filteredAgents.slice(startIndex, endIndex);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography 
          variant="h5" 
          fontWeight="bold" 
          sx={{ color: (theme) => theme.palette.mode === 'dark' ? 'white' : 'text.primary' }}
        >
          Agents
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={onCreateNew}
          sx={{ 
            borderRadius: 2,
            px: 3,
            py: 1,
            boxShadow: 2,
            transition: 'all 0.2s',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: 3
            }
          }}
        >
          Create New Agent
        </Button>
      </Box>

      <Box mb={3}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search agents by name, ID, or system prompt..."
          value={searchTerm}
          onChange={handleSearchChange}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              transition: 'all 0.2s',
              '&:hover': {
                boxShadow: 1
              },
              '&.Mui-focused': {
                boxShadow: 2
              }
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="primary" />
              </InputAdornment>
            )
          }}
        />
      </Box>

      <TableContainer component={Paper} sx={{ boxShadow: 3, borderRadius: 2 }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: (theme) => theme.palette.primary.main }}>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Name</TableCell>
              <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>ID</TableCell>
              <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>System Prompt</TableCell>
              <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Tools</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Created</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Created By</TableCell>
              <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAgents.length === 0 ? (
              <TableRow>
                <TableCell 
                  colSpan={7} 
                  align="center" 
                  sx={{ 
                    py: 5, 
                    typography: 'subtitle1', 
                    color: 'text.secondary',
                    fontStyle: 'italic'
                  }}
                >
                  {searchTerm ? 'No agents match your search' : 'No agents available'}
                </TableCell>
              </TableRow>
            ) : (
              currentPageItems.map((agent, index) => (
                  <TableRow 
                    key={agent.agent_id || agent.id}
                    sx={{ 
                      '&:nth-of-type(odd)': { 
                        backgroundColor: (theme) => 
                          theme.palette.mode === 'dark' 
                            ? 'rgba(255, 255, 255, 0.05)' 
                            : theme.palette.action.hover 
                      },
                      '&:hover': { 
                        backgroundColor: (theme) => 
                          theme.palette.mode === 'dark' 
                            ? 'rgba(255, 255, 255, 0.1)' 
                            : theme.palette.action.selected 
                      },
                      transition: 'background-color 0.2s ease'
                    }}
                  >
                    <TableCell sx={{ fontWeight: 'medium' }}>{agent.name || 'Unnamed Agent'}</TableCell>
                    <TableCell align="center">
                      <Tooltip title={`Click to copy: ${agent.agent_id || agent.id}`}>
                        <IconButton 
                          onClick={() => {
                            navigator.clipboard.writeText(agent.agent_id || agent.id);
                          }} 
                          size="small"
                          sx={{ 
                            bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'grey.200',
                            color: (theme) => theme.palette.mode === 'dark' ? 'white' : 'inherit',
                            transition: 'all 0.2s',
                            '&:hover': { 
                              bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'grey.300',
                              transform: 'scale(1.1)'
                            }
                          }}
                        >
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip 
                        title={
                          <Box sx={{ p: 1, maxWidth: 300 }}>
                            <Typography variant="subtitle2" gutterBottom>System Prompt:</Typography>
                            <Typography variant="body2">{agent.instructions || 'No system prompt provided'}</Typography>
                          </Box>
                        }
                      >
                        <IconButton 
                          size="small"
                          sx={{ 
                            bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'grey.200',
                            color: (theme) => theme.palette.mode === 'dark' ? 'white' : 'inherit',
                            transition: 'all 0.2s',
                            '&:hover': { 
                              bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'grey.300',
                              transform: 'scale(1.1)'
                            }
                          }}
                        >
                          <DescriptionIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="center">
                      {((agent.config?.toolgroups && agent.config.toolgroups.length > 0) || 
                        (agent.config?.client_tools && agent.config.client_tools.length > 0)) ? (
                        <Tooltip 
                          title={
                            <Box sx={{ p: 1, maxWidth: 300 }}>
                              <Typography variant="subtitle2" gutterBottom>Tools:</Typography>
                              {agent.config?.toolgroups && agent.config.toolgroups.length > 0 && (
                                <>
                                  <Typography variant="body2" fontWeight="medium" sx={{ mt: 1 }}>Tool Groups:</Typography>
                                  <ul style={{ margin: 0, paddingLeft: 16 }}>
                                    {agent.config.toolgroups.map((tool, idx) => (
                                      <li key={idx}>
                                        <Typography variant="body2">
                                          {typeof tool === 'string' ? tool : tool.name}
                                        </Typography>
                                      </li>
                                    ))}
                                  </ul>
                                </>
                              )}
                              
                              {agent.config?.client_tools && agent.config.client_tools.length > 0 && (
                                <>
                                  <Typography variant="body2" fontWeight="medium" sx={{ mt: 1 }}>Client Tools:</Typography>
                                  <ul style={{ margin: 0, paddingLeft: 16 }}>
                                    {agent.config.client_tools.map((tool, idx) => (
                                      <li key={idx}>
                                        <Typography variant="body2">
                                          {tool.tool_name}
                                        </Typography>
                                      </li>
                                    ))}
                                  </ul>
                                </>
                              )}
                            </Box>
                          }
                        >
                          <IconButton 
                            size="small"
                            sx={{ 
                              bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'grey.200',
                              color: (theme) => theme.palette.mode === 'dark' ? 'white' : 'inherit',
                              transition: 'all 0.2s',
                              '&:hover': { 
                                bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'grey.300',
                                transform: 'scale(1.1)'
                              }
                            }}
                          >
                            <BuildIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <IconButton 
                          size="small"
                          disabled
                          sx={{ 
                            bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'grey.100',
                            color: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'grey.400',
                          }}
                        >
                          <BuildIcon fontSize="small" />
                        </IconButton>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={new Date(agent.created_at).toLocaleDateString()} 
                        size="small"
                        variant="outlined"
                        sx={{ 
                          fontWeight: 'medium',
                          borderRadius: 1,
                          bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.05)',
                          color: (theme) => theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.87)' : 'text.primary'
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={agent.created_by || 'System'} 
                        size="small"
                        variant="outlined"
                        sx={{ 
                          fontWeight: 'medium',
                          borderRadius: 1,
                          bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.05)',
                          color: (theme) => theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.87)' : 'text.primary'
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box 
                        display="flex" 
                        justifyContent="center" 
                        gap={1}
                        sx={{
                          '& .MuiIconButton-root': {
                            transition: 'transform 0.2s, background-color 0.2s',
                            '&:hover': {
                              transform: 'scale(1.15)',
                            }
                          }
                        }}
                      >
                        <Tooltip title="Chat with Agent">
                          <IconButton 
                            onClick={() => {
                              // Create a new session and navigate to chat
                              const sessionId = `session-${Date.now()}`;
                              navigate(`/chat/${agent.agent_id || agent.id}/${sessionId}`);
                            }} 
                            size="small"
                            color="success"
                            sx={{ 
                              bgcolor: 'success.light', 
                              color: 'white',
                              '&:hover': { bgcolor: 'success.main' } 
                            }}
                          >
                            <ChatIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="View Details">
                          <IconButton 
                            onClick={() => navigate(`/agents/${agent.agent_id || agent.id}`)} 
                            size="small"
                            color="primary"
                            sx={{ 
                              bgcolor: 'primary.light', 
                              color: 'white',
                              '&:hover': { bgcolor: 'primary.main' } 
                            }}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton 
                            onClick={() => onEdit(agent)} 
                            size="small"
                            sx={{ 
                              bgcolor: 'info.light', 
                              color: 'white',
                              '&:hover': { bgcolor: 'info.main' } 
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Duplicate">
                          <IconButton 
                            onClick={() => onDuplicate(agent)} 
                            size="small"
                            sx={{ 
                              bgcolor: 'warning.light', 
                              color: 'white',
                              '&:hover': { bgcolor: 'warning.main' } 
                            }}
                          >
                            <DuplicateIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton 
                            onClick={() => onDelete(agent)} 
                            size="small" 
                            color="error"
                            sx={{ 
                              bgcolor: 'error.light', 
                              color: 'white',
                              '&:hover': { bgcolor: 'error.main' } 
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            p: 2,
            borderTop: 1, 
            borderColor: 'divider',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? 2 : 0
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary" fontWeight="medium">
              Showing {startIndex + 1}-{endIndex} of {filteredAgents.length} agents
            </Typography>
            
            <FormControl size="small" variant="outlined" sx={{ minWidth: 80 }}>
              <Select
                value={rowsPerPage.toString()}
                onChange={handleChangeRowsPerPage}
                sx={{ 
                  height: 32,
                  '& .MuiSelect-select': { 
                    py: 0.5,
                    px: 1.5
                  }
                }}
              >
                {[5, 10, 25, 50].map((option) => (
                  <MenuItem key={option} value={option}>
                    {option} per page
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          
          <Stack direction="row" spacing={1} alignItems="center">
            <IconButton 
              size="small" 
              disabled={page === 0}
              onClick={() => setPage(0)}
              sx={{ 
                bgcolor: page === 0 ? 'transparent' : (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.04)',
                '&:hover': { 
                  bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.08)'
                }
              }}
            >
              <FirstPageIcon fontSize="small" />
            </IconButton>
            
            <IconButton 
              size="small" 
              disabled={page === 0}
              onClick={() => setPage(Math.max(0, page - 1))}
              sx={{ 
                bgcolor: page === 0 ? 'transparent' : (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.04)',
                '&:hover': { 
                  bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.08)'
                }
              }}
            >
              <NavigateBeforeIcon fontSize="small" />
            </IconButton>
            
            <Pagination
              count={pageCount}
              page={page + 1} // Pagination is 1-indexed
              onChange={handleChangePage}
              size="small"
              siblingCount={isMobile ? 0 : 1}
              boundaryCount={isMobile ? 1 : 2}
              showFirstButton={false}
              showLastButton={false}
              hidePrevButton
              hideNextButton
              sx={{
                '& .MuiPaginationItem-root': {
                  borderRadius: 1,
                  fontWeight: 'medium',
                  '&.Mui-selected': {
                    fontWeight: 'bold',
                    bgcolor: (theme) => theme.palette.primary.main,
                    color: 'white',
                    '&:hover': {
                      bgcolor: (theme) => theme.palette.primary.dark,
                    }
                  }
                }
              }}
            />
            
            <IconButton 
              size="small" 
              disabled={page >= pageCount - 1}
              onClick={() => setPage(Math.min(pageCount - 1, page + 1))}
              sx={{ 
                bgcolor: page >= pageCount - 1 ? 'transparent' : (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.04)',
                '&:hover': { 
                  bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.08)'
                }
              }}
            >
              <NavigateNextIcon fontSize="small" />
            </IconButton>
            
            <IconButton 
              size="small" 
              disabled={page >= pageCount - 1}
              onClick={() => setPage(pageCount - 1)}
              sx={{ 
                bgcolor: page >= pageCount - 1 ? 'transparent' : (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.04)',
                '&:hover': { 
                  bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.08)'
                }
              }}
            >
              <LastPageIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Box>
      </TableContainer>
    </Box>
  );
};

export default AgentList;