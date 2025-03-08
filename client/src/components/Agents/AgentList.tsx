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
  InputAdornment
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as DuplicateIcon,
  Search as SearchIcon,
  Add as AddIcon,
  Visibility as VisibilityIcon
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
            (agent.id || agent.agent_id || '').toLowerCase().includes(lowercasedSearch) ||
            agent.instructions.toLowerCase().includes(lowercasedSearch) ||
            agent.model.toLowerCase().includes(lowercasedSearch)
        )
      );
    }
  }, [agents, searchTerm]);

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
        <Typography variant="h6">Agents</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={onCreateNew}
        >
          Create New Agent
        </Button>
      </Box>

      <Box mb={2}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search agents..."
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
              <TableCell>Model</TableCell>
              <TableCell>Instructions</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAgents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  {searchTerm ? 'No agents match your search' : 'No agents available'}
                </TableCell>
              </TableRow>
            ) : (
              filteredAgents
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((agent) => (
                  <TableRow key={agent.agent_id || agent.id}>
                    <TableCell>{agent.agent_id || agent.id}</TableCell>
                    <TableCell>{agent.model}</TableCell>
                    <TableCell>
                      {agent.instructions.length > 100
                        ? `${agent.instructions.substring(0, 100)}...`
                        : agent.instructions}
                    </TableCell>
                    <TableCell>
                      {new Date(agent.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Details">
                        <IconButton 
                          onClick={() => navigate(`/agents/${agent.agent_id || agent.id}`)} 
                          size="small"
                          color="primary"
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton onClick={() => onEdit(agent)} size="small">
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Duplicate">
                        <IconButton onClick={() => onDuplicate(agent)} size="small">
                          <DuplicateIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton onClick={() => onDelete(agent)} size="small" color="error">
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
          count={filteredAgents.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
    </Box>
  );
};

export default AgentList;