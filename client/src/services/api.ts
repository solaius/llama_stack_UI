import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types for API responses
export interface Model {
  identifier: string;
  provider_resource_id: string;
  provider_id: string;
  type: string;
  metadata: Record<string, any>;
  model_type: string;
}

export interface Tool {
  identifier: string;
  provider_resource_id: string;
  provider_id: string;
  type: string;
  toolgroup_id: string;
  tool_host: string;
  description: string;
  parameters: ToolParameter[];
  metadata: Record<string, any> | null;
}

export interface ToolParameter {
  name: string;
  parameter_type: string;
  description: string;
  required: boolean;
  default: any | null;
}

export interface ToolGroup {
  identifier: string;
  name: string;
  description: string;
  tools: string[];
}

export interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_calls?: ToolCall[];
  call_id?: string;
  tool_name?: string;
}

export interface ToolCall {
  call_id: string;
  tool_name: string;
  arguments: Record<string, any>;
}

export interface ChatCompletionRequest {
  model_id: string;
  messages: Message[];
  tools?: ToolDefinition[];
  tool_choice?: 'auto' | 'required' | 'none' | string;
  stream?: boolean;
  temperature?: number;
  top_p?: number;
  top_k?: number;
  max_tokens?: number;
}

export interface ToolDefinition {
  tool_name: string;
  description?: string;
  parameters?: Record<string, ToolParameterDefinition>;
}

export interface ToolParameterDefinition {
  param_type: string;
  description?: string;
  required?: boolean;
  default?: any;
}

export interface AgentToolGroupWithArgs {
  toolgroup_id: string;
  args?: Record<string, any>;
}

export interface SamplingParams {
  strategy: {
    type: 'greedy' | 'top_p' | 'top_k';
    p?: number;
    k?: number;
  };
  max_tokens: number;
  repetition_penalty: number;
}

export interface ToolConfig {
  tool_choice?: 'auto' | 'required' | 'none';
  tool_prompt_format?: 'json' | 'xml' | 'yaml';
}

export interface AgentConfig {
  model: string;
  instructions: string;
  sampling_params?: SamplingParams;
  input_shields?: string[];
  output_shields?: string[];
  toolgroups?: (string | AgentToolGroupWithArgs)[];
  client_tools?: ToolDefinition[];
  tool_config?: ToolConfig;
  max_infer_iters?: number;
  enable_session_persistence?: boolean;
  response_format?: any;
}

export interface Agent {
  id: string;
  config: AgentConfig;
  created_at: string;
  updated_at: string;
}

export interface ChatCompletionResponse {
  metrics: any;
  completion_message: {
    role: string;
    content: string;
    stop_reason: string;
    tool_calls: ToolCall[];
  };
  logprobs: any;
}

export interface StreamingChatCompletionResponse {
  metrics: any;
  event: {
    event_type: 'start' | 'progress' | 'end';
    delta: {
      type: string;
      text: string;
    };
    logprobs: any;
    stop_reason: string | null;
  };
}

// API functions
export const apiService = {
  // Models
  getModels: async (): Promise<Model[]> => {
    const response = await api.get('/v1/models');
    return response.data.data;
  },

  getModel: async (modelId: string): Promise<Model> => {
    const response = await api.get(`/v1/models/${modelId}`);
    return response.data;
  },

  // Tools
  getTools: async (): Promise<Tool[]> => {
    const response = await api.get('/v1/tools');
    return response.data.data;
  },

  getTool: async (toolName: string): Promise<Tool> => {
    const response = await api.get(`/v1/tools/${toolName}`);
    return response.data;
  },

  // Tool Groups
  getToolGroups: async (): Promise<ToolGroup[]> => {
    const response = await api.get('/v1/toolgroups');
    return response.data.data;
  },

  getToolGroup: async (toolGroupId: string): Promise<ToolGroup> => {
    const response = await api.get(`/v1/toolgroups/${toolGroupId}`);
    return response.data;
  },

  // Chat Completion
  createChatCompletion: async (request: ChatCompletionRequest): Promise<ChatCompletionResponse> => {
    const response = await api.post('/v1/inference/chat-completion', request);
    return response.data;
  },

  // Streaming Chat Completion
  createStreamingChatCompletion: (request: ChatCompletionRequest) => {
    // Set stream to true
    request.stream = true;
    
    // Create event source for streaming
    const eventSource = new EventSource(`${API_BASE_URL}/v1/inference/chat-completion?${new URLSearchParams({
      request: JSON.stringify(request)
    })}`);
    
    return eventSource;
  },

  // Tool Invocation
  invokeTool: async (toolName: string, args: Record<string, any>) => {
    const response = await api.post('/v1/tool-runtime/invoke', {
      tool_name: toolName,
      arguments: args
    });
    return response.data;
  },

  // Server Health
  getHealth: async () => {
    const response = await api.get('/health');
    return response.data;
  },

  // Version
  getVersion: async () => {
    const response = await api.get('/v1/version');
    return response.data;
  },

  // Agents
  createAgent: async (agentConfig: AgentConfig): Promise<Agent> => {
    const response = await api.post('/v1/agents', { agent_config: agentConfig });
    return response.data;
  },

  getAgents: async (): Promise<Agent[]> => {
    try {
      // This is a workaround since the API doesn't have a direct endpoint to list all agents
      // In a real implementation, we would use a proper endpoint
      const response = await api.get('/v1/agents/list');
      return response.data.agents || [];
    } catch (error) {
      console.error('Error fetching agents:', error);
      // For now, return an empty array
      return [];
    }
  },

  getAgent: async (agentId: string): Promise<Agent> => {
    const response = await api.get(`/v1/agents/${agentId}`);
    return response.data;
  },

  updateAgent: async (agentId: string, agentConfig: Partial<AgentConfig>): Promise<Agent> => {
    const response = await api.put(`/v1/agents/${agentId}`, { agent_config: agentConfig });
    return response.data;
  },

  deleteAgent: async (agentId: string): Promise<void> => {
    await api.delete(`/v1/agents/${agentId}`);
  }
};

export default apiService;