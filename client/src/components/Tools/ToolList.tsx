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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  OutlinedInput,
  SelectChangeEvent
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { Tool, ToolGroup } from '../../services/api';

interface ToolListProps {
  tools: Tool[];
  toolGroups: ToolGroup[];
  loading: boolean;
  onDelete: (tool: Tool) => void;
  onEdit: (tool: Tool) => void;
  onCreateNew: () => void;
  onView: (tool: Tool) => void;
}

const ToolList: React.FC<ToolListProps> = ({
  tools,
  toolGroups,
  loading,
  onDelete,
  onEdit,
  onCreateNew,
  onView
}) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredTools, setFilteredTools] = useState<Tool[]>(tools);
  const [providerFilter, setProviderFilter] = useState<string[]>([]);
  const [toolGroupFilter, setToolGroupFilter] = useState<string[]>([]);

  // Get unique providers and tool groups for filtering
  const uniqueProviders = Array.from(new Set(tools.map(tool => tool.provider_id)));
  const uniqueToolGroups = Array.from(new Set(tools.map(tool => tool.toolgroup_id)));

  useEffect(() => {
    let filtered = [...tools];
    
    // Apply search filter
    if (searchTerm.trim() !== '') {
      const lowercasedSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(
        tool =>
          tool.identifier.toLowerCase().includes(lowercasedSearch) ||
          tool.description.toLowerCase().includes(lowercasedSearch)
      );
    }
    
    // Apply provider filter
    if (providerFilter.length > 0) {
      filtered = filtered.filter(tool => providerFilter.includes(tool.provider_id));
    }
    
    // Apply tool group filter
    if (toolGroupFilter.length > 0) {
      filtered = filtered.filter(tool => toolGroupFilter.includes(tool.toolgroup_id));
    }
    
    setFilteredTools(filtered);
    setPage(0); // Reset to first page when filters change
  }, [tools, searchTerm, providerFilter, toolGroupFilter]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleProviderFilterChange = (event: SelectChangeEvent<string[]>) => {
    setProviderFilter(event.target.value as string[]);
  };

  const handleToolGroupFilterChange = (event: SelectChangeEvent<string[]>) => {
    setToolGroupFilter(event.target.value as string[]);
  };

  // Get tool group name from ID
  const getToolGroupName = (id: string) => {
    const toolGroup = toolGroups.find(tg => tg.identifier === id);
    return toolGroup?.name || id;
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
          Tools
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
          Create New Tool
        </Button>
      </Box>

      <Box mb={3}>
        <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 2 }}>
          <Typography 
            variant="subtitle1" 
            fontWeight="bold" 
            gutterBottom 
            sx={{ color: (theme) => theme.palette.mode === 'dark' ? 'white' : 'text.primary' }}
          >
            Filters
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={2}>
            <TextField
              placeholder="Search tools by ID or description..."
              value={searchTerm}
              onChange={handleSearchChange}
              sx={{ 
                flexGrow: 1, 
                minWidth: '200px',
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
            
            <FormControl sx={{ minWidth: '200px', flexGrow: 1 }}>
              <InputLabel id="provider-filter-label">Provider</InputLabel>
              <Select
                labelId="provider-filter-label"
                multiple
                value={providerFilter}
                onChange={handleProviderFilterChange}
                input={<OutlinedInput 
                  label="Provider" 
                  sx={{ 
                    borderRadius: 2,
                    '&:hover': { boxShadow: 1 },
                    '&.Mui-focused': { boxShadow: 2 }
                  }} 
                />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(selected as string[]).map((value) => (
                      <Chip key={value} label={value} size="small" color="primary" variant="outlined" />
                    ))}
                  </Box>
                )}
              >
                {uniqueProviders.map((provider) => (
                  <MenuItem key={provider} value={provider}>
                    {provider}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl sx={{ minWidth: '200px', flexGrow: 1 }}>
              <InputLabel id="toolgroup-filter-label">Tool Group</InputLabel>
              <Select
                labelId="toolgroup-filter-label"
                multiple
                value={toolGroupFilter}
                onChange={handleToolGroupFilterChange}
                input={<OutlinedInput 
                  label="Tool Group" 
                  sx={{ 
                    borderRadius: 2,
                    '&:hover': { boxShadow: 1 },
                    '&.Mui-focused': { boxShadow: 2 }
                  }} 
                />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(selected as string[]).map((value) => (
                      <Chip key={value} label={getToolGroupName(value)} size="small" color="secondary" variant="outlined" />
                    ))}
                  </Box>
                )}
              >
                {uniqueToolGroups.map((toolGroupId) => (
                  <MenuItem key={toolGroupId} value={toolGroupId}>
                    {getToolGroupName(toolGroupId)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Paper>
      </Box>

      <TableContainer component={Paper} sx={{ boxShadow: 3, borderRadius: 2 }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: (theme) => theme.palette.primary.main }}>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>ID</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Description</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Provider</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Tool Group</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Parameters</TableCell>
              <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTools.length === 0 ? (
              <TableRow>
                <TableCell 
                  colSpan={6} 
                  align="center" 
                  sx={{ 
                    py: 5, 
                    typography: 'subtitle1', 
                    color: 'text.secondary',
                    fontStyle: 'italic'
                  }}
                >
                  {searchTerm || providerFilter.length > 0 || toolGroupFilter.length > 0
                    ? 'No tools match your filters'
                    : 'No tools available'}
                </TableCell>
              </TableRow>
            ) : (
              filteredTools
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((tool, index) => (
                  <TableRow 
                    key={tool.identifier}
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
                    <TableCell sx={{ fontWeight: 'medium' }}>{tool.identifier}</TableCell>
                    <TableCell>
                      {tool.description.length > 100
                        ? `${tool.description.substring(0, 100)}...`
                        : tool.description}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={tool.provider_id} 
                        size="small" 
                        sx={{ fontWeight: 'medium' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={getToolGroupName(tool.toolgroup_id)} 
                        size="small" 
                        color="secondary" 
                        sx={{ fontWeight: 'medium' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={tool.parameters.length} 
                        size="small" 
                        variant="outlined"
                        sx={{ fontWeight: 'medium' }}
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
                        <Tooltip title="View & Test">
                          <IconButton 
                            onClick={() => onView(tool)} 
                            size="small"
                            sx={{ 
                              bgcolor: 'primary.light', 
                              color: 'white',
                              '&:hover': { bgcolor: 'primary.main' } 
                            }}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton 
                            onClick={() => onEdit(tool)} 
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
                        <Tooltip title="Delete">
                          <IconButton 
                            onClick={() => onDelete(tool)} 
                            size="small" 
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
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredTools.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{ 
            borderTop: 1, 
            borderColor: 'divider',
            '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
              fontWeight: 'medium'
            }
          }}
        />
      </TableContainer>
    </Box>
  );
};

export default ToolList;