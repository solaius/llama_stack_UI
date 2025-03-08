import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Grid,
  FormHelperText,
  CircularProgress,
  Autocomplete,
  Chip
} from '@mui/material';
import { Tool } from '../../services/api';

interface ToolGroupFormProps {
  tools: Tool[];
  onSubmit: (values: {
    toolgroup_id: string;
    name: string;
    description: string;
    provider_id: string;
    tools: string[];
  }) => void;
  onCancel: () => void;
  loading: boolean;
}

const ToolGroupForm: React.FC<ToolGroupFormProps> = ({
  tools,
  onSubmit,
  onCancel,
  loading
}) => {
  const [formValues, setFormValues] = useState({
    toolgroup_id: '',
    name: '',
    description: '',
    provider_id: '',
    tools: [] as string[]
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: any) => {
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

  const handleToolsChange = (newTools: string[]) => {
    setFormValues((prev) => ({
      ...prev,
      tools: newTools
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formValues.toolgroup_id) {
      newErrors.toolgroup_id = 'Tool Group ID is required';
    } else if (!/^[a-zA-Z0-9_-]+$/.test(formValues.toolgroup_id)) {
      newErrors.toolgroup_id = 'Tool Group ID can only contain letters, numbers, underscores, and hyphens';
    }

    if (!formValues.name) {
      newErrors.name = 'Name is required';
    }

    if (!formValues.description) {
      newErrors.description = 'Description is required';
    }

    if (!formValues.provider_id) {
      newErrors.provider_id = 'Provider ID is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formValues);
    }
  };

  // Get unique provider IDs from tools
  const providerIds = Array.from(new Set(tools.map(tool => tool.provider_id)));

  return (
    <Box component={Paper} p={3}>
      <Typography variant="h5" gutterBottom>
        Create New Tool Group
      </Typography>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Tool Group ID"
              value={formValues.toolgroup_id}
              onChange={(e) => handleChange('toolgroup_id', e.target.value)}
              error={!!errors.toolgroup_id}
              helperText={errors.toolgroup_id || 'Unique identifier for the tool group (e.g., "search-tools")'}
              required
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Name"
              value={formValues.name}
              onChange={(e) => handleChange('name', e.target.value)}
              error={!!errors.name}
              helperText={errors.name || 'Display name for the tool group'}
              required
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={formValues.description}
              onChange={(e) => handleChange('description', e.target.value)}
              error={!!errors.description}
              helperText={errors.description || 'Detailed description of the tool group and its purpose'}
              required
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Autocomplete
              options={providerIds}
              value={formValues.provider_id}
              onChange={(_, newValue) => handleChange('provider_id', newValue || '')}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Provider ID"
                  error={!!errors.provider_id}
                  helperText={errors.provider_id || 'The provider that owns this tool group'}
                  required
                />
              )}
            />
          </Grid>

          <Grid item xs={12}>
            <Autocomplete
              multiple
              options={tools.map(tool => tool.identifier)}
              value={formValues.tools}
              onChange={(_, newValue) => handleToolsChange(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Tools"
                  helperText="Select tools to include in this group"
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
            <FormHelperText>
              Tools can be added or removed later
            </FormHelperText>
          </Grid>
        </Grid>

        <Box mt={3} display="flex" justifyContent="flex-end">
          <Button onClick={onCancel} sx={{ mr: 1 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            type="submit"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : undefined}
          >
            {loading ? 'Creating...' : 'Create Tool Group'}
          </Button>
        </Box>
      </form>
    </Box>
  );
};

export default ToolGroupForm;