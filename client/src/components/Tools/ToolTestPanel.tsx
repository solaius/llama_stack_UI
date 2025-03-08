import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Paper,
  Divider,
  Grid,
  FormHelperText,
  Chip,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  PlayArrow as PlayArrowIcon,
  ExpandMore as ExpandMoreIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { Tool, ToolParameter, apiService } from '../../services/api';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { docco, dark } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { useTheme } from '@mui/material/styles';

interface ToolTestPanelProps {
  tool: Tool;
}

interface TestState {
  [key: string]: string;
}

interface SavedTest {
  name: string;
  inputs: TestState;
}

const ToolTestPanel: React.FC<ToolTestPanelProps> = ({ tool }) => {
  const theme = useTheme();
  const [testInputs, setTestInputs] = useState<TestState>(() => {
    // Initialize with default values or empty strings
    const initialInputs: TestState = {};
    tool.parameters.forEach((param) => {
      initialInputs[param.name] = param.default !== null ? JSON.stringify(param.default) : '';
    });
    return initialInputs;
  });
  
  const [testResult, setTestResult] = useState<string>('');
  const [testLoading, setTestLoading] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);
  const [savedTests, setSavedTests] = useState<SavedTest[]>(() => {
    // Try to load saved tests from localStorage
    const savedData = localStorage.getItem(`tool_tests_${tool.identifier}`);
    if (savedData) {
      try {
        return JSON.parse(savedData);
      } catch (e) {
        console.error('Error parsing saved tests:', e);
        return [];
      }
    }
    return [];
  });
  const [testName, setTestName] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);

  const handleInputChange = (paramName: string, value: string) => {
    setTestInputs((prev) => ({
      ...prev,
      [paramName]: value,
    }));
  };

  const handleTestTool = async () => {
    try {
      setTestLoading(true);
      setTestResult('');
      setTestError(null);

      // Convert inputs to appropriate types based on parameter_type
      const args: Record<string, any> = {};
      tool.parameters.forEach((param) => {
        const value = testInputs[param.name];
        if (!value && param.required) {
          throw new Error(`Parameter ${param.name} is required`);
        }
        
        if (!value) {
          return; // Skip empty optional parameters
        }
        
        if (param.parameter_type === 'number' || param.parameter_type === 'integer') {
          args[param.name] = Number(value);
        } else if (param.parameter_type === 'boolean') {
          args[param.name] = value.toLowerCase() === 'true';
        } else if (param.parameter_type === 'array' || param.parameter_type === 'object') {
          try {
            args[param.name] = JSON.parse(value);
          } catch (e) {
            throw new Error(`Invalid JSON for parameter ${param.name}`);
          }
        } else {
          args[param.name] = value;
        }
      });

      const result = await apiService.invokeTool(tool.identifier, args);
      setTestResult(JSON.stringify(result, null, 2));
    } catch (error: any) {
      console.error('Error testing tool:', error);
      setTestError(error.message || 'An error occurred while testing the tool');
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

  const handleSaveTest = () => {
    if (!testName.trim()) {
      return;
    }
    
    const newTest: SavedTest = {
      name: testName,
      inputs: { ...testInputs }
    };
    
    const updatedTests = [...savedTests, newTest];
    setSavedTests(updatedTests);
    
    // Save to localStorage
    localStorage.setItem(`tool_tests_${tool.identifier}`, JSON.stringify(updatedTests));
    
    setTestName('');
    setShowSaveForm(false);
  };

  const handleLoadTest = (test: SavedTest) => {
    setTestInputs(test.inputs);
    setTestResult('');
    setTestError(null);
  };

  const handleDeleteTest = (index: number) => {
    const updatedTests = savedTests.filter((_, i) => i !== index);
    setSavedTests(updatedTests);
    localStorage.setItem(`tool_tests_${tool.identifier}`, JSON.stringify(updatedTests));
  };

  const handleClearForm = () => {
    const emptyInputs: TestState = {};
    tool.parameters.forEach((param) => {
      emptyInputs[param.name] = '';
    });
    setTestInputs(emptyInputs);
    setTestResult('');
    setTestError(null);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Test Tool: {tool.identifier}
      </Typography>
      
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Tool Description
        </Typography>
        <Typography variant="body2" paragraph>
          {tool.description}
        </Typography>
        <Chip label={`Provider: ${tool.provider_id}`} size="small" sx={{ mr: 1 }} />
        <Chip label={`Tool Group: ${tool.toolgroup_id}`} size="small" color="secondary" />
      </Paper>
      
      {savedTests.length > 0 && (
        <Accordion sx={{ mb: 3 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Saved Tests ({savedTests.length})</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              {savedTests.map((test, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      {test.name}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                      <Button 
                        size="small" 
                        variant="outlined" 
                        onClick={() => handleLoadTest(test)}
                      >
                        Load
                      </Button>
                      <Button 
                        size="small" 
                        color="error" 
                        onClick={() => handleDeleteTest(index)}
                      >
                        Delete
                      </Button>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </AccordionDetails>
        </Accordion>
      )}
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" gutterBottom>
            Parameters
          </Typography>
          
          {tool.parameters.map((param: ToolParameter) => (
            <Box key={param.name} sx={{ mb: 2 }}>
              <TextField
                fullWidth
                label={`${param.name}${param.required ? ' *' : ''}`}
                value={testInputs[param.name] || ''}
                onChange={(e) => handleInputChange(param.name, e.target.value)}
                error={param.required && !testInputs[param.name]}
                helperText={
                  <>
                    <Typography variant="caption" display="block">
                      {param.description}
                    </Typography>
                    <Typography variant="caption" display="block" color="text.secondary">
                      Type: {param.parameter_type}
                      {param.default !== null && ` (Default: ${JSON.stringify(param.default)})`}
                    </Typography>
                  </>
                }
                placeholder={
                  param.default !== null ? `Default: ${JSON.stringify(param.default)}` : ''
                }
                multiline={param.parameter_type === 'object' || param.parameter_type === 'array'}
                rows={param.parameter_type === 'object' || param.parameter_type === 'array' ? 4 : 1}
              />
            </Box>
          ))}
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            <Box>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={handleClearForm}
                sx={{ mr: 1 }}
              >
                Clear
              </Button>
              <Button
                variant="outlined"
                startIcon={<SaveIcon />}
                onClick={() => setShowSaveForm(true)}
                disabled={showSaveForm}
              >
                Save Test
              </Button>
            </Box>
            <Button
              variant="contained"
              color="primary"
              startIcon={testLoading ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />}
              onClick={handleTestTool}
              disabled={testLoading}
            >
              {testLoading ? 'Testing...' : 'Run Test'}
            </Button>
          </Box>
          
          {showSaveForm && (
            <Box sx={{ mt: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Save Current Test
              </Typography>
              <TextField
                fullWidth
                label="Test Name"
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                size="small"
                sx={{ mb: 2 }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button 
                  size="small" 
                  onClick={() => setShowSaveForm(false)} 
                  sx={{ mr: 1 }}
                >
                  Cancel
                </Button>
                <Button 
                  size="small" 
                  variant="contained" 
                  onClick={handleSaveTest}
                  disabled={!testName.trim()}
                >
                  Save
                </Button>
              </Box>
            </Box>
          )}
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" gutterBottom>
            Result
          </Typography>
          
          {testError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {testError}
            </Alert>
          )}
          
          <Paper 
            variant="outlined" 
            sx={{ 
              p: 0, 
              minHeight: '200px',
              maxHeight: '500px',
              overflow: 'auto',
              bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.100'
            }}
          >
            {testResult ? (
              <SyntaxHighlighter
                language="json"
                style={theme.palette.mode === 'dark' ? dark : docco}
                customStyle={{
                  margin: 0,
                  padding: '16px',
                  borderRadius: '4px',
                  height: '100%',
                  minHeight: '200px'
                }}
              >
                {testResult}
              </SyntaxHighlighter>
            ) : (
              <Box sx={{ p: 2, color: 'text.secondary', fontStyle: 'italic' }}>
                Test results will appear here
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ToolTestPanel;