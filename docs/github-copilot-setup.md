# GitHub Copilot Setup Guide

**How to Use These MCP Servers with GitHub Copilot in VS Code**

This guide walks you through configuring the MCP servers in this repository with GitHub Copilot in Visual Studio Code, enabling AI-powered interactions with Jules, Supabase, and other tools directly from your editor.

---

## Prerequisites

Before you begin, ensure you have:

- ✅ **Visual Studio Code** version 1.99 or later
- ✅ **GitHub Copilot** subscription (Individual, Business, or Enterprise)
- ✅ **Node.js** installed (v16 or later)
- ✅ **Git** for cloning the repository
- ✅ API keys for the MCP servers you want to use:
  - Jules: Get from [Google AI Studio](https://aistudio.google.com/)
  - Supabase: Get from your [Supabase Dashboard](https://app.supabase.com/)

---

## Quick Start

### Step 1: Clone and Install

```bash
# Clone this repository
git clone https://github.com/oogalieboogalie/OogalieBoogalies-MCP-MonoRepo-Extravaganza.git
cd OogalieBoogalies-MCP-MonoRepo-Extravaganza

# Install dependencies for Jules MCP
cd servers/jules
npm install
cd ../..

# Install and build Supabase MCP (if needed)
cd servers/supabase
npm install
npm run build
cd ../..
```

### Step 2: Set Up Environment Variables

**For Jules:**
```bash
cd servers/jules
cp .env.example .env
# Edit .env and add: JULES_API_KEY=your_actual_api_key_here
```

**For Supabase:**
```bash
cd servers/supabase
cp .env.example .env
# Edit .env and add:
# SUPABASE_URL=https://your-project.supabase.co
# SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### Step 3: Configure VS Code MCP

Create or edit the MCP configuration file in your VS Code settings directory.

#### Configuration File Location

- **Windows**: `%APPDATA%\Code\User\globalStorage\github.copilot-chat\mcp.json`
- **macOS**: `~/Library/Application Support/Code/User/globalStorage/github.copilot-chat/mcp.json`
- **Linux**: `~/.config/Code/User/globalStorage/github.copilot-chat/mcp.json`

> **Note**: You may need to create the directory structure if it doesn't exist yet.

#### Example mcp.json Configuration

Replace `/absolute/path/to/repo` with the actual absolute path to where you cloned this repository:

```json
{
  "mcpServers": {
    "jules": {
      "command": "node",
      "args": ["/absolute/path/to/repo/servers/jules/index.js"],
      "env": {
        "JULES_API_KEY": "your_jules_api_key_here"
      }
    },
    "supabase": {
      "command": "node",
      "args": ["/absolute/path/to/repo/servers/supabase/dist/index.js"],
      "env": {
        "SUPABASE_URL": "https://your-project.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "your_service_role_key_here"
      }
    }
  }
}
```

**Important Notes**:
- Use **absolute paths** for the `args` array
- For Windows, use forward slashes or escaped backslashes: `C:/Users/YourName/...` or `C:\\Users\\YourName\\...`
- Environment variables can be embedded in the config or loaded from `.env` files

### Step 4: Restart VS Code

After saving the `mcp.json` file:
1. Close all VS Code windows
2. Reopen VS Code
3. Open GitHub Copilot Chat (click the chat icon in the sidebar or press `Ctrl+Alt+I` / `Cmd+Option+I`)

---

## Verifying the Setup

### Check MCP Server Status

1. Open VS Code Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. Type and select: **"GitHub Copilot: Show Chat"**
3. In the chat, try asking:
   - "Can you list my Jules sources?"
   - "What MCP tools are available?"

### Test Each Server

**Test Jules MCP:**
```
@workspace Using Jules, can you list my available sources?
```

**Test Supabase MCP:**
```
@workspace Using Supabase, can you list my database tables?
```

If the MCP servers are configured correctly, GitHub Copilot will be able to call these tools and return results.

---

## Available Tools

Once configured, GitHub Copilot will have access to these MCP tools:

### 🤖 Jules MCP Server Tools

| Tool | Description |
|------|-------------|
| `jules_list_sources` | List all repositories Jules can access |
| `jules_submit_task` | Submit a single task to Jules |
| `jules_check_status` | Check task status and results |
| `jules_submit_batch` | Submit multiple tasks in parallel (up to 60!) |

**Example Usage:**
```
Can you submit a task to Jules to create a React login component 
with email/password validation and error handling?
```

### 🗄️ Supabase MCP Server Tools

| Tool | Description |
|------|-------------|
| `create_table` | Create tables with schema definition |
| `query` | Query data with filters and ordering |
| `insert` / `update` / `delete` | Data manipulation operations |
| `create_rls_policy` | Set up Row Level Security policies |
| `enable_realtime` | Enable real-time subscriptions |
| `execute_sql` | Run raw SQL queries |
| `list_tables` / `describe_table` | Schema introspection |

**Example Usage:**
```
Can you query the users table in Supabase and show me all 
users created in the last 7 days?
```

---

## Configuration Examples

### Example 1: Jules Only

```json
{
  "mcpServers": {
    "jules": {
      "command": "node",
      "args": ["/Users/yourname/code/OogalieBoogalies-MCP-MonoRepo-Extravaganza/servers/jules/index.js"],
      "env": {
        "JULES_API_KEY": "AIzaSyC..."
      }
    }
  }
}
```

### Example 2: Supabase Only

```json
{
  "mcpServers": {
    "supabase": {
      "command": "node",
      "args": ["/Users/yourname/code/OogalieBoogalies-MCP-MonoRepo-Extravaganza/servers/supabase/dist/index.js"],
      "env": {
        "SUPABASE_URL": "https://abcdefghijklmnop.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
      }
    }
  }
}
```

### Example 3: Both Servers

See the full example in [examples/vscode_mcp.json](../examples/vscode_mcp.json)

---

## Troubleshooting

### MCP Servers Not Appearing

**Problem**: GitHub Copilot doesn't show MCP tools in the chat.

**Solutions**:
1. Verify VS Code version is 1.99 or later
2. Check that GitHub Copilot extension is installed and activated
3. Ensure the `mcp.json` file is in the correct location
4. Verify JSON syntax is valid (use a JSON validator)
5. Restart VS Code completely (close all windows)
6. Check VS Code Developer Tools for errors:
   - Go to **Help → Toggle Developer Tools**
   - Look in the Console tab for MCP-related errors

### Invalid API Keys

**Problem**: MCP server starts but returns authentication errors.

**Solutions**:
- **Jules**: Verify your API key at [Google AI Studio](https://aistudio.google.com/)
- **Supabase**: Check your service role key in [Supabase Dashboard](https://app.supabase.com/)
- Ensure no extra spaces or quotes around keys in `mcp.json`
- Try setting keys in `.env` files instead of directly in `mcp.json`

### Path Issues

**Problem**: MCP server fails to start with "Cannot find module" errors.

**Solutions**:
1. Use **absolute paths** in the `args` array
2. For Windows, ensure proper path format:
   - ✅ `C:/Users/Name/repo/servers/jules/index.js`
   - ✅ `C:\\Users\\Name\\repo\\servers\\jules\\index.js`
   - ❌ `C:\Users\Name\repo\servers\jules\index.js` (needs escaping)
3. Verify the files exist at the specified paths
4. Make sure you ran `npm install` in each server directory

### Node.js Not Found

**Problem**: MCP server fails with "node: command not found".

**Solutions**:
1. Install Node.js from [nodejs.org](https://nodejs.org/)
2. Add Node.js to your system PATH
3. Restart VS Code after installing Node.js
4. Verify installation: open terminal and run `node --version`

### Permission Denied

**Problem**: Permission errors when starting MCP servers.

**Solutions**:
- **macOS/Linux**: Ensure the repository files have execute permissions
  ```bash
  chmod -R u+x /path/to/repo/servers/
  ```
- **Windows**: Run VS Code as Administrator if necessary

### MCP Server Crashes

**Problem**: MCP server starts but immediately crashes.

**Solutions**:
1. Check server logs in VS Code Output panel:
   - View → Output → Select "GitHub Copilot Chat" from dropdown
2. Verify environment variables are set correctly
3. Test the server manually:
   ```bash
   cd /path/to/repo/servers/jules
   export JULES_API_KEY=your_key
   node index.js
   ```
4. Check for missing dependencies:
   ```bash
   cd /path/to/repo/servers/jules
   npm install
   ```

---

## Advanced Configuration

### Using Environment Variable Files

Instead of embedding secrets in `mcp.json`, you can reference `.env` files:

```json
{
  "mcpServers": {
    "jules": {
      "command": "node",
      "args": ["/path/to/repo/servers/jules/index.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

The server will automatically load `.env` from its directory.

### Multiple Workspace Configurations

If you work in multiple workspaces, you can create workspace-specific MCP configurations:

1. Open your workspace in VS Code
2. Create `.vscode/mcp.json` in your workspace root
3. VS Code will prefer workspace config over global config

### Using npx for Execution

For a more portable setup, you can use `npx`:

```json
{
  "mcpServers": {
    "jules": {
      "command": "npx",
      "args": ["-y", "node", "/path/to/repo/servers/jules/index.js"],
      "env": {
        "JULES_API_KEY": "your_key"
      }
    }
  }
}
```

---

## Security Best Practices

### Protecting API Keys

⚠️ **Never commit API keys to version control!**

1. Use `.env` files (already in `.gitignore`)
2. Set restrictive permissions on config files:
   ```bash
   chmod 600 ~/.config/Code/User/globalStorage/github.copilot-chat/mcp.json
   ```
3. Consider using a secrets manager for production environments
4. Rotate keys regularly
5. Use minimal-privilege keys when possible

### Service Role Keys

For Supabase, the service role key grants **full database access**. Consider:
- Using a less privileged key for development
- Setting up RLS policies to limit access
- Using separate keys for development and production

---

## Usage Tips

### Effective Prompts

**Good Prompts:**
- ✅ "Using Jules, create a React component for user authentication"
- ✅ "Query my Supabase users table and show active users"
- ✅ "Submit 5 tasks to Jules in parallel to build these components..."

**Less Effective:**
- ❌ "Do something with Jules" (too vague)
- ❌ "Fix my database" (not specific enough)

### Combining Tools

GitHub Copilot can orchestrate multiple MCP tools:

```
Using Jules, submit tasks to:
1. Create user management API endpoints
2. Build authentication middleware
3. Add rate limiting

Then use Supabase to create the corresponding database tables 
with RLS policies for each endpoint.
```

### Monitoring Task Progress

For long-running Jules tasks:
```
Submit this task to Jules and check its status every 30 seconds 
until it completes, then show me the results.
```

---

## Comparison: Claude Desktop vs. GitHub Copilot

| Feature | Claude Desktop | GitHub Copilot (VS Code) |
|---------|---------------|--------------------------|
| **Config Location** | `claude_desktop_config.json` | `mcp.json` in VS Code settings |
| **Config Key** | `mcpServers` | `mcpServers` |
| **Restart Required** | Yes | Yes |
| **Tool Discovery** | Automatic | Automatic |
| **Multi-workspace** | Single config | Global + workspace configs |
| **Integration** | Standalone app | Integrated with IDE |

Both support the same MCP servers with nearly identical configuration syntax!

---

## Next Steps

- [Jules MCP Documentation](../servers/jules/README.md)
- [Supabase MCP Documentation](../servers/supabase/README.md)
- [Example Configurations](../examples/)
- [Main README](../README.md)

---

## Getting Help

If you encounter issues:

1. Check this troubleshooting guide
2. Review the [VS Code MCP documentation](https://code.visualstudio.com/docs/copilot/customization/mcp-servers)
3. Open an issue on [GitHub](https://github.com/oogalieboogalie/OogalieBoogalies-MCP-MonoRepo-Extravaganza/issues)

---

**Built with ☕ and 🤖 by [oogalieboogalie](https://github.com/oogalieboogalie)**
