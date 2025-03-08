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
  Container
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
  const [loading, setLoading] = useState(true);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const theme = useTheme();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

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
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedTool(null);
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
    </Container>
  );
};

export default ToolsPage;