import React, { useState } from 'react';
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
  Chip
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Search as SearchIcon,
  Add as AddIcon,
  Visibility as ViewIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { ToolGroup } from '../../services/api';

interface ToolGroupListProps {
  toolGroups: ToolGroup[];
  loading: boolean;
  onDelete: (toolGroup: ToolGroup) => void;
  onEdit: (toolGroup: ToolGroup) => void;
  onCreateNew: () => void;
  onView: (toolGroup: ToolGroup) => void;
}

const ToolGroupList: React.FC<ToolGroupListProps> = ({
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
  const [filteredToolGroups, setFilteredToolGroups] = useState<ToolGroup[]>(toolGroups);

  React.useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredToolGroups(toolGroups);
    } else {
      const lowercasedSearch = searchTerm.toLowerCase();
      setFilteredToolGroups(
        toolGroups.filter(
          (toolGroup) =>
            toolGroup.identifier.toLowerCase().includes(lowercasedSearch) ||
            (toolGroup.name?.toLowerCase() || '').includes(lowercasedSearch) ||
            (toolGroup.description?.toLowerCase() || '').includes(lowercasedSearch)
        )
      );
    }
  }, [toolGroups, searchTerm]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

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
          Tool Groups
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
          Create New Tool Group
        </Button>
      </Box>

      <Box mb={3}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search tool groups by ID, name, or description..."
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
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>ID</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Name</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Description</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Tools</TableCell>
              <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredToolGroups.length === 0 ? (
              <TableRow>
                <TableCell 
                  colSpan={5} 
                  align="center" 
                  sx={{ 
                    py: 5, 
                    typography: 'subtitle1', 
                    color: 'text.secondary',
                    fontStyle: 'italic'
                  }}
                >
                  {searchTerm ? 'No tool groups match your search' : 'No tool groups available'}
                </TableCell>
              </TableRow>
            ) : (
              filteredToolGroups
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((toolGroup, index) => (
                  <TableRow 
                    key={toolGroup.identifier}
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
                    <TableCell sx={{ fontWeight: 'medium' }}>{toolGroup.identifier}</TableCell>
                    <TableCell>{toolGroup.name || toolGroup.identifier}</TableCell>
                    <TableCell>
                      {toolGroup.description && toolGroup.description.length > 100
                        ? `${toolGroup.description.substring(0, 100)}...`
                        : (toolGroup.description || 'No description available')}
                    </TableCell>
                    <TableCell>
                      {toolGroup.tools && toolGroup.tools.length > 0 ? (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {toolGroup.tools.slice(0, 3).map((tool) => (
                            <Chip 
                              key={tool} 
                              label={tool} 
                              size="small" 
                              sx={{ fontWeight: 'medium' }}
                            />
                          ))}
                          {toolGroup.tools.length > 3 && (
                            <Chip
                              label={`+${toolGroup.tools.length - 3} more`}
                              size="small"
                              variant="outlined"
                              sx={{ fontWeight: 'medium' }}
                            />
                          )}
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No tools
                        </Typography>
                      )}
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
                        <Tooltip title="View Details">
                          <IconButton 
                            onClick={() => onView(toolGroup)} 
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
                            onClick={() => onEdit(toolGroup)} 
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
                            onClick={() => onDelete(toolGroup)} 
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
          count={filteredToolGroups.length}
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

export default ToolGroupList;