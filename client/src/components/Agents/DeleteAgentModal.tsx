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
  CircularProgress
} from '@mui/material';
import { Agent } from '../../services/api';

interface DeleteAgentModalProps {
  open: boolean;
  agent: Agent | null;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

const DeleteAgentModal: React.FC<DeleteAgentModalProps> = ({
  open,
  agent,
  onClose,
  onConfirm,
  isDeleting
}) => {
  if (!agent) return null;

  return (
    <Dialog open={open} onClose={isDeleting ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Delete Agent</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to delete the agent <strong>{agent.id}</strong>? This action cannot be undone.
        </DialogContentText>
        <Box mt={2} p={2} bgcolor="background.paper" borderRadius={1}>
          <Typography variant="subtitle2">Agent Details:</Typography>
          <Typography variant="body2">
            <strong>Model:</strong> {agent.config.model}
          </Typography>
          <Typography variant="body2">
            <strong>Instructions:</strong>{' '}
            {agent.config.instructions.length > 100
              ? `${agent.config.instructions.substring(0, 100)}...`
              : agent.config.instructions}
          </Typography>
          <Typography variant="body2">
            <strong>Created:</strong> {new Date(agent.created_at).toLocaleString()}
          </Typography>
        </Box>
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

export default DeleteAgentModal;