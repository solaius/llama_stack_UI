import axios from 'axios';

// Get API URL from localStorage or use default
const getApiBaseUrl = () => {
  const savedApiUrl = localStorage.getItem('apiUrl');
  
  // If there's a saved URL in localStorage, use it
  if (savedApiUrl && savedApiUrl.trim() !== '') {
    return savedApiUrl;
  }
  
  // Otherwise, use the environment variable or default to the proxy path
  return process.env.REACT_APP_API_URL || '/api';
};

// Create axios instance with default config
const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Update baseURL when localStorage changes
window.addEventListener('storage', () => {
  api.defaults.baseURL = getApiBaseUrl();
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

export interface ToolCallFunction {
  name: string;
  arguments: string;
}

export interface ToolCall {
  id: string;
  call_id?: string; // For backward compatibility
  type: string;
  function: ToolCallFunction;
  tool_name?: string; // For backward compatibility
  arguments?: Record<string, any>;
}

export interface ToolResult {
  tool_call_id: string;
  content: any;
  error?: string;
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
  name: string;
  args?: Record<string, any>;
}

export interface SamplingParams {
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  repetition_penalty?: number;
  [key: string]: any;
}

export interface AgentInfo {
  agent_id: string;
  model: string;
  instructions: string;
  name?: string;
  created_by?: string;
}

export interface AgentListResponse {
  agents: AgentInfo[];
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
  name?: string;
}

export interface Agent extends AgentInfo {
  id: string; // For backward compatibility
  config: AgentConfig; // Make this required for backward compatibility
  created_at: string;
  updated_at?: string;
}

export interface SessionInfo {
  session_id: string;
  session_name: string;
  turns: TurnInfo[];
  started_at: string;
}

export interface TurnInfo {
  turn_id: string;
  session_id: string;
  input_messages: Message[];
  steps: any[];
  output_message: Message;
  output_attachments: any[];
  tool_calls?: ToolCall[];
  tool_results?: ToolResult[];
  started_at: string;
  completed_at: string;
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

  createTool: async (toolData: {
    identifier: string;
    description: string;
    provider_id: string;
    toolgroup_id: string;
    parameters: ToolParameter[];
  }): Promise<Tool> => {
    try {
      // Note: The Llama Stack API might not support direct tool creation
      // This is a placeholder for when the API supports it
      const response = await api.post('/v1/tools', toolData);
      return response.data;
    } catch (error) {
      console.warn(`API tool creation failed, using local storage only:`, error);
      // Return a mock response for now
      return {
        identifier: toolData.identifier,
        provider_resource_id: '',
        provider_id: toolData.provider_id,
        type: 'function',
        toolgroup_id: toolData.toolgroup_id,
        tool_host: '',
        description: toolData.description,
        parameters: toolData.parameters,
        metadata: null
      };
    }
  },

  updateTool: async (toolId: string, toolData: {
    description?: string;
    provider_id?: string;
    toolgroup_id?: string;
    parameters?: ToolParameter[];
  }): Promise<Tool> => {
    try {
      // Note: The Llama Stack API might not support tool updates
      // This is a placeholder for when the API supports it
      const response = await api.put(`/v1/tools/${toolId}`, toolData);
      return response.data;
    } catch (error) {
      console.warn(`API tool update failed for ${toolId}, using local storage only:`, error);
      // Return a mock response for now
      return {
        identifier: toolId,
        provider_resource_id: '',
        provider_id: toolData.provider_id || '',
        type: 'function',
        toolgroup_id: toolData.toolgroup_id || '',
        tool_host: '',
        description: toolData.description || '',
        parameters: toolData.parameters || [],
        metadata: null
      };
    }
  },

  deleteTool: async (toolId: string): Promise<void> => {
    try {
      await api.delete(`/v1/tools/${toolId}`);
    } catch (error) {
      console.warn(`API tool deletion failed for ${toolId}:`, error);
      // No action needed for local storage since we'll handle that in the UI
    }
  },

  // Local storage for tools (for UI state management)
  _getToolsFromStorage: (): Tool[] => {
    const storedTools = localStorage.getItem('llamastack_tools');
    if (storedTools) {
      try {
        return JSON.parse(storedTools);
      } catch (e) {
        console.error('Error parsing stored tools:', e);
        return [];
      }
    }
    return [];
  },

  _saveToolsToStorage: (tools: Tool[]): void => {
    localStorage.setItem('llamastack_tools', JSON.stringify(tools));
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
    const eventSource = new EventSource(`${api.defaults.baseURL}/v1/inference/chat-completion?${new URLSearchParams({
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

  // Get the current base URL
  getCurrentBaseUrl: () => {
    return api.defaults.baseURL;
  },
  
  // Update the base URL of the API
  updateBaseUrl: (newUrl: string) => {
    if (newUrl && newUrl.trim() !== '') {
      api.defaults.baseURL = newUrl;
    } else {
      api.defaults.baseURL = process.env.REACT_APP_API_URL || '/api';
    }
    console.log('API base URL updated to:', api.defaults.baseURL);
    return api.defaults.baseURL;
  },

  // Server Health
  getHealth: async () => {
    try {
      // Try the v1 endpoint first (more likely to exist in newer versions)
      const response = await api.get('/v1/health');
      console.log('Health check v1 response:', response.data);
      
      // Add timestamp if not present
      if (!response.data.timestamp) {
        response.data.timestamp = new Date().toISOString();
      }
      
      return response.data;
    } catch (error) {
      console.error('Health check v1 failed:', error);
      
      // Try the root health endpoint as fallback
      try {
        const response = await api.get('/health');
        console.log('Health check root response:', response.data);
        
        // Add timestamp if not present
        if (!response.data.timestamp) {
          response.data.timestamp = new Date().toISOString();
        }
        
        return response.data;
      } catch (secondError) {
        console.error('All health checks failed:', secondError);
        
        // Return a minimal valid response
        return { 
          status: 'Unknown',
          timestamp: new Date().toISOString()
        };
      }
    }
  },

  // Version
  getVersion: async () => {
    try {
      const response = await api.get('/v1/version');
      console.log('Version check response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Version check failed:', error);
      
      // Try alternative version endpoints
      try {
        const response = await api.get('/version');
        console.log('Alternative version check response:', response.data);
        return response.data;
      } catch (secondError) {
        console.error('All version checks failed');
        
        // Return a default version
        return { version: 'Unknown' };
      }
    }
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
      console.log('Creating agent with config:', agentConfig);
      
      // Call the API to create the agent
      const response = await api.post('/v1/agents', { agent_config: agentConfig });
      console.log('Create agent response:', response.data);
      
      // Generate a new agent object with the response data
      const newAgent: Agent = {
        agent_id: response.data.agent_id,
        id: response.data.agent_id, // For backward compatibility
        name: agentConfig.name || '',
        model: agentConfig.model,
        instructions: agentConfig.instructions,
        config: agentConfig,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'User'
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
    try {
      // Try the new list endpoint first
      try {
        const response = await api.get('/v1/agents/list');
        console.log('Agents list response:', response.data);
        
        // Convert AgentInfo[] to Agent[]
        const apiAgents = response.data.agents.map((agentInfo: any) => ({
          agent_id: agentInfo.agent_id,
          id: agentInfo.agent_id, // For backward compatibility
          name: agentInfo.name || agentInfo.config?.name || '',
          model: agentInfo.config?.model || '',
          instructions: agentInfo.config?.instructions || '',
          created_at: new Date().toISOString(),
          created_by: 'System',
          config: {
            ...agentInfo.config,
            // Ensure these fields exist with default values if not provided
            sampling_params: agentInfo.config?.sampling_params || {
              temperature: 0.7,
              top_p: 0.9,
              max_tokens: 1024
            },
            max_infer_iters: agentInfo.config?.max_infer_iters || 10,
            enable_session_persistence: agentInfo.config?.enable_session_persistence || false,
            name: agentInfo.name || agentInfo.config?.name || ''
          }
        }));
        
        // Also save to local storage as backup
        apiService._saveAgentsToStorage(apiAgents);
        
        return apiAgents;
      } catch (listError) {
        console.warn('List endpoint failed, trying to get agents individually:', listError);
        
        // If the list endpoint fails, try to get agents from local storage
        // and verify they exist by making individual GET requests
        const storedAgents = apiService._getAgentsFromStorage();
        const verifiedAgents: Agent[] = [];
        
        for (const agent of storedAgents) {
          try {
            // Try to verify the agent exists by creating a session
            // This is a workaround since there's no direct GET endpoint
            const sessionName = `verify_session_${Date.now()}`;
            const sessionResponse = await api.post(`/v1/agents/${agent.agent_id || agent.id}/session`, {
              session_name: sessionName
            });
            
            if (sessionResponse.data.session_id) {
              // Agent exists, add to verified list
              verifiedAgents.push(agent);
              
              // Clean up the verification session
              try {
                await api.delete(`/v1/agents/${agent.agent_id || agent.id}/session/${sessionResponse.data.session_id}`);
              } catch (deleteError) {
                console.warn(`Could not delete verification session for agent ${agent.agent_id || agent.id}:`, deleteError);
              }
            }
          } catch (verifyError) {
            console.warn(`Agent ${agent.agent_id || agent.id} verification failed, may not exist:`, verifyError);
          }
        }
        
        return verifiedAgents;
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
      
      // Fallback to local storage if all API methods fail
      return apiService._getAgentsFromStorage();
    }
  },

  getAgent: async (agentId: string): Promise<Agent> => {
    try {
      // In the current API, there's no direct endpoint to get a single agent
      // So we'll get all agents and filter
      const agents = await apiService.getAgents();
      const agent = agents.find(agent => agent.agent_id === agentId || agent.id === agentId);
      
      if (agent) {
        return agent;
      }
      
      throw new Error(`Agent ${agentId} not found`);
    } catch (error) {
      console.error(`Error fetching agent ${agentId}:`, error);
      throw error;
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
      
      // Create a properly typed updated agent
      const baseConfig = agents[agentIndex].config || {
        model: '',
        instructions: '',
        name: '',
        sampling_params: {
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 1024
        },
        max_infer_iters: 10,
        enable_session_persistence: false
      };
      
      const updatedAgent: Agent = {
        ...agents[agentIndex],
        agent_id: agents[agentIndex].agent_id || agents[agentIndex].id,
        id: agents[agentIndex].id || agents[agentIndex].agent_id,
        name: agentConfig.name || agents[agentIndex].name || '',
        model: agentConfig.model || baseConfig.model,
        instructions: agentConfig.instructions || baseConfig.instructions,
        config: {
          ...baseConfig,
          ...agentConfig
        },
        created_at: agents[agentIndex].created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: agents[agentIndex].created_by || 'User'
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
      console.log(`Deleting agent ${agentId}`);
      
      // Try to delete via API
      await api.delete(`/v1/agents/${agentId}`);
      console.log(`Agent ${agentId} deleted successfully`);
      
      // Remove from localStorage
      const agents = apiService._getAgentsFromStorage();
      const updatedAgents = agents.filter(a => a.agent_id !== agentId && a.id !== agentId);
      apiService._saveAgentsToStorage(updatedAgents);
    } catch (error) {
      console.error(`Error deleting agent ${agentId}:`, error);
      
      // If API fails, still try to remove from local storage
      try {
        const agents = apiService._getAgentsFromStorage();
        const updatedAgents = agents.filter(a => a.agent_id !== agentId && a.id !== agentId);
        apiService._saveAgentsToStorage(updatedAgents);
        console.log(`Agent ${agentId} removed from local storage`);
      } catch (storageError) {
        console.error(`Error removing agent ${agentId} from local storage:`, storageError);
      }
      
      throw error;
    }
  },
  
  // Create a session for an agent
  createAgentSession: async (agentId: string, sessionName: string): Promise<string> => {
    try {
      console.log(`Creating session for agent ${agentId} with name "${sessionName}"`);
      const response = await api.post(`/v1/agents/${agentId}/session`, {
        session_name: sessionName
      });
      
      console.log('Create session response:', response.data);
      return response.data.session_id;
    } catch (error) {
      console.error(`Error creating session for agent ${agentId}:`, error);
      throw error;
    }
  },
  
  // Get a session
  getAgentSession: async (agentId: string, sessionId: string): Promise<SessionInfo> => {
    try {
      console.log(`Getting session ${sessionId} for agent ${agentId}`);
      const response = await api.get(`/v1/agents/${agentId}/session/${sessionId}`);
      console.log('Get session response:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Error getting session ${sessionId} for agent ${agentId}:`, error);
      throw error;
    }
  },
  
  // Delete a session
  deleteAgentSession: async (agentId: string, sessionId: string): Promise<void> => {
    try {
      console.log(`Deleting session ${sessionId} for agent ${agentId}`);
      await api.delete(`/v1/agents/${agentId}/session/${sessionId}`);
      console.log(`Session ${sessionId} deleted successfully`);
    } catch (error) {
      console.error(`Error deleting session ${sessionId} for agent ${agentId}:`, error);
      throw error;
    }
  },
  
  // Create a turn in a session
  createAgentTurn: async (
    agentId: string, 
    sessionId: string, 
    messages: Message[], 
    stream: boolean = false,
    documents: any[] = [],
    toolgroups: (string | AgentToolGroupWithArgs)[] = []
  ): Promise<TurnInfo> => {
    try {
      console.log(`Creating turn for session ${sessionId}, agent ${agentId}`);
      console.log('Turn request:', { messages, stream, documents, toolgroups });
      
      const response = await api.post(`/v1/agents/${agentId}/session/${sessionId}/turn`, {
        messages,
        stream,
        documents,
        toolgroups
      });
      
      console.log('Create turn response:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Error creating turn for session ${sessionId}, agent ${agentId}:`, error);
      throw error;
    }
  }
  
};

export default apiService;