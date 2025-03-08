import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  Card,
  CardContent,
  IconButton
} from '@mui/material';
import {
  Close as CloseIcon,
  Code as CodeIcon
} from '@mui/icons-material';
import { Tool, ToolGroup, apiService } from '../../services/api';

interface ToolGroupDetailsProps {
  open: boolean;
  toolGroup: ToolGroup | null;
  onClose: () => void;
}

const ToolGroupDetails: React.FC<ToolGroupDetailsProps> = ({
  open,
  toolGroup,
  onClose
}) => {
  const [loading, setLoading] = useState(false);
  const [tools, setTools] = useState<Tool[]>([]);

  useEffect(() => {
    if (open && toolGroup) {
      const fetchTools = async () => {
        setLoading(true);
        try {
          // Fetch all tools
          const allTools = await apiService.getTools();
          
          // Filter tools that belong to this tool group
          const groupTools = allTools.filter(tool => 
            toolGroup.tools && toolGroup.tools.includes(tool.identifier)
          );
          
          setTools(groupTools);
        } catch (error) {
          console.error('Error fetching tools:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchTools();
    }
  }, [open, toolGroup]);

  if (!toolGroup) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">
            Tool Group: {toolGroup.name || toolGroup.identifier}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight="bold">
              Details
            </Typography>
            <Box mt={1}>
              <Typography variant="body2">
                <strong>ID:</strong> {toolGroup.identifier}
              </Typography>
              <Typography variant="body2" mt={1}>
                <strong>Description:</strong> {toolGroup.description || 'No description available'}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight="bold">
              Tools in this Group
            </Typography>
            {loading ? (
              <Box display="flex" justifyContent="center" my={3}>
                <CircularProgress />
              </Box>
            ) : tools.length === 0 ? (
              <Typography variant="body2" color="text.secondary" mt={1}>
                No tools found in this group
              </Typography>
            ) : (
              <Grid container spacing={2} mt={1}>
                {tools.map((tool) => (
                  <Grid item xs={12} md={6} key={tool.identifier}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <CodeIcon color="primary" sx={{ mr: 1 }} />
                          <Typography variant="subtitle1" noWrap>
                            {tool.identifier}
                          </Typography>
                        </Box>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            mb: 2,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {tool.description}
                        </Typography>
                        <Typography variant="caption" display="block">
                          Parameters: {tool.parameters.length}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ToolGroupDetails;