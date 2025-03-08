import React, { useState, useEffect } from 'react';
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
  Chip,
  IconButton,
  Card,
  CardContent,
  CardActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Divider,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIndicatorIcon,
  Help as HelpIcon
} from '@mui/icons-material';
import { Tool, ToolParameter, ToolGroup, apiService } from '../../services/api';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ToolFormProps {
  toolGroups: ToolGroup[];
  initialValues?: {
    identifier: string;
    description: string;
    provider_id: string;
    toolgroup_id: string;
    parameters: ToolParameter[];
  };
  onSubmit: (values: {
    identifier: string;
    description: string;
    provider_id: string;
    toolgroup_id: string;
    parameters: ToolParameter[];
  }) => void;
  onCancel: () => void;
  loading: boolean;
  isEditing?: boolean;
}

// Parameter types supported by the API
const PARAMETER_TYPES = [
  'string',
  'number',
  'integer',
  'boolean',
  'array',
  'object'
];

const DEFAULT_PARAMETER: ToolParameter = {
  name: '',
  parameter_type: 'string',
  description: '',
  required: false,
  default: null
};

// Sortable parameter item component
interface SortableParameterItemProps {
  param: ToolParameter;
  index: number;
  paramErrors: Record<string, string> | undefined;
  onParameterChange: (index: number, field: keyof ToolParameter, value: any) => void;
  onRemoveParameter: (index: number) => void;
}

