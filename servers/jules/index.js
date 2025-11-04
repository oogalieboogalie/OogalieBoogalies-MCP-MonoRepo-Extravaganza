#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import fetch from 'node-fetch';

const JULES_API_URL = 'https://jules.googleapis.com/v1alpha';
const JULES_API_KEY = process.env.JULES_API_KEY;

if (!JULES_API_KEY) {
  console.error('Error: JULES_API_KEY environment variable is required');
  process.exit(1);
}

// Jules API functions
async function listSources() {
  const response = await fetch(`${JULES_API_URL}/sources`, {
    headers: {
      'X-Goog-Api-Key': JULES_API_KEY,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Failed to list Jules sources: ${errorData.error?.message || response.statusText}`);
  }

  return response.json();
}

async function createSession(source, prompt, title, branch = 'main') {
  const response = await fetch(`${JULES_API_URL}/sessions`, {
    method: 'POST',
    headers: {
      'X-Goog-Api-Key': JULES_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      sourceContext: {
        source,
        githubRepoContext: {
          startingBranch: branch,
        },
      },
      title,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Failed to create Jules session: ${errorData.error?.message || response.statusText}`);
  }

  return response.json();
}

async function getSession(sessionId) {
  const response = await fetch(`${JULES_API_URL}/${sessionId}`, {
    headers: {
      'X-Goog-Api-Key': JULES_API_KEY,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Failed to get Jules session: ${errorData.error?.message || response.statusText}`);
  }

  return response.json();
}

// Create MCP server
const server = new Server(
  {
    name: 'jules-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define MCP tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'jules_list_sources',
        description: 'List all available repositories/sources that Jules can work on. Returns a list of sources with their names and metadata.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'jules_submit_task',
        description: 'Submit a single task to Jules for execution. Jules will work on the task in the specified source/repository and return a session ID for tracking. Jules has persistent memory per repo and internet access.',
        inputSchema: {
          type: 'object',
          properties: {
            source: {
              type: 'string',
              description: 'The source/repository identifier where Jules should work (e.g., "sources/github/owner/repo")',
            },
            prompt: {
              type: 'string',
              description: 'Detailed task description for Jules to execute',
            },
            title: {
              type: 'string',
              description: 'Short title for the task',
            },
            branch: {
              type: 'string',
              description: 'Git branch to start from (optional, defaults to "main")',
            },
          },
          required: ['source', 'prompt', 'title'],
        },
      },
      {
        name: 'jules_check_status',
        description: 'Check the status and results of a Jules task by session ID. Returns current state, progress, and any completed results.',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'The session ID returned from jules_submit_task',
            },
          },
          required: ['sessionId'],
        },
      },
      {
        name: 'jules_submit_batch',
        description: 'Submit multiple tasks to Jules in parallel. Takes advantage of Jules\'s 60 concurrent task limit for maximum parallelization. Returns an array of session IDs.',
        inputSchema: {
          type: 'object',
          properties: {
            tasks: {
              type: 'array',
              description: 'Array of tasks to submit in parallel',
              items: {
                type: 'object',
                properties: {
                  source: {
                    type: 'string',
                    description: 'The source/repository identifier',
                  },
                  prompt: {
                    type: 'string',
                    description: 'Task description',
                  },
                  title: {
                    type: 'string',
                    description: 'Task title',
                  },
                },
                required: ['source', 'prompt', 'title'],
              },
            },
          },
          required: ['tasks'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'jules_list_sources': {
        const sources = await listSources();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(sources, null, 2),
            },
          ],
        };
      }

      case 'jules_submit_task': {
        const { source, prompt, title, branch } = args;
        if (!source || !prompt || !title) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'Missing required parameters: source, prompt, and title are required'
          );
        }

        const session = await createSession(source, prompt, title, branch);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                sessionId: session.name,
                status: 'Task submitted successfully',
                session,
              }, null, 2),
            },
          ],
        };
      }

      case 'jules_check_status': {
        const { sessionId } = args;
        if (!sessionId) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'Missing required parameter: sessionId'
          );
        }

        const session = await getSession(sessionId);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(session, null, 2),
            },
          ],
        };
      }

      case 'jules_submit_batch': {
        const { tasks } = args;
        if (!tasks || !Array.isArray(tasks)) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'Missing required parameter: tasks (must be an array)'
          );
        }

        // Submit all tasks in parallel
        const sessionPromises = tasks.map(task =>
          createSession(task.source, task.prompt, task.title, task.branch)
        );

        const sessions = await Promise.all(sessionPromises);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                totalTasks: tasks.length,
                sessions: sessions.map(s => ({
                  sessionId: s.name,
                  title: tasks.find(t => t.title)?.title,
                })),
                message: `Successfully submitted ${tasks.length} tasks in parallel`,
              }, null, 2),
            },
          ],
        };
      }

      default:
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${name}`
        );
    }
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    throw new McpError(
      ErrorCode.InternalError,
      `Tool execution failed: ${error.message}`
    );
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Jules MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
