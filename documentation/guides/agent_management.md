# Agent Management Guide

This guide provides detailed instructions on how to manage agents in the Llama Stack UI.

## What are Agents?

Agents are AI assistants powered by large language models (LLMs) that can be configured with specific instructions, tools, and parameters to perform various tasks. Each agent has its own personality, capabilities, and limitations based on its configuration.

## Agent List

The Agent List page displays all available agents with their basic information:

- **Name**: The agent's display name
- **ID**: Unique identifier for the agent
- **System Prompt**: Brief preview of the agent's instructions
- **Created**: When the agent was created
- **Created By**: Who created the agent
- **Actions**: Available actions for each agent

### Filtering Agents

You can use the search bar at the top of the Agent List to filter agents by name, ID, or system prompt content.

## Creating a New Agent

To create a new agent:

1. Click the **Create New Agent** button at the top of the Agent List page
2. Fill in the required information:
   - **Name**: A descriptive name for your agent
   - **Model**: Select the language model to power your agent
   - **System Prompt**: Instructions that define your agent's behavior, personality, and capabilities
3. Configure additional settings:
   - **Sampling Parameters**: Control how the model generates responses
   - **Tool Configuration**: Specify which tools the agent can use
   - **Response Format**: Define the structure of the agent's responses
4. Click **Create** to save your new agent

## Editing an Agent

To edit an existing agent:

1. Find the agent in the Agent List
2. Click the **Edit** button (pencil icon) in the Actions column
3. Modify any of the agent's settings
4. Click **Save** to apply your changes

## Agent Details

To view detailed information about an agent:

1. Click on the agent's name in the Agent List
2. The Agent Details page shows:
   - Basic information (name, ID, model)
   - System prompt
   - Configuration settings
   - Chat sessions
   - Tool usage statistics

### Agent Configuration

The Configuration tab in Agent Details shows:

- **Sampling Parameters**: How the model generates text
  - **Strategy**: The sampling strategy (greedy, temperature, top-p, etc.)
  - **Max Tokens**: Maximum response length
  - **Repetition Penalty**: How strongly to penalize repetition
  
- **Tool Configuration**: How the agent uses tools
  - **Tool Choice**: How the agent decides when to use tools
  - **Tool Prompt Format**: Format for tool inputs/outputs
  - **System Message Behavior**: How tool instructions are incorporated

### Chat Sessions

The Sessions tab shows all chat conversations with this agent. You can:

- View past conversations
- Continue existing sessions
- Start new sessions
- Delete sessions

### Tool Usage

The Tool Usage tab shows statistics about which tools the agent has used most frequently and how they've been used.

## Deleting an Agent

To delete an agent:

1. Find the agent in the Agent List
2. Click the **Delete** button (trash icon) in the Actions column
3. Confirm the deletion in the dialog that appears

**Note**: Deleting an agent is permanent and will also remove all associated chat sessions.

## Duplicating an Agent

To create a copy of an existing agent:

1. Find the agent in the Agent List
2. Click the **Duplicate** button (copy icon) in the Actions column
3. The agent creation form will open with all settings copied from the original agent
4. Modify any settings as needed
5. Click **Create** to save the new agent

## Best Practices

### System Prompts

- Be specific and clear about what you want the agent to do
- Define the agent's personality, tone, and style
- Specify any constraints or limitations
- Include examples of desired behavior when helpful

### Tool Configuration

- Only enable tools that the agent needs
- Consider using "auto" for tool choice to let the agent decide when to use tools
- Test your agent with different tool configurations to find the optimal setup

### Sampling Parameters

- Use higher temperature (0.7-0.9) for more creative responses
- Use lower temperature (0.1-0.3) for more factual, deterministic responses
- Adjust max tokens based on your expected response length
- Increase repetition penalty if you notice the agent repeating itself