const SortableParameterItem: React.FC<SortableParameterItemProps> = ({
  param,
  index,
  paramErrors,
  onParameterChange,
  onRemoveParameter
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: `param-${index}` });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : 0,
    position: 'relative' as const
  };
  
  return (
    <Card 
      ref={setNodeRef}
      variant="outlined" 
      sx={{ 
        mb: 2,
        ...style
      }}
    >
      <Box 
        {...attributes}
        {...listeners}
        sx={{ 
          position: 'absolute', 
          top: 8, 
          left: 8, 
          cursor: 'grab',
          color: 'text.secondary'
        }}
      >
        <DragIndicatorIcon />
      </Box>
      <CardContent sx={{ pt: 3, pl: 5 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Parameter Name"
              value={param.name}
              onChange={(e) => onParameterChange(index, 'name', e.target.value)}
              error={!!paramErrors?.name}
              helperText={paramErrors?.name || 'Name of the parameter (e.g., "query")'}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth error={!!paramErrors?.parameter_type}>
              <InputLabel id={`param-type-label-${index}`}>Parameter Type *</InputLabel>
              <Select
                labelId={`param-type-label-${index}`}
                value={param.parameter_type}
                onChange={(e) => onParameterChange(index, 'parameter_type', e.target.value)}
                label="Parameter Type *"
              >
                {PARAMETER_TYPES.map(type => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>
                {paramErrors?.parameter_type || 'Data type of the parameter'}
              </FormHelperText>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              value={param.description}
              onChange={(e) => onParameterChange(index, 'description', e.target.value)}
              error={!!paramErrors?.description}
              helperText={paramErrors?.description || 'Description of what the parameter does'}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={param.required}
                  onChange={(e) => onParameterChange(index, 'required', e.target.checked)}
                />
              }
              label="Required"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Default Value"
              value={param.default !== null ? JSON.stringify(param.default) : ''}
              onChange={(e) => {
                try {
                  const value = e.target.value.trim() === '' 
                    ? null 
                    : JSON.parse(e.target.value);
                  onParameterChange(index, 'default', value);
                } catch (error) {
                  // If not valid JSON, store as string
                  onParameterChange(index, 'default', e.target.value);
                }
              }}
              helperText="Default value (in JSON format if applicable)"
              disabled={param.required}
            />
          </Grid>
        </Grid>
      </CardContent>
      <CardActions sx={{ justifyContent: 'flex-end' }}>
        <Button
          size="small"
          color="error"
          startIcon={<DeleteIcon />}
          onClick={() => onRemoveParameter(index)}
        >
          Remove
        </Button>
      </CardActions>
    </Card>
  );
};

const ToolForm: React.FC<ToolFormProps> = ({
  toolGroups,
  initialValues,
  onSubmit,
  onCancel,
  loading,
  isEditing = false
}) => {
  const [formValues, setFormValues] = useState({
    identifier: initialValues?.identifier || '',
    description: initialValues?.description || '',
    provider_id: initialValues?.provider_id || '',
    toolgroup_id: initialValues?.toolgroup_id || '',
    parameters: initialValues?.parameters || []
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [paramErrors, setParamErrors] = useState<Record<string, Record<string, string>>>({});
  const [providers, setProviders] = useState<string[]>([]);

  // Extract unique provider IDs from tool groups
  useEffect(() => {
    const uniqueProviders = Array.from(
      new Set(toolGroups.map(tg => tg.provider_id).filter(Boolean) as string[])
    );
    setProviders(uniqueProviders);
  }, [toolGroups]);

  const handleChange = (field: string, value: any) => {
    setFormValues(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error for this field if it exists
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleAddParameter = () => {
    setFormValues(prev => ({
      ...prev,
      parameters: [...prev.parameters, { ...DEFAULT_PARAMETER }]
    }));
  };

  const handleRemoveParameter = (index: number) => {
    setFormValues(prev => ({
      ...prev,
      parameters: prev.parameters.filter((_, i) => i !== index)
    }));

    // Clear errors for this parameter
    setParamErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[index.toString()];
      return newErrors;
    });
  };

  const handleParameterChange = (index: number, field: keyof ToolParameter, value: any) => {
    setFormValues(prev => ({
      ...prev,
      parameters: prev.parameters.map((param, i) => 
        i === index ? { ...param, [field]: value } : param
      )
    }));

    // Clear error for this parameter field if it exists
    if (paramErrors[index]?.[field]) {
      setParamErrors(prev => {
        const newErrors = { ...prev };
        if (newErrors[index]) {
          delete newErrors[index][field];
          if (Object.keys(newErrors[index]).length === 0) {
            delete newErrors[index];
          }
        }
        return newErrors;
      });
    }
  };

  // Set up sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end event
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setFormValues(prev => {
        const oldIndex = parseInt(active.id.toString().split('-')[1]);
        const newIndex = parseInt(over.id.toString().split('-')[1]);
        
        return {
          ...prev,
          parameters: arrayMove(prev.parameters, oldIndex, newIndex)
        };
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const newParamErrors: Record<string, Record<string, string>> = {};
    let isValid = true;

    // Validate main form fields
    if (!formValues.identifier) {
      newErrors.identifier = 'Tool ID is required';
      isValid = false;
    } else if (!/^[a-zA-Z0-9_\-:]+$/.test(formValues.identifier)) {
      newErrors.identifier = 'Tool ID can only contain letters, numbers, underscores, hyphens, and colons';
      isValid = false;
    }

    if (!formValues.description) {
      newErrors.description = 'Description is required';
      isValid = false;
    }

    if (!formValues.provider_id) {
      newErrors.provider_id = 'Provider ID is required';
      isValid = false;
    }

    if (!formValues.toolgroup_id) {
      newErrors.toolgroup_id = 'Tool Group ID is required';
      isValid = false;
    }

    // Validate parameters
    formValues.parameters.forEach((param, index) => {
      const paramError: Record<string, string> = {};
      
      if (!param.name) {
        paramError.name = 'Parameter name is required';
        isValid = false;
      } else if (!/^[a-zA-Z0-9_]+$/.test(param.name)) {
        paramError.name = 'Parameter name can only contain letters, numbers, and underscores';
        isValid = false;
      }
      
      if (!param.parameter_type) {
        paramError.parameter_type = 'Parameter type is required';
        isValid = false;
      }
      
      if (!param.description) {
        paramError.description = 'Parameter description is required';
        isValid = false;
      }
      
      // Check for duplicate parameter names
      const duplicateNames = formValues.parameters
        .filter((p, i) => p.name === param.name && i !== index && p.name !== '')
        .length > 0;
        
      if (duplicateNames) {
        paramError.name = 'Parameter name must be unique';
        isValid = false;
      }
      
      if (Object.keys(paramError).length > 0) {
        newParamErrors[index] = paramError;
      }
    });

    setErrors(newErrors);
    setParamErrors(newParamErrors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formValues);
    }
  };

  // Filter tool groups by selected provider
  const filteredToolGroups = formValues.provider_id
    ? toolGroups.filter(tg => tg.provider_id === formValues.provider_id)
    : toolGroups;

  return (
    <Box component={Paper} p={3}>
      <Typography variant="h5" gutterBottom>
        {isEditing ? 'Edit Tool' : 'Create New Tool'}
      </Typography>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Tool ID"
              value={formValues.identifier}
              onChange={(e) => handleChange('identifier', e.target.value)}
              error={!!errors.identifier}
              helperText={errors.identifier || 'Unique identifier for the tool (e.g., "wolfram_alpha")'}
              required
              disabled={isEditing}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={!!errors.provider_id}>
              <InputLabel id="provider-id-label">Provider ID *</InputLabel>
              <Select
                labelId="provider-id-label"
                value={formValues.provider_id}
                onChange={(e) => handleChange('provider_id', e.target.value)}
                label="Provider ID *"
                disabled={isEditing}
              >
                {providers.map(provider => (
                  <MenuItem key={provider} value={provider}>
                    {provider}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>
                {errors.provider_id || 'The provider that owns this tool'}
              </FormHelperText>
            </FormControl>
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
              helperText={errors.description || 'Detailed description of what the tool does'}
              required
            />
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth error={!!errors.toolgroup_id}>
              <InputLabel id="toolgroup-id-label">Tool Group *</InputLabel>
              <Select
                labelId="toolgroup-id-label"
                value={formValues.toolgroup_id}
                onChange={(e) => handleChange('toolgroup_id', e.target.value)}
                label="Tool Group *"
                disabled={!formValues.provider_id}
              >
                {filteredToolGroups.map(toolGroup => (
                  <MenuItem key={toolGroup.identifier} value={toolGroup.identifier}>
                    {toolGroup.name || toolGroup.identifier}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>
                {errors.toolgroup_id || 'The tool group this tool belongs to'}
              </FormHelperText>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Parameters</Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleAddParameter}
              >
                Add Parameter
              </Button>
            </Box>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              {formValues.parameters.length === 0 ? (
                <Typography color="text.secondary" sx={{ my: 2, textAlign: 'center' }}>
                  No parameters defined. Click "Add Parameter" to add one.
                </Typography>
              ) : (
                <SortableContext 
                  items={formValues.parameters.map((_, index) => `param-${index}`)}
                  strategy={verticalListSortingStrategy}
                >
                  {formValues.parameters.map((param, index) => (
                    <SortableParameterItem
                      key={`param-${index}`}
                      param={param}
                      index={index}
                      paramErrors={paramErrors[index]}
                      onParameterChange={handleParameterChange}
                      onRemoveParameter={handleRemoveParameter}
                    />
                  ))}
                </SortableContext>
              )}
            </DndContext>
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
            {loading 
              ? (isEditing ? 'Updating...' : 'Creating...') 
              : (isEditing ? 'Update Tool' : 'Create Tool')}
          </Button>
        </Box>
      </form>
    </Box>
  );
};

export default ToolForm;