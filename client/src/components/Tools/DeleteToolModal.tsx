import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import { Tool } from '../../services/api';

interface DeleteToolModalProps {
  open: boolean;
  tool: Tool | null;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

const DeleteToolModal: React.FC<DeleteToolModalProps> = ({
  open,
  tool,
  onClose,
  onConfirm,
  isDeleting
}) => {
  if (!tool) return null;

  return (
    <Dialog open={open} onClose={isDeleting ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Delete Tool</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to delete the tool <strong>{tool.identifier}</strong>? This action cannot be undone.
        </DialogContentText>
        <Box mt={2} p={2} bgcolor="background.paper" borderRadius={1}>
          <Typography variant="subtitle2">Tool Details:</Typography>
          <Typography variant="body2">
            <strong>Description:</strong> {tool.description}
          </Typography>
          <Box sx={{ display: 'flex', mt: 1, gap: 1 }}>
            <Chip label={`Provider: ${tool.provider_id}`} size="small" />
            <Chip label={`Tool Group: ${tool.toolgroup_id}`} size="small" color="secondary" />
          </Box>
          
          <Typography variant="subtitle2" sx={{ mt: 2 }}>
            Parameters ({tool.parameters.length}):
          </Typography>
          {tool.parameters.length > 0 ? (
            <List dense>
              {tool.parameters.slice(0, 3).map((param) => (
                <ListItem key={param.name} disablePadding>
                  <ListItemText
                    primary={param.name}
                    secondary={`${param.parameter_type}${param.required ? ' (required)' : ''}`}
                  />
                </ListItem>
              ))}
              {tool.parameters.length > 3 && (
                <ListItem disablePadding>
                  <ListItemText
                    primary={`... and ${tool.parameters.length - 3} more parameters`}
                  />
                </ListItem>
              )}
            </List>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No parameters
            </Typography>
          )}
        </Box>
        <DialogContentText sx={{ mt: 2, color: 'warning.main' }}>
          Warning: Deleting this tool may affect any agents or applications that use it.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isDeleting}>
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          color="error"
          variant="contained"
          disabled={isDeleting}
          startIcon={isDeleting ? <CircularProgress size={20} color="inherit" /> : undefined}
        >
          {isDeleting ? 'Deleting...' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteToolModal;