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
  Chip
} from '@mui/material';
import { ToolGroup } from '../../services/api';

interface DeleteToolGroupModalProps {
  open: boolean;
  toolGroup: ToolGroup | null;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

const DeleteToolGroupModal: React.FC<DeleteToolGroupModalProps> = ({
  open,
  toolGroup,
  onClose,
  onConfirm,
  isDeleting
}) => {
  if (!toolGroup) return null;

  return (
    <Dialog open={open} onClose={isDeleting ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Delete Tool Group</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to delete the tool group <strong>{toolGroup.name || toolGroup.identifier}</strong> ({toolGroup.identifier})? This action cannot be undone.
        </DialogContentText>
        <Box mt={2} p={2} bgcolor="background.paper" borderRadius={1}>
          <Typography variant="subtitle2">Tool Group Details:</Typography>
          <Typography variant="body2">
            <strong>Description:</strong> {toolGroup.description || 'No description available'}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            <strong>Tools:</strong>
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
            {toolGroup.tools && toolGroup.tools.length > 0 ? (
              toolGroup.tools.map((tool) => (
                <Chip key={tool} label={tool} size="small" />
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                No tools in this group
              </Typography>
            )}
          </Box>
        </Box>
        {toolGroup.tools && toolGroup.tools.length > 0 && (
          <DialogContentText sx={{ mt: 2, color: 'warning.main' }}>
            Warning: Deleting this tool group will remove these tools from the group, but will not delete the tools themselves.
          </DialogContentText>
        )}
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

export default DeleteToolGroupModal;