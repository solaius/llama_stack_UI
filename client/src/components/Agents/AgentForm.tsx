import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Divider,
  Chip,
  Autocomplete,
  Switch,
  FormControlLabel,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent
} from '@mui/material';
import { AgentConfig, Model, ToolGroup, apiService } from '../../services/api';

interface AgentFormProps {
  initialValues?: Partial<AgentConfig>;
  onSubmit: (values: AgentConfig & { name?: string }) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

const defaultSamplingParams = {
  strategy: {
    type: 'greedy' as const
  },
  max_tokens: 1000,
  repetition_penalty: 1
};

const defaultToolConfig = {
  tool_choice: 'auto' as const,
  tool_prompt_format: 'json' as const
};

const AgentForm: React.FC<AgentFormProps> = ({
  initialValues,
  onSubmit,
  onCancel,
  isEditing = false
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [models, setModels] = useState<Model[]>([]);
  const [toolGroups, setToolGroups] = useState<ToolGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [formValues, setFormValues] = useState<AgentConfig & { name?: string }>({
    model: initialValues?.model || '',
    instructions: initialValues?.instructions || '',
    sampling_params: initialValues?.sampling_params || defaultSamplingParams,
    toolgroups: initialValues?.toolgroups || [],
    tool_config: initialValues?.tool_config || defaultToolConfig,
    max_infer_iters: initialValues?.max_infer_iters || 10,
    enable_session_persistence: initialValues?.enable_session_persistence || false,
    name: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [modelsData, toolGroupsData] = await Promise.all([
          apiService.getModels(),
          apiService.getToolGroups()
        ]);
        setModels(modelsData);
        setToolGroups(toolGroupsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleChange = (field: keyof AgentConfig, value: any) => {
    setFormValues((prev) => ({
      ...prev,
      [field]: value
    }));

    // Clear error for this field if it exists
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSamplingParamsChange = (field: string, value: any) => {
    setFormValues((prev) => ({
      ...prev,
      sampling_params: {
        ...prev.sampling_params!,
        [field]: value
      }
    }));
  };

  const handleStrategyTypeChange = (value: 'greedy' | 'top_p' | 'top_k') => {
    setFormValues((prev) => ({
      ...prev,
      sampling_params: {
        ...prev.sampling_params!,
        strategy: {
          ...prev.sampling_params!.strategy,
          type: value
        }
      }
    }));
  };

  const handleStrategyParamChange = (field: 'p' | 'k', value: number) => {
    setFormValues((prev) => ({
      ...prev,
      sampling_params: {
        ...prev.sampling_params!,
        strategy: {
          ...prev.sampling_params!.strategy,
          [field]: value
        }
      }
    }));
  };

  const handleToolConfigChange = (field: string, value: any) => {
    setFormValues((prev) => ({
      ...prev,
      tool_config: {
        ...prev.tool_config!,
        [field]: value
      }
    }));
  };

  const handleToolGroupsChange = (newToolGroups: string[]) => {
    setFormValues((prev) => ({
      ...prev,
      toolgroups: newToolGroups
    }));
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 0) {
      if (!formValues.model) {
        newErrors.model = 'Model is required';
      }
      if (!formValues.instructions) {
        newErrors.instructions = 'Instructions are required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep(activeStep)) {
      onSubmit(formValues);
    }
  };

  const steps = ['Basic Information', 'Model Configuration', 'Tool Configuration', 'Review'];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box component={Paper} p={3}>
      <Typography variant="h5" gutterBottom>
        {isEditing ? 'Edit Agent' : 'Create New Agent'}
      </Typography>
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <form onSubmit={handleSubmit}>
        {activeStep === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth error={!!errors.model}>
                <InputLabel id="model-label">Model</InputLabel>
                <Select
                  labelId="model-label"
                  value={formValues.model}
                  onChange={(e) => handleChange('model', e.target.value)}
                  label="Model"
                >
                  {models.map((model) => (
                    <MenuItem key={model.identifier} value={model.identifier}>
                      {model.identifier}
                    </MenuItem>
                  ))}
                </Select>
                {errors.model && <FormHelperText>{errors.model}</FormHelperText>}
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Instructions"
                multiline
                rows={6}
                value={formValues.instructions}
                onChange={(e) => handleChange('instructions', e.target.value)}
                error={!!errors.instructions}
                helperText={
                  errors.instructions ||
                  'Provide detailed instructions for the agent. This will be used as the system prompt.'
                }
              />
            </Grid>
          </Grid>
        )}

        {activeStep === 1 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Sampling Parameters
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="strategy-type-label">Sampling Strategy</InputLabel>
                <Select
                  labelId="strategy-type-label"
                  value={formValues.sampling_params?.strategy.type || 'greedy'}
                  onChange={(e) =>
                    handleStrategyTypeChange(e.target.value as 'greedy' | 'top_p' | 'top_k')
                  }
                  label="Sampling Strategy"
                >
                  <MenuItem value="greedy">Greedy</MenuItem>
                  <MenuItem value="top_p">Top-P</MenuItem>
                  <MenuItem value="top_k">Top-K</MenuItem>
                </Select>
                <FormHelperText>
                  Greedy: Always select the most likely token. Top-P: Sample from tokens that
                  comprise the top P probability mass. Top-K: Sample from the top K most likely
                  tokens.
                </FormHelperText>
              </FormControl>
            </Grid>

            {formValues.sampling_params?.strategy.type === 'top_p' && (
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="P Value"
                  value={formValues.sampling_params?.strategy.p || 0.9}
                  onChange={(e) =>
                    handleStrategyParamChange('p', parseFloat(e.target.value))
                  }
                  inputProps={{ min: 0, max: 1, step: 0.1 }}
                  helperText="Value between 0 and 1"
                />
              </Grid>
            )}

            {formValues.sampling_params?.strategy.type === 'top_k' && (
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="K Value"
                  value={formValues.sampling_params?.strategy.k || 50}
                  onChange={(e) =>
                    handleStrategyParamChange('k', parseInt(e.target.value))
                  }
                  inputProps={{ min: 1, step: 1 }}
                  helperText="Number of tokens to consider"
                />
              </Grid>
            )}

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Max Tokens"
                value={formValues.sampling_params?.max_tokens || 1000}
                onChange={(e) =>
                  handleSamplingParamsChange('max_tokens', parseInt(e.target.value))
                }
                inputProps={{ min: 1, step: 1 }}
                helperText="Maximum number of tokens to generate"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Repetition Penalty"
                value={formValues.sampling_params?.repetition_penalty || 1}
                onChange={(e) =>
                  handleSamplingParamsChange(
                    'repetition_penalty',
                    parseFloat(e.target.value)
                  )
                }
                inputProps={{ min: 1, step: 0.1 }}
                helperText="Penalty for repeating tokens (1.0 = no penalty)"
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Max Inference Iterations"
                value={formValues.max_infer_iters || 10}
                onChange={(e) => handleChange('max_infer_iters', parseInt(e.target.value))}
                inputProps={{ min: 1, step: 1 }}
                helperText="Maximum number of inference iterations"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formValues.enable_session_persistence || false}
                    onChange={(e) =>
                      handleChange('enable_session_persistence', e.target.checked)
                    }
                  />
                }
                label="Enable Session Persistence"
              />
              <FormHelperText>
                If enabled, the agent's session will be persisted between requests
              </FormHelperText>
            </Grid>
          </Grid>
        )}

        {activeStep === 2 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Tool Configuration
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Autocomplete
                multiple
                id="toolgroups"
                options={toolGroups.map((tg) => tg.identifier)}
                value={formValues.toolgroups?.filter((tg) => typeof tg === 'string') as string[] || []}
                onChange={(_, newValue) => handleToolGroupsChange(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Tool Groups"
                    helperText="Select tool groups that this agent can use"
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      label={option}
                      {...getTagProps({ index })}
                      key={option}
                    />
                  ))
                }
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="tool-choice-label">Tool Choice</InputLabel>
                <Select
                  labelId="tool-choice-label"
                  value={formValues.tool_config?.tool_choice || 'auto'}
                  onChange={(e) =>
                    handleToolConfigChange('tool_choice', e.target.value)
                  }
                  label="Tool Choice"
                >
                  <MenuItem value="auto">Auto</MenuItem>
                  <MenuItem value="required">Required</MenuItem>
                  <MenuItem value="none">None</MenuItem>
                </Select>
                <FormHelperText>
                  Auto: Let the model decide. Required: Force the model to use tools. None: Don't
                  use tools.
                </FormHelperText>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="tool-prompt-format-label">Tool Prompt Format</InputLabel>
                <Select
                  labelId="tool-prompt-format-label"
                  value={formValues.tool_config?.tool_prompt_format || 'json'}
                  onChange={(e) =>
                    handleToolConfigChange('tool_prompt_format', e.target.value)
                  }
                  label="Tool Prompt Format"
                >
                  <MenuItem value="json">JSON</MenuItem>
                  <MenuItem value="xml">XML</MenuItem>
                  <MenuItem value="yaml">YAML</MenuItem>
                </Select>
                <FormHelperText>Format for tool definitions in the prompt</FormHelperText>
              </FormControl>
            </Grid>
          </Grid>
        )}

