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
  Visibility as ViewIcon
} from '@mui/icons-material';
import { ToolGroup } from '../../services/api';

interface ToolGroupListProps {
  toolGroups: ToolGroup[];
  loading: boolean;
  onDelete: (toolGroup: ToolGroup) => void;
  onCreateNew: () => void;
  onView: (toolGroup: ToolGroup) => void;
}

const ToolGroupList: React.FC<ToolGroupListProps> = ({
  toolGroups,
  loading,
  onDelete,
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Tool Groups</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={onCreateNew}
        >
          Create New Tool Group
        </Button>
      </Box>

      <Box mb={2}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search tool groups..."
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
        />
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Tools</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredToolGroups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  {searchTerm ? 'No tool groups match your search' : 'No tool groups available'}
                </TableCell>
              </TableRow>
            ) : (
              filteredToolGroups
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((toolGroup) => (
                  <TableRow key={toolGroup.identifier}>
                    <TableCell>{toolGroup.identifier}</TableCell>
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
                            <Chip key={tool} label={tool} size="small" />
                          ))}
                          {toolGroup.tools.length > 3 && (
                            <Chip
                              label={`+${toolGroup.tools.length - 3} more`}
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No tools
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Details">
                        <IconButton onClick={() => onView(toolGroup)} size="small">
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton onClick={() => onDelete(toolGroup)} size="small" color="error">
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
          count={filteredToolGroups.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
    </Box>
  );
};

export default ToolGroupList;