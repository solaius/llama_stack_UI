import React, { useEffect, useState } from 'react';
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
  Chip,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Storage as StorageIcon, Info as InfoIcon } from '@mui/icons-material';
import apiService, { Model } from '../services/api';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { docco, dark } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { useTheme } from '@mui/material/styles';

const ModelsPage: React.FC = () => {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    const fetchModels = async () => {
      try {
        setLoading(true);
        const data = await apiService.getModels();
        setModels(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching models:', error);
        setLoading(false);
      }
    };

    fetchModels();
  }, []);

  const handleModelClick = (model: Model) => {
    setSelectedModel(model);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const getModelTypeColor = (type: string) => {
    switch (type) {
      case 'llm':
        return 'primary';
      case 'embedding':
        return 'secondary';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Paper elevation={0} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Available Models
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          View and explore the available models in your Llama Stack deployment.
        </Typography>

        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <StorageIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">LLM Models</Typography>
                </Box>
                <Typography variant="h4">
                  {loading ? (
                    <CircularProgress size={24} />
                  ) : (
                    models.filter((model) => model.model_type === 'llm').length
                  )}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <StorageIcon color="secondary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Embedding Models</Typography>
                </Box>
                <Typography variant="h4">
                  {loading ? (
                    <CircularProgress size={24} />
                  ) : (
                    models.filter((model) => model.model_type === 'embedding').length
                  )}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                <TableCell>Model ID</TableCell>
                <TableCell>Provider</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Provider Resource ID</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {models.map((model) => (
                <TableRow key={model.identifier} hover>
                  <TableCell component="th" scope="row">
                    {model.identifier}
                  </TableCell>
                  <TableCell>{model.provider_id}</TableCell>
                  <TableCell>
                    <Chip
                      label={model.model_type}
                      color={getModelTypeColor(model.model_type) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{model.provider_resource_id}</TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleModelClick(model)}
                      startIcon={<InfoIcon />}
                    >
                      Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      {/* Model Details Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        {selectedModel && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <StorageIcon sx={{ mr: 1 }} />
                Model Details: {selectedModel.identifier}
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Model ID
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedModel.identifier}
                  </Typography>

                  <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 2 }}>
                    Provider
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedModel.provider_id}
                  </Typography>

                  <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 2 }}>
                    Type
                  </Typography>
                  <Chip
                    label={selectedModel.model_type}
                    color={getModelTypeColor(selectedModel.model_type) as any}
                    size="small"
                  />

                  <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 2 }}>
                    Provider Resource ID
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedModel.provider_resource_id}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Metadata
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <SyntaxHighlighter
                      language="json"
                      style={theme.palette.mode === 'dark' ? dark : docco}
                      customStyle={{
                        borderRadius: '4px',
                      }}
                    >
                      {JSON.stringify(selectedModel.metadata, null, 2) || '{}'}
                    </SyntaxHighlighter>
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

export default ModelsPage;