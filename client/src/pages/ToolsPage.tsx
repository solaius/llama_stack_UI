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

interface ToolTestState {
  [key: string]: string;
}

const ToolsPage: React.FC = () => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [testInputs, setTestInputs] = useState<ToolTestState>({});
  const [testResult, setTestResult] = useState<string>('');
  const [testLoading, setTestLoading] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    const fetchTools = async () => {
      try {
        setLoading(true);
        const data = await apiService.getTools();
        setTools(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching tools:', error);
        setLoading(false);
      }
    };

    fetchTools();
  }, []);

  const handleToolClick = (tool: Tool) => {
    setSelectedTool(tool);
    // Initialize test inputs with empty strings
    const initialInputs: ToolTestState = {};
    tool.parameters.forEach((param) => {
      initialInputs[param.name] = '';
    });
    setTestInputs(initialInputs);
    setTestResult('');
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedTool(null);
  };

  const handleInputChange = (paramName: string, value: string) => {
    setTestInputs((prev) => ({
      ...prev,
      [paramName]: value,
    }));
  };

  const handleTestTool = async () => {
    if (!selectedTool) return;

    try {
      setTestLoading(true);
      setTestResult('');

      // Convert inputs to appropriate types based on parameter_type
      const args: Record<string, any> = {};
      selectedTool.parameters.forEach((param) => {
        const value = testInputs[param.name];
        if (param.parameter_type === 'number' || param.parameter_type === 'integer') {
          args[param.name] = Number(value);
        } else if (param.parameter_type === 'boolean') {
          args[param.name] = value.toLowerCase() === 'true';
        } else if (param.parameter_type === 'array' || param.parameter_type === 'object') {
          try {
            args[param.name] = JSON.parse(value);
          } catch (e) {
            args[param.name] = value;
          }
        } else {
          args[param.name] = value;
        }
      });

      const result = await apiService.invokeTool(selectedTool.identifier, args);
      setTestResult(JSON.stringify(result, null, 2));
    } catch (error: any) {
      console.error('Error testing tool:', error);
      setTestResult(
        JSON.stringify(
          {
            error: 'Error invoking tool',
            message: error.message,
            details: error.response?.data || {},
          },
          null,
          2
        )
      );
    } finally {
      setTestLoading(false);
    }
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
    <Box>
      <Paper elevation={0} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Available Tools
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Explore and test the available tools in your Llama Stack deployment.
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Tools by Provider
            </Typography>
            {Object.entries(groupToolsByProvider()).map(([provider, providerTools]) => (
              <Accordion key={provider} defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1">
                    {provider} ({providerTools.length})
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    {providerTools.map((tool) => (
                      <Grid item xs={12} sm={6} md={4} key={tool.identifier}>
                        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                          <CardContent sx={{ flexGrow: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <CodeIcon color="primary" sx={{ mr: 1 }} />
                              <Typography variant="h6" noWrap>
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
                            <Chip
                              label={tool.toolgroup_id}
                              size="small"
                              color="secondary"
                              sx={{ mb: 1 }}
                            />
                            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                              Parameters: {tool.parameters.length}
                            </Typography>
                          </CardContent>
                          <CardActions>
                            <Button
                              size="small"
                              startIcon={<InfoIcon />}
                              onClick={() => handleToolClick(tool)}
                            >
                              Details & Test
                            </Button>
                          </CardActions>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        )}
      </Paper>

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
              <Typography variant="subtitle1" fontWeight="bold">
                Description
              </Typography>
              <Typography variant="body1" paragraph>
                {selectedTool.description}
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Tool Group
                  </Typography>
                  <Chip label={selectedTool.toolgroup_id} color="secondary" sx={{ mt: 1 }} />

                  <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 3 }}>
                    Provider
                  </Typography>
                  <Typography variant="body1">{selectedTool.provider_id}</Typography>

                  <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 3 }}>
                    Parameters
                  </Typography>
                  <List dense>
                    {selectedTool.parameters.map((param: ToolParameter) => (
                      <ListItem key={param.name}>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Typography variant="body2" fontWeight="bold">
                                {param.name}
                              </Typography>
                              {param.required && (
                                <Chip
                                  label="Required"
                                  size="small"
                                  color="error"
                                  sx={{ ml: 1, height: 20 }}
                                />
                              )}
                            </Box>
                          }
                          secondary={
                            <>
                              <Typography variant="caption" display="block" color="text.secondary">
                                Type: {param.parameter_type}
                              </Typography>
                              <Typography variant="caption" display="block">
                                {param.description}
                              </Typography>
                              {param.default !== null && (
                                <Typography variant="caption" display="block">
                                  Default: {JSON.stringify(param.default)}
                                </Typography>
                              )}
                            </>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Test Tool
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    {selectedTool.parameters.map((param) => (
                      <TextField
                        key={param.name}
                        label={`${param.name}${param.required ? ' *' : ''}`}
                        fullWidth
                        margin="dense"
                        size="small"
                        value={testInputs[param.name] || ''}
                        onChange={(e) => handleInputChange(param.name, e.target.value)}
                        helperText={param.description}
                        placeholder={
                          param.default !== null ? `Default: ${JSON.stringify(param.default)}` : ''
                        }
                      />
                    ))}

                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={testLoading ? <CircularProgress size={20} /> : <PlayArrowIcon />}
                      onClick={handleTestTool}
                      disabled={testLoading}
                      sx={{ mt: 2 }}
                    >
                      Test Tool
                    </Button>

                    {testResult && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2">Result:</Typography>
                        <SyntaxHighlighter
                          language="json"
                          style={theme.palette.mode === 'dark' ? dark : docco}
                          customStyle={{
                            borderRadius: '4px',
                            maxHeight: '200px',
                            overflow: 'auto',
                          }}
                        >
                          {testResult}
                        </SyntaxHighlighter>
                      </Box>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default ToolsPage;