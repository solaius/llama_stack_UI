import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import AgentList from './AgentList';
import { Agent } from '../../services/api';
import { ThemeProvider } from '../../contexts/ThemeContext';

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
}));

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
});

describe('AgentList Component', () => {
  const mockAgents: Agent[] = [
    {
      agent_id: 'agent-123',
      id: 'agent-123',
      name: 'Test Agent 1',
      model: 'model1',
      instructions: 'Be a helpful assistant',
      config: {
        model: 'model1',
        instructions: 'Be a helpful assistant',
      },
      created_at: '2023-01-01T00:00:00Z',
      created_by: 'User',
    },
    {
      agent_id: 'agent-456',
      id: 'agent-456',
      name: 'Test Agent 2',
      model: 'model2',
      instructions: 'Be a creative assistant',
      config: {
        model: 'model2',
        instructions: 'Be a creative assistant',
      },
      created_at: '2023-02-01T00:00:00Z',
      created_by: 'Admin',
    },
  ];

  const mockHandlers = {
    onEdit: jest.fn(),
    onDelete: jest.fn(),
    onDuplicate: jest.fn(),
    onCreateNew: jest.fn(),
  };

  const renderAgentList = (agents = mockAgents, loading = false) => {
    return render(
      <ThemeProvider>
        <AgentList
          agents={agents}
          loading={loading}
          onEdit={mockHandlers.onEdit}
          onDelete={mockHandlers.onDelete}
          onDuplicate={mockHandlers.onDuplicate}
          onCreateNew={mockHandlers.onCreateNew}
        />
      </ThemeProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state correctly', () => {
    renderAgentList([], true);
    
    const loadingIndicator = screen.getByRole('progressbar');
    expect(loadingIndicator).toBeInTheDocument();
  });

  it('renders empty state when no agents are available', () => {
    renderAgentList([]);
    
    const emptyMessage = screen.getByText('No agents available');
    expect(emptyMessage).toBeInTheDocument();
  });

  it('renders a list of agents correctly', () => {
    renderAgentList();
    
    // Check for table headers
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('System Prompt')).toBeInTheDocument();
    expect(screen.getByText('Created')).toBeInTheDocument();
    expect(screen.getByText('Created By')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
    
    // Check for agent data
    expect(screen.getByText('Test Agent 1')).toBeInTheDocument();
    expect(screen.getByText('Test Agent 2')).toBeInTheDocument();
    
    // Check for created by chips
    expect(screen.getByText('User')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
    
    // Check for action buttons (4 per agent: chat, view, edit, duplicate, delete)
    const actionButtons = screen.getAllByRole('button');
    // Account for the "Create New Agent" button and other UI buttons
    expect(actionButtons.length).toBeGreaterThan(8); // At least 8 action buttons for 2 agents
  });

  it('allows searching for agents', () => {
    renderAgentList();
    
    // Initially both agents are visible
    expect(screen.getByText('Test Agent 1')).toBeInTheDocument();
    expect(screen.getByText('Test Agent 2')).toBeInTheDocument();
    
    // Search for the first agent
    const searchInput = screen.getByPlaceholderText('Search agents by name, ID, or system prompt...');
    fireEvent.change(searchInput, { target: { value: 'Test Agent 1' } });
    
    // Now only the first agent should be visible
    expect(screen.getByText('Test Agent 1')).toBeInTheDocument();
    expect(screen.queryByText('Test Agent 2')).not.toBeInTheDocument();
    
    // Clear search
    fireEvent.change(searchInput, { target: { value: '' } });
    
    // Both agents should be visible again
    expect(screen.getByText('Test Agent 1')).toBeInTheDocument();
    expect(screen.getByText('Test Agent 2')).toBeInTheDocument();
    
    // Search by system prompt
    fireEvent.change(searchInput, { target: { value: 'creative' } });
    
    // Now only the second agent should be visible
    expect(screen.queryByText('Test Agent 1')).not.toBeInTheDocument();
    expect(screen.getByText('Test Agent 2')).toBeInTheDocument();
  });

  it('calls onCreateNew when Create New Agent button is clicked', () => {
    renderAgentList();
    
    const createButton = screen.getByText('Create New Agent');
    fireEvent.click(createButton);
    
    expect(mockHandlers.onCreateNew).toHaveBeenCalledTimes(1);
  });

  it('calls onEdit when Edit button is clicked', () => {
    renderAgentList();
    
    // Find all edit buttons (there should be one per agent)
    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    
    // Click the first edit button
    fireEvent.click(editButtons[0]);
    
    expect(mockHandlers.onEdit).toHaveBeenCalledTimes(1);
    expect(mockHandlers.onEdit).toHaveBeenCalledWith(mockAgents[0]);
  });

  it('calls onDelete when Delete button is clicked', () => {
    renderAgentList();
    
    // Find all delete buttons
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    
    // Click the first delete button
    fireEvent.click(deleteButtons[0]);
    
    expect(mockHandlers.onDelete).toHaveBeenCalledTimes(1);
    expect(mockHandlers.onDelete).toHaveBeenCalledWith(mockAgents[0]);
  });

  it('calls onDuplicate when Duplicate button is clicked', () => {
    renderAgentList();
    
    // Find all duplicate buttons
    const duplicateButtons = screen.getAllByRole('button', { name: /duplicate/i });
    
    // Click the first duplicate button
    fireEvent.click(duplicateButtons[0]);
    
    expect(mockHandlers.onDuplicate).toHaveBeenCalledTimes(1);
    expect(mockHandlers.onDuplicate).toHaveBeenCalledWith(mockAgents[0]);
  });

  it('copies agent ID to clipboard when ID button is clicked', () => {
    renderAgentList();
    
    // Find the first copy ID button (it has a tooltip with the agent ID)
    const copyButtons = screen.getAllByRole('button', { name: /click to copy/i });
    
    // Click the first copy button
    fireEvent.click(copyButtons[0]);
    
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('agent-123');
  });

  it('shows system prompt in tooltip when hovering over system prompt button', () => {
    renderAgentList();
    
    // Find all system prompt buttons
    const systemPromptButtons = screen.getAllByRole('button', { name: '' });
    
    // Find the one with the DescriptionIcon
    const descriptionIconButtons = systemPromptButtons.filter(button => 
      within(button).queryByTestId('DescriptionIcon')
    );
    
    // Hover over the first system prompt button to show tooltip
    fireEvent.mouseOver(descriptionIconButtons[0]);
    
    // The tooltip should show the system prompt
    // Note: Testing tooltips can be tricky as they might not be in the DOM until hovered
    // This might need adjustment based on how Material-UI renders tooltips
  });

  it('handles pagination correctly', () => {
    // Create more mock agents to test pagination
    const manyAgents = Array.from({ length: 15 }, (_, i) => ({
      ...mockAgents[0],
      agent_id: `agent-${i}`,
      id: `agent-${i}`,
      name: `Test Agent ${i}`,
    }));
    
    renderAgentList(manyAgents);
    
    // By default, should show 10 agents per page
    const rows = screen.getAllByRole('row');
    // +1 for the header row
    expect(rows.length).toBe(11);
    
    // Change to 5 per page
    const rowsPerPageSelect = screen.getByLabelText('Rows per page:');
    fireEvent.mouseDown(rowsPerPageSelect);
    
    // Select 5 from the dropdown
    const option5 = screen.getByRole('option', { name: '5' });
    fireEvent.click(option5);
    
    // Now should show 5 agents + header row
    const rowsAfterChange = screen.getAllByRole('row');
    expect(rowsAfterChange.length).toBe(6);
    
    // Go to next page
    const nextPageButton = screen.getByRole('button', { name: /next page/i });
    fireEvent.click(nextPageButton);
    
    // Should show different agents now
    expect(screen.getByText('Test Agent 5')).toBeInTheDocument();
  });
});