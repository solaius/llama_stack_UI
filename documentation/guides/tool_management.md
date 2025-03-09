# Tool Management Guide

This guide provides detailed instructions on how to manage tools and tool groups in the Llama Stack UI.

## What are Tools?

Tools are functions that agents can use to perform specific tasks, such as:

- Searching the web
- Retrieving information from databases
- Performing calculations
- Generating images
- Executing code
- And many other capabilities

Tools extend an agent's abilities beyond just generating text, allowing it to interact with external systems and data sources.

## Tool List

The Tool List page displays all available tools with their basic information:

- **Name**: The tool's display name
- **Description**: What the tool does
- **Parameters**: What inputs the tool requires
- **Source**: Where the tool comes from (system, custom, etc.)

### Filtering Tools

You can use the search bar at the top of the Tool List to filter tools by name or description.

## Tool Groups

Tool groups are collections of tools that can be assigned to agents. Using tool groups makes it easier to manage which tools are available to different agents.

### Viewing Tool Groups

To view existing tool groups:

1. Navigate to the Tools page
2. Click on the "Tool Groups" tab
3. The list shows all available tool groups with their names, descriptions, and the number of tools in each group

### Creating a Tool Group

To create a new tool group:

1. Click the **Create New Tool Group** button at the top of the Tool Groups page
2. Fill in the required information:
   - **Name**: A descriptive name for your tool group
   - **Description**: (Optional) What this tool group is for
3. Select the tools to include in the group:
   - Browse the available tools list
   - Check the boxes next to the tools you want to include
   - You can use the search function to find specific tools
4. Click **Create** to save your new tool group

### Editing a Tool Group

To edit an existing tool group:

1. Find the tool group in the list
2. Click the **Edit** button (pencil icon) in the Actions column
3. Modify the name, description, or selected tools
4. Click **Save** to apply your changes

### Deleting a Tool Group

To delete a tool group:

1. Find the tool group in the list
2. Click the **Delete** button (trash icon) in the Actions column
3. Confirm the deletion in the dialog that appears

**Note**: Deleting a tool group does not delete the tools themselves, only the grouping.

## Assigning Tool Groups to Agents

To make tools available to an agent:

1. Navigate to the Agents page
2. Create a new agent or edit an existing one
3. In the agent configuration, find the "Tool Configuration" section
4. Select one or more tool groups from the dropdown menu
5. Save the agent configuration

## Tool Testing

You can test tools directly from the UI to see how they work:

1. Navigate to the Tools page
2. Find the tool you want to test
3. Click the **Test** button (play icon) in the Actions column
4. Enter the required parameters in the test dialog
5. Click **Run** to execute the tool
6. View the results in the response section

## Tool Details

To view detailed information about a tool:

1. Click on the tool's name in the Tool List
2. The Tool Details page shows:
   - Basic information (name, description)
   - Parameter specifications
   - Return type information
   - Usage examples
   - Usage statistics (which agents use this tool and how often)

## Best Practices

### Tool Selection

- Only give agents access to tools they need for their specific tasks
- Consider security implications when assigning powerful tools
- Group related tools together for easier management

### Tool Groups Organization

- Create purpose-specific tool groups (e.g., "Research Tools", "Code Tools", "Math Tools")
- Keep tool groups focused on specific capabilities
- Use clear, descriptive names for tool groups

### Testing

- Always test tools before assigning them to production agents
- Try different parameter combinations to understand tool behavior
- Check how tools handle edge cases and errors

## Troubleshooting

### Tool Execution Errors

If a tool fails to execute properly:

1. Check that all required parameters are provided correctly
2. Verify that any external services the tool depends on are available
3. Look for error messages in the tool response
4. Check the server logs for more detailed error information

### Tool Not Available to Agent

If an agent can't access a tool:

1. Verify that the tool is included in a tool group assigned to the agent
2. Check that the agent's tool configuration is set up correctly
3. Make sure the tool is still available in the system
4. Try updating the agent's configuration and saving again