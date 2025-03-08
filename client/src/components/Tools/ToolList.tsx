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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Tools</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={onCreateNew}
        >
          Create New Tool
        </Button>
      </Box>

      <Box mb={3}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Filters
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={2}>
            <TextField
              placeholder="Search tools..."
              value={searchTerm}
              onChange={handleSearchChange}
              sx={{ flexGrow: 1, minWidth: '200px' }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
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
                input={<OutlinedInput label="Provider" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(selected as string[]).map((value) => (
                      <Chip key={value} label={value} size="small" />
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
                input={<OutlinedInput label="Tool Group" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(selected as string[]).map((value) => (
                      <Chip key={value} label={getToolGroupName(value)} size="small" />
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

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Provider</TableCell>
              <TableCell>Tool Group</TableCell>
              <TableCell>Parameters</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTools.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  {searchTerm || providerFilter.length > 0 || toolGroupFilter.length > 0
                    ? 'No tools match your filters'
                    : 'No tools available'}
                </TableCell>
              </TableRow>
            ) : (
              filteredTools
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((tool) => (
                  <TableRow key={tool.identifier}>
                    <TableCell>{tool.identifier}</TableCell>
                    <TableCell>
                      {tool.description.length > 100
                        ? `${tool.description.substring(0, 100)}...`
                        : tool.description}
                    </TableCell>
                    <TableCell>
                      <Chip label={tool.provider_id} size="small" />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={getToolGroupName(tool.toolgroup_id)} 
                        size="small" 
                        color="secondary" 
                      />
                    </TableCell>
                    <TableCell>
                      {tool.parameters.length}
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View & Test">
                        <IconButton onClick={() => onView(tool)} size="small">
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton onClick={() => onEdit(tool)} size="small" color="primary">
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton onClick={() => onDelete(tool)} size="small" color="error">
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
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
        />
      </TableContainer>
    </Box>
  );
};

export default ToolList;