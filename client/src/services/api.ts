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
  name?: string;
  description?: string;
  tools?: string[];
  provider_id?: string;
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

  createToolGroup: async (toolGroupData: {
    toolgroup_id: string;
    provider_id: string;
    mcp_endpoint?: string;
    args?: Record<string, any>;
  }): Promise<ToolGroup> => {
    const response = await api.post('/v1/toolgroups', toolGroupData);
    return response.data;
  },

  updateToolGroup: async (toolGroupId: string, toolGroupData: {
    provider_id: string;
    mcp_endpoint?: string;
    args?: Record<string, any>;
  }): Promise<ToolGroup> => {
    try {
      // Note: The Llama Stack API might not support PUT for tool groups
      // This is a placeholder for when the API supports it
      const response = await api.put(`/v1/toolgroups/${toolGroupId}`, toolGroupData);
      return response.data;
    } catch (error) {
      console.warn(`API update failed for tool group ${toolGroupId}, using local storage only:`, error);
      // Return a mock response for now
      return {
        identifier: toolGroupId,
        // Other fields will be handled by the UI
      };
    }
  },

  deleteToolGroup: async (toolGroupId: string): Promise<void> => {
    await api.delete(`/v1/toolgroups/${toolGroupId}`);
  },

  // Local storage for tools and tool groups (for UI state management)
  _getToolGroupsFromStorage: (): ToolGroup[] => {
    const storedToolGroups = localStorage.getItem('llamastack_toolgroups');
    if (storedToolGroups) {
      try {
        return JSON.parse(storedToolGroups);
      } catch (e) {
        console.error('Error parsing stored tool groups:', e);
        return [];
      }
    }
    return [];
  },

  _saveToolGroupsToStorage: (toolGroups: ToolGroup[]): void => {
    localStorage.setItem('llamastack_toolgroups', JSON.stringify(toolGroups));
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

  // Agents - Local Storage Implementation
  // Since the Llama Stack API doesn't have a GET endpoint to list all agents,
  // we'll use localStorage to maintain our own list of agents
  
  // Helper function to get agents from localStorage
  _getAgentsFromStorage: (): Agent[] => {
    const storedAgents = localStorage.getItem('llamastack_agents');
    if (storedAgents) {
      try {
        return JSON.parse(storedAgents);
      } catch (e) {
        console.error('Error parsing stored agents:', e);
        return [];
      }
    }
    return [];
  },

  // Helper function to save agents to localStorage
  _saveAgentsToStorage: (agents: Agent[]): void => {
    localStorage.setItem('llamastack_agents', JSON.stringify(agents));
  },

  createAgent: async (agentConfig: AgentConfig): Promise<Agent> => {
    try {
      // Call the API to create the agent
      const response = await api.post('/v1/agents', { agent_config: agentConfig });
      
      // Generate a new agent object with the response data
      const newAgent: Agent = {
        id: response.data.agent_id || `agent-${Date.now()}`,
        config: agentConfig,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Add to our local storage
      const currentAgents = apiService._getAgentsFromStorage();
      apiService._saveAgentsToStorage([...currentAgents, newAgent]);
      
      return newAgent;
    } catch (error) {
      console.error('Error creating agent:', error);
      throw error;
    }
  },

  getAgents: async (): Promise<Agent[]> => {
    // Return agents from localStorage
    return apiService._getAgentsFromStorage();
  },

  getAgent: async (agentId: string): Promise<Agent> => {
    // First try to get from localStorage
    const agents = apiService._getAgentsFromStorage();
    const agent = agents.find(a => a.id === agentId);
    
    if (agent) {
      return agent;
    }
    
    // If not found in localStorage, try the API (though this might not work)
    try {
      const response = await api.get(`/v1/agents/${agentId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching agent ${agentId}:`, error);
      throw new Error(`Agent ${agentId} not found`);
    }
  },

  updateAgent: async (agentId: string, agentConfig: Partial<AgentConfig>): Promise<Agent> => {
    try {
      // Try to update via API (this might not work if the endpoint doesn't exist)
      try {
        await api.put(`/v1/agents/${agentId}`, { agent_config: agentConfig });
      } catch (error) {
        console.warn(`API update failed for agent ${agentId}, updating local storage only:`, error);
      }
      
      // Update in localStorage regardless of API success
      const agents = apiService._getAgentsFromStorage();
      const agentIndex = agents.findIndex(a => a.id === agentId);
      
      if (agentIndex === -1) {
        throw new Error(`Agent ${agentId} not found`);
      }
      
      const updatedAgent: Agent = {
        ...agents[agentIndex],
        config: {
          ...agents[agentIndex].config,
          ...agentConfig
        },
        updated_at: new Date().toISOString()
      };
      
      agents[agentIndex] = updatedAgent;
      apiService._saveAgentsToStorage(agents);
      
      return updatedAgent;
    } catch (error) {
      console.error(`Error updating agent ${agentId}:`, error);
      throw error;
    }
  },

  deleteAgent: async (agentId: string): Promise<void> => {
    try {
      // Try to delete via API
      try {
        await api.delete(`/v1/agents/${agentId}`);
      } catch (error) {
        console.warn(`API delete failed for agent ${agentId}, removing from local storage only:`, error);
      }
      
      // Remove from localStorage regardless of API success
      const agents = apiService._getAgentsFromStorage();
      const updatedAgents = agents.filter(a => a.id !== agentId);
      apiService._saveAgentsToStorage(updatedAgents);
    } catch (error) {
      console.error(`Error deleting agent ${agentId}:`, error);
      throw error;
    }
  }
};

export default apiService;