        {activeStep === 3 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Review Agent Configuration
            </Typography>
            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6">Basic Information</Typography>
                <Typography>
                  <strong>Model:</strong> {formValues.model}
                </Typography>
                <Typography>
                  <strong>Instructions:</strong>
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    whiteSpace: 'pre-wrap',
                    bgcolor: 'background.paper',
                    p: 1,
                    borderRadius: 1,
                    maxHeight: '100px',
                    overflow: 'auto'
                  }}
                >
                  {formValues.instructions}
                </Typography>
              </CardContent>
            </Card>

            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6">Model Configuration</Typography>
                <Typography>
                  <strong>Sampling Strategy:</strong> {formValues.sampling_params?.strategy.type}
                  {formValues.sampling_params?.strategy.type === 'top_p' &&
                    ` (p=${formValues.sampling_params?.strategy.p})`}
                  {formValues.sampling_params?.strategy.type === 'top_k' &&
                    ` (k=${formValues.sampling_params?.strategy.k})`}
                </Typography>
                <Typography>
                  <strong>Max Tokens:</strong> {formValues.sampling_params?.max_tokens}
                </Typography>
                <Typography>
                  <strong>Repetition Penalty:</strong>{' '}
                  {formValues.sampling_params?.repetition_penalty}
                </Typography>
                <Typography>
                  <strong>Max Inference Iterations:</strong> {formValues.max_infer_iters}
                </Typography>
                <Typography>
                  <strong>Session Persistence:</strong>{' '}
                  {formValues.enable_session_persistence ? 'Enabled' : 'Disabled'}
                </Typography>
              </CardContent>
            </Card>

            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6">Tool Configuration</Typography>
                <Typography>
                  <strong>Tool Groups:</strong>{' '}
                  {formValues.toolgroups && formValues.toolgroups.length > 0
                    ? formValues.toolgroups
                        .filter((tg) => typeof tg === 'string')
                        .join(', ')
                    : 'None'}
                </Typography>
                <Typography>
                  <strong>Tool Choice:</strong> {formValues.tool_config?.tool_choice}
                </Typography>
                <Typography>
                  <strong>Tool Prompt Format:</strong>{' '}
                  {formValues.tool_config?.tool_prompt_format}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        )}

        <Box mt={3} display="flex" justifyContent="space-between">
          <Button onClick={onCancel} variant="outlined">
            Cancel
          </Button>
          <Box>
            {activeStep > 0 && (
              <Button onClick={handleBack} sx={{ mr: 1 }}>
                Back
              </Button>
            )}
            {activeStep < steps.length - 1 ? (
              <Button variant="contained" color="primary" onClick={handleNext}>
                Next
              </Button>
            ) : (
              <Button variant="contained" color="primary" type="submit">
                {isEditing ? 'Update Agent' : 'Create Agent'}
              </Button>
            )}
          </Box>
        </Box>
      </form>
    </Box>
  );
};

export default AgentForm;