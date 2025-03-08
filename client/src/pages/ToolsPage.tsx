import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  CircularProgress,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  List,
  ListItem,
  ListItemText,
  Tabs,
  Tab,
  Container,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Code as CodeIcon,
  ExpandMore as ExpandMoreIcon,
  PlayArrow as PlayArrowIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import apiService, { Tool, ToolParameter } from '../services/api';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { docco, dark } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { useTheme } from '@mui/material/styles';
import ToolGroupsPage from './ToolGroupsPage';
import ToolTestPanel from '../components/Tools/ToolTestPanel';
import ToolList from '../components/Tools/ToolList';
import ToolForm from '../components/Tools/ToolForm';
import DeleteToolModal from '../components/Tools/DeleteToolModal';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tools-tabpanel-${index}`}
      aria-labelledby={`tools-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `tools-tab-${index}`,
    'aria-controls': `tools-tabpanel-${index}`,
  };
}

const ToolsPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [tools, setTools] = useState<Tool[]>([]);
  const [toolGroups, setToolGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [showToolForm, setShowToolForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
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
  const theme = useTheme();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [toolsResponse, toolGroupsResponse] = await Promise.all([
          apiService.getTools(),
          apiService.getToolGroups()
        ]);
        
        // Also check local storage for any custom tools
        const localTools = apiService._getToolsFromStorage();
        
        // Combine API tools with local tools, avoiding duplicates
        const allTools = [...toolsResponse];
        localTools.forEach(localTool => {
          if (!allTools.some(tool => tool.identifier === localTool.identifier)) {
            allTools.push(localTool);
          }
        });
        
        setTools(allTools);
        setToolGroups(toolGroupsResponse);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleToolClick = (tool: Tool) => {
    setSelectedTool(tool);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedTool(null);
  };
  
  const handleCreateTool = () => {
    setSelectedTool(null);
    setIsEditing(false);
    setShowToolForm(true);
  };
  
  const handleEditTool = (tool: Tool) => {
    setSelectedTool(tool);
    setIsEditing(true);
    setShowToolForm(true);
  };
  
  const handleDeleteClick = (tool: Tool) => {
    setSelectedTool(tool);
    setShowDeleteModal(true);
  };
  
  const handleFormSubmit = async (values: {
    identifier: string;
    description: string;
    provider_id: string;
    toolgroup_id: string;
    parameters: ToolParameter[];
  }) => {
    try {
      setIsSubmitting(true);
      
      if (isEditing && selectedTool) {
        // Update the tool
        await apiService.updateTool(selectedTool.identifier, {
          description: values.description,
          provider_id: values.provider_id,
          toolgroup_id: values.toolgroup_id,
          parameters: values.parameters
        });
        
        // Update local storage
        const currentTools = apiService._getToolsFromStorage();
        const updatedTools = currentTools.map(tool => 
          tool.identifier === selectedTool.identifier 
            ? {
                ...tool,
                description: values.description,
                provider_id: values.provider_id,
                toolgroup_id: values.toolgroup_id,
                parameters: values.parameters
              } 
            : tool
        );
        
        apiService._saveToolsToStorage(updatedTools);
        
        setNotification({
          open: true,
          message: `Tool "${values.identifier}" updated successfully`,
          severity: 'success'
        });
      } else {
        // Create the tool
        await apiService.createTool(values);
        
        // Update local storage
        const currentTools = apiService._getToolsFromStorage();
        const newTool: Tool = {
          identifier: values.identifier,
          provider_resource_id: '',
          provider_id: values.provider_id,
          type: 'function',
          toolgroup_id: values.toolgroup_id,
          tool_host: '',
          description: values.description,
          parameters: values.parameters,
          metadata: null
        };
        
        apiService._saveToolsToStorage([...currentTools, newTool]);
        
        setNotification({
          open: true,
          message: `Tool "${values.identifier}" created successfully`,
          severity: 'success'
        });
      }
      
      // Refresh the tools list
      const [toolsResponse] = await Promise.all([
        apiService.getTools()
      ]);
      
      // Combine with local storage
      const localTools = apiService._getToolsFromStorage();
      const allTools = [...toolsResponse];
      localTools.forEach(localTool => {
        if (!allTools.some(tool => tool.identifier === localTool.identifier)) {
          allTools.push(localTool);
        }
      });
      
      setTools(allTools);
      setShowToolForm(false);
    } catch (err) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} tool:`, err);
      setNotification({
        open: true,
        message: `Failed to ${isEditing ? 'update' : 'create'} tool. Please try again.`,
        severity: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteConfirm = async () => {
    if (!selectedTool) return;
    
    try {
      setIsDeleting(true);
      await apiService.deleteTool(selectedTool.identifier);
      
      // Update local storage
      const currentTools = apiService._getToolsFromStorage();
      const updatedTools = currentTools.filter(
        tool => tool.identifier !== selectedTool.identifier
      );
      apiService._saveToolsToStorage(updatedTools);
      
      setNotification({
        open: true,
        message: `Tool "${selectedTool.identifier}" deleted successfully`,
        severity: 'success'
      });
      
      // Refresh the tools list
      const [toolsResponse] = await Promise.all([
        apiService.getTools()
      ]);
      
      // Combine with local storage
      const localTools = apiService._getToolsFromStorage();
      const allTools = [...toolsResponse];
      localTools.forEach(localTool => {
        if (!allTools.some(tool => tool.identifier === localTool.identifier)) {
          allTools.push(localTool);
        }
      });
      
      setTools(allTools);
      setShowDeleteModal(false);
    } catch (err) {
      console.error('Error deleting tool:', err);
      setNotification({
        open: true,
        message: 'Failed to delete tool. Please try again.',
        severity: 'error'
      });
    } finally {
      setIsDeleting(false);
    }
  };
  
  const handleCloseNotification = () => {
    setNotification((prev) => ({ ...prev, open: false }));
  };

  const groupToolsByProvider = () => {
    const groups: Record<string, Tool[]> = {};
    tools.forEach((tool) => {
      if (!groups[tool.provider_id]) {
        groups[tool.provider_id] = [];
      }
      groups[tool.provider_id].push(tool);
    });
    return groups;
  };

  return (
    <Container maxWidth="lg">
      <Box my={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Tools Management
        </Typography>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="tools management tabs">
            <Tab label="Available Tools" {...a11yProps(0)} />
            <Tab label="Tool Groups" {...a11yProps(1)} />
          </Tabs>
        </Box>
        
        <TabPanel value={tabValue} index={0}>
          <Paper elevation={0} sx={{ p: 3, mb: 4 }}>
            <ToolList
              tools={tools}
              toolGroups={toolGroups}
              loading={loading}
              onDelete={handleDeleteClick}
              onEdit={handleEditTool}
              onCreateNew={handleCreateTool}
              onView={handleToolClick}
            />
          </Paper>
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <ToolGroupsPage />
        </TabPanel>
      </Box>

      {/* Tool Details Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        {selectedTool && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CodeIcon sx={{ mr: 1 }} />
                Tool: {selectedTool.identifier}
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <ToolTestPanel tool={selectedTool} />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Tool Form Dialog */}
      <Dialog open={showToolForm} onClose={() => setShowToolForm(false)} maxWidth="lg" fullWidth>
        <ToolForm
          toolGroups={toolGroups}
          initialValues={isEditing && selectedTool ? {
            identifier: selectedTool.identifier,
            description: selectedTool.description,
            provider_id: selectedTool.provider_id,
            toolgroup_id: selectedTool.toolgroup_id,
            parameters: selectedTool.parameters
          } : undefined}
          onSubmit={handleFormSubmit}
          onCancel={() => setShowToolForm(false)}
          loading={isSubmitting}
          isEditing={isEditing}
        />
      </Dialog>

      {/* Delete Tool Modal */}
      <DeleteToolModal
        open={showDeleteModal}
        tool={selectedTool}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />

      {/* Notification Snackbar */}
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
    </Container>
  );
};

export default ToolsPage;