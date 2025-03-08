import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  Alert,
  Snackbar,
  Dialog,
  useTheme,
  Tabs,
  Tab
} from '@mui/material';
import ToolGroupList from '../components/Tools/ToolGroupList';
import ToolGroupForm from '../components/Tools/ToolGroupForm';
import DeleteToolGroupModal from '../components/Tools/DeleteToolGroupModal';
import ToolGroupDetails from '../components/Tools/ToolGroupDetails';
import { Tool, ToolGroup, apiService } from '../services/api';

const ToolGroupsPage: React.FC = () => {
  const theme = useTheme();
  const [toolGroups, setToolGroups] = useState<ToolGroup[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentToolGroup, setCurrentToolGroup] = useState<ToolGroup | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [toolGroupsData, toolsData] = await Promise.all([
        apiService.getToolGroups(),
        apiService.getTools()
      ]);
      
      // Ensure we have valid data with required fields
      const validToolGroups = toolGroupsData.map(tg => ({
        ...tg,
        name: tg.name || tg.identifier,
        description: tg.description || 'No description available',
        tools: tg.tools || []
      }));
      
      setToolGroups(validToolGroups);
      setTools(toolsData);
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load tool groups. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateToolGroup = () => {
    setCurrentToolGroup(null);
    setIsEditing(false);
    setShowForm(true);
  };

  const handleEditToolGroup = (toolGroup: ToolGroup) => {
    setCurrentToolGroup(toolGroup);
    setIsEditing(true);
    setShowForm(true);
  };

  const handleViewToolGroup = (toolGroup: ToolGroup) => {
    setCurrentToolGroup(toolGroup);
    setShowDetailsModal(true);
  };

  const handleDeleteClick = (toolGroup: ToolGroup) => {
    setCurrentToolGroup(toolGroup);
    setShowDeleteModal(true);
  };

  const handleFormSubmit = async (values: {
    toolgroup_id: string;
    name: string;
    description: string;
    provider_id: string;
    tools: string[];
  }) => {
    try {
      setIsSubmitting(true);
      
      if (isEditing && currentToolGroup) {
        // Update the tool group
        await apiService.updateToolGroup(currentToolGroup.identifier, {
          provider_id: values.provider_id
        });
        
        // For UI purposes, update the tool group object in local storage
        const currentToolGroups = apiService._getToolGroupsFromStorage();
        const updatedToolGroups = currentToolGroups.map(tg => 
          tg.identifier === currentToolGroup.identifier 
            ? {
                ...tg,
                name: values.name,
                description: values.description,
                tools: values.tools,
                provider_id: values.provider_id
              } 
            : tg
        );
        
        apiService._saveToolGroupsToStorage(updatedToolGroups);
        
        setNotification({
          open: true,
          message: `Tool Group "${values.name}" updated successfully`,
          severity: 'success'
        });
      } else {
        // Create the tool group
        await apiService.createToolGroup({
          toolgroup_id: values.toolgroup_id,
          provider_id: values.provider_id
        });
        
        // For UI purposes, create a complete tool group object
        const newToolGroup: ToolGroup = {
          identifier: values.toolgroup_id,
          name: values.name,
          description: values.description,
          tools: values.tools
        };
        
        // Update local storage for UI state
        const currentToolGroups = apiService._getToolGroupsFromStorage();
        apiService._saveToolGroupsToStorage([...currentToolGroups, newToolGroup]);
        
        setNotification({
          open: true,
          message: `Tool Group "${values.name}" created successfully`,
          severity: 'success'
        });
      }
      
      setShowForm(false);
      fetchData(); // Refresh the list
    } catch (err) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} tool group:`, err);
      setNotification({
        open: true,
        message: `Failed to ${isEditing ? 'update' : 'create'} tool group. Please try again.`,
        severity: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!currentToolGroup) return;

    try {
      setIsDeleting(true);
      await apiService.deleteToolGroup(currentToolGroup.identifier);
      
      // Update local storage for UI state
      const currentToolGroups = apiService._getToolGroupsFromStorage();
      const updatedToolGroups = currentToolGroups.filter(
        tg => tg.identifier !== currentToolGroup.identifier
      );
      apiService._saveToolGroupsToStorage(updatedToolGroups);
      
      setNotification({
        open: true,
        message: `Tool Group "${currentToolGroup.name}" deleted successfully`,
        severity: 'success'
      });
      setShowDeleteModal(false);
      fetchData(); // Refresh the list
    } catch (err) {
      console.error('Error deleting tool group:', err);
      setNotification({
        open: true,
        message: 'Failed to delete tool group. Please try again.',
        severity: 'error'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCloseNotification = () => {
    setNotification((prev) => ({ ...prev, open: false }));
  };

  return (
    <Container maxWidth="lg">
      <Box my={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Tool Groups Management
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Paper
          elevation={3}
          sx={{
            p: 3,
            backgroundColor: theme.palette.background.paper
          }}
        >
          <ToolGroupList
            toolGroups={toolGroups}
            loading={loading}
            onDelete={handleDeleteClick}
            onEdit={handleEditToolGroup}
            onCreateNew={handleCreateToolGroup}
            onView={handleViewToolGroup}
          />
        </Paper>

        <Dialog
          open={showForm}
          onClose={() => setShowForm(false)}
          maxWidth="md"
          fullWidth
        >
          <ToolGroupForm
            tools={tools}
            initialValues={isEditing && currentToolGroup ? {
              toolgroup_id: currentToolGroup.identifier,
              name: currentToolGroup.name || '',
              description: currentToolGroup.description || '',
              provider_id: currentToolGroup.provider_id || '',
              tools: currentToolGroup.tools || []
            } : undefined}
            onSubmit={handleFormSubmit}
            onCancel={() => setShowForm(false)}
            loading={isSubmitting}
            isEditing={isEditing}
          />
        </Dialog>

        <DeleteToolGroupModal
          open={showDeleteModal}
          toolGroup={currentToolGroup}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteConfirm}
          isDeleting={isDeleting}
        />

        <ToolGroupDetails
          open={showDetailsModal}
          toolGroup={currentToolGroup}
          onClose={() => setShowDetailsModal(false)}
        />

        <Snackbar
          open={notification.open}
          autoHideDuration={6000}
          onClose={handleCloseNotification}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={handleCloseNotification}
            severity={notification.severity}
            variant="filled"
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
};

export default ToolGroupsPage;