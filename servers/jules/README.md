# Jules MCP Server

**Bridge Claude Code to Jules API for parallel AI task execution** 🚀

This MCP (Model Context Protocol) server allows Claude Code and other MCP clients to delegate tasks to Jules, Google's flagship coding AI with:
- ✅ **60 concurrent tasks** - Massive parallelization power
- ✅ **Persistent memory per repo** - Jules remembers context
- ✅ **Internet access** - Can research and fetch documentation
- ✅ **Code generation expertise** - Boilerplates, implementations, refactoring

## Why This MCP?

**Claude + Jules = Dream Team**
- **Claude**: Planning, architecture, system design, orchestration
- **Jules**: Parallel execution, boilerplate generation, research, implementation

Instead of Claude doing everything sequentially, Claude can now say:
> "Jules, implement these 10 components in parallel while I work on the architecture"

## Installation

```bash
cd D:\Git Projects\JulesO2G\mcp-server
npm install
```

## Setup

1. **Get your Jules API key** from [Google AI Studio](https://aistudio.google.com/)

2. **Create `.env` file**:
```bash
cp .env.example .env
```

3. **Add your API key** to `.env`:
```
JULES_API_KEY=your_actual_api_key_here
```

## Configure Claude Code

Add this MCP server to your Claude Code configuration:

**On Windows**: Edit `%APPDATA%\Claude\claude_desktop_config.json`
**On Mac/Linux**: Edit `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "jules": {
      "command": "node",
      "args": ["D:\\Git Projects\\JulesO2G\\mcp-server\\index.js"],
      "env": {
        "JULES_API_KEY": "your_jules_api_key_here"
      }
    }
  }
}
```

**Restart Claude Code** after adding the configuration.

## Available Tools

Once configured, Claude Code will have access to these tools:

### 🔍 `jules_list_sources`
List all repositories/sources Jules can work on.

**Example**:
```
Claude, can you list my Jules sources?
```

### 📝 `jules_submit_task`
Submit a single task to Jules.

**Parameters**:
- `source` - Repository identifier (from `jules_list_sources`)
- `prompt` - Detailed task description
- `title` - Short task title

**Example**:
```
Claude, submit a task to Jules:
- Source: projects/123/sources/456
- Title: "Create login component"
- Prompt: "Build a React login component with email/password fields, validation, and error handling"
```

### 📊 `jules_check_status`
Check task status and get results.

**Parameters**:
- `sessionId` - Session ID from `jules_submit_task`

**Example**:
```
Claude, check the status of Jules task sessions/abc123
```

### ⚡ `jules_submit_batch`
Submit multiple tasks in parallel (up to 60!).

**Parameters**:
- `tasks` - Array of `{source, prompt, title}` objects

**Example**:
```
Claude, submit these 10 tasks to Jules in parallel:
1. Create UserProfile component
2. Create Dashboard component
3. Create Settings component
...
```

## Usage Examples

### Example 1: Parallel Component Generation

**You**: "Claude, I need 10 React components for my dashboard. Use Jules to build them in parallel."

**Claude will**:
1. Use `jules_list_sources` to find your repo
2. Use `jules_submit_batch` with 10 tasks
3. Use `jules_check_status` to monitor progress
4. Report back with session IDs

### Example 2: Research + Implementation

**You**: "Claude, research best practices for React Server Components and implement an example."

**Claude will**:
- Research architecture itself
- Submit implementation task to Jules
- Jules uses internet access to research + implement
- Claude reviews Jules's work

### Example 3: Massive Refactoring

**You**: "Claude, refactor 20 files to use the new API structure."

**Claude will**:
1. Analyze the changes needed
2. Submit 20 parallel tasks to Jules
3. Monitor completion
4. Review and integrate results

## API Reference

### Jules API Endpoints

- **Base URL**: `https://jules.googleapis.com/v1alpha`
- **Auth**: `X-Goog-Api-Key` header

**Endpoints**:
- `GET /sources` - List available sources
- `POST /sessions` - Create new task session
- `GET /sessions/{id}` - Get session status

### Session Response

```json
{
  "name": "sessions/abc123",
  "state": "ACTIVE|COMPLETED|FAILED",
  "sourceContext": {
    "source": "projects/123/sources/456"
  },
  "title": "Create login component",
  "prompt": "Build a React login component...",
  "result": {
    "files": [...],
    "summary": "..."
  }
}
```

## Troubleshooting

### "JULES_API_KEY environment variable is required"
- Make sure you created `.env` file with your API key
- Or set the environment variable in Claude Code config

### "Failed to list Jules sources"
- Verify your API key is valid
- Check you have sources/repos configured in Jules
- Visit [Google AI Studio](https://aistudio.google.com/) to set up sources

### MCP server not showing in Claude Code
- Restart Claude Code after config changes
- Check the path in `claude_desktop_config.json` is correct
- Verify Node.js is installed: `node --version`

### Tools not appearing
- Open Claude Code developer tools (Cmd/Ctrl+Shift+I)
- Check console for MCP connection errors
- Verify JSON syntax in `claude_desktop_config.json`

## Development

**Run in development mode** (auto-restart on changes):
```bash
npm run dev
```

**Test the MCP server**:
```bash
# Set environment variable
export JULES_API_KEY=your_key

# Run server
npm start
```

## Limits

- **Concurrent tasks**: 60 (Jules subscription limit)
- **Daily tasks**: 300 (Jules subscription limit)
- **Session lifetime**: Varies by Jules configuration

## License

MIT

---

**Built with**:
- [@modelcontextprotocol/sdk](https://github.com/anthropics/mcp) - MCP SDK
- [Jules API](https://jules.googleapis.com/) - Google's coding AI
- [node-fetch](https://github.com/node-fetch/node-fetch) - HTTP client

**Part of the Jules On-The-Go ecosystem** 🚀
