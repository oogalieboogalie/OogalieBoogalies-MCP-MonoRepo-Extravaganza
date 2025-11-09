# oogalieboogalie's MCP MonoRepo Extravaganza 🚀

![MCP MonoRepo Header](./assets/header.png)

**A collection of Model Context Protocol (MCP) servers for AI orchestration, parallel execution, and next-level automation.**

Fork once, get all the MCPs. Enable what you need. Build what the future demands.

---

## 🌟 Available Servers

### 🤖 Jules MCP Server
**Parallel AI Task Execution at Scale**

Bridge Claude (or any MCP client) to Google's Jules AI with support for up to 60 concurrent tasks. Perfect for building systems in parallel while you plan the next move.

**Features:**
- ✅ Submit single tasks or batches (up to 60 concurrent!)
- ✅ Check task status in real-time
- ✅ Jules has persistent memory per repo
- ✅ Internet access for research
- ✅ Branch-specific task execution

**Tools:**
- `jules_list_sources` - See all your repos Jules can access
- `jules_submit_task` - Submit a single task
- `jules_check_status` - Monitor task progress
- `jules_submit_batch` - Submit multiple tasks in parallel

[📖 Full Documentation](./servers/jules/README.md)

---

### 🗄️ Supabase MCP Server
**Database Operations & Schema Management**

Manage your Supabase database directly from AI. Create tables, query data, set up RLS policies, enable real-time, and more - all through natural language.

**Features:**
- ✅ Schema management (create tables, indexes, constraints)
- ✅ CRUD operations (query, insert, update, delete)
- ✅ Row Level Security (RLS) policy creation
- ✅ Real-time subscriptions
- ✅ Raw SQL execution
- ✅ Full PostgreSQL support

**Tools:**
- `create_table` - Create tables with full schema definition
- `query` - Query data with filters and ordering
- `insert` / `update` / `delete` - Data manipulation
- `create_rls_policy` - Set up security policies
- `enable_realtime` - Enable real-time subscriptions
- `execute_sql` - Run raw SQL queries
- `list_tables` / `describe_table` - Schema introspection

[📖 Full Documentation](./servers/supabase/README.md)

---

### 🎨 MiniMax MCP Server
**Multimodal Generation (Image, Audio, Video, Music)**

Create images, audio, video, and music from text prompts. Perfect for creative workflows and generating assets on the fly.

**Features:**
- ✅ Text-to-Image with multiple aspect ratios
- ✅ Text-to-Audio with multiple voices and languages
- ✅ Text-to-Video and Image-to-Video
- ✅ Music Generation from lyrics and prompts
- ✅ Local file saving or URL returns

**Tools:**
- `text_to_image` - Generate an image
- `text_to_audio` - Generate audio
- `generate_video` - Generate a video from text
- `query_video_generation` - Check the status of a video generation task
- `music_generation` - Generate music

[📖 Full Documentation](./servers/minimax-mcp/README.md)

---

## 🚀 Quick Start

### 1. Clone the Repo

```bash
git clone https://github.com/oogalieboogalie/mcp-servers.git
cd mcp-servers
```

### 2. Install Dependencies

Choose which servers you want to use:

**Jules:**
```bash
cd servers/jules
npm install
```

**Supabase:**
```bash
cd servers/supabase
npm install
npm run build  # Supabase needs to be compiled
```

**MiniMax:**
No installation needed, the server is run via `npx`.

### 3. Set Up Environment Variables

**Jules:**
```bash
cp servers/jules/.env.example servers/jules/.env
# Edit and add: JULES_API_KEY
```

**Supabase:**
```bash
cp servers/supabase/.env.example servers/supabase/.env
# Edit and add: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
```

**MiniMax:**
```bash
# No .env file, use environment variables directly:
# MINIMAX_API_KEY
# MINIMAX_MCP_BASE_PATH (optional, defaults to ~/Desktop/minimax-mcp-output)
```

### 4. Configure Your MCP Client

Choose your preferred MCP client:

#### Option A: Claude Desktop

Edit your Claude Desktop config file:

**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
**Mac/Linux:** `~/Library/Application Support/Claude/claude_desktop_config.json`

Add the servers you want:

```json
{
  "mcpServers": {
    "jules": {
      "command": "node",
      "args": ["<PATH_TO_REPO>/servers/jules/index.js"],
      "env": {
        "JULES_API_KEY": "your_jules_api_key_here"
      }
    },
    "minimax": {
      "command": "npx",
      "args": ["-y", "minimax-mcp-js"],
      "env": {
        "MINIMAX_API_KEY": "${MINIMAX_API_KEY}",
        "MINIMAX_MCP_BASE_PATH": "~/Desktop"
      }
    }
  }
}
```

#### Option B: GitHub Copilot (VS Code)

Edit your VS Code MCP config file:

**Windows:** `%APPDATA%\Code\User\globalStorage\github.copilot-chat\mcp.json`
**Mac:** `~/Library/Application Support/Code/User/globalStorage/github.copilot-chat/mcp.json`
**Linux:** `~/.config/Code/User/globalStorage/github.copilot-chat/mcp.json`

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
    "minimax": {
      "command": "npx",
      "args": ["-y", "minimax-mcp-js"],
      "env": {
        "MINIMAX_API_KEY": "${MINIMAX_API_KEY}",
        "MINIMAX_MCP_BASE_PATH": "~/Desktop"
      }
    }
  }
}
```

📖 **[Full GitHub Copilot Setup Guide](./docs/github-copilot-setup.md)**

### 5. Restart Your MCP Client

Restart Claude Desktop or VS Code to load the MCP servers.

---

## 📚 Configuration Examples

- **Claude Desktop:** [examples/claude_desktop_config.json](./examples/claude_desktop_config.json)
- **GitHub Copilot:** [examples/vscode_mcp.json](./examples/vscode_mcp.json)

---

## 🛠️ Adding Your Own MCP Server

Want to add a new MCP to this collection?

1. Create a new directory in `servers/`
2. Follow the structure from `servers/jules/`
3. Add documentation in your server's README
4. Update this main README

---

## 🤝 Contributing

Found a bug? Have an idea for a new MCP server? PRs welcome!

---

## 📖 Documentation

### MCP Servers
- [Jules MCP Server](./servers/jules/README.md)
- [Supabase MCP Server](./servers/supabase/README.md)
- [MiniMax MCP Server](./servers/minimax-mcp/README.md)

### Setup Guides
- [GitHub Copilot Setup Guide](./docs/github-copilot-setup.md) - **Use with VS Code & GitHub Copilot**
- [Claude Desktop Configuration](./examples/claude_desktop_config.json) - Use with Claude Desktop

---

## 🌌 Why This Exists

Because one human + AI orchestration + parallel execution = **infinite leverage**.

This monorepo is about building the infrastructure that builds itself. Fork it, extend it, automate everything.

---

## 📜 License

MIT - Do whatever you want with it.

---

**Built with ☕ and 🤖 by [oogalieboogalie](https://github.com/oogalieboogalie)**

*Powered by Claude, Jules, and the dream of making AI work for us at scale.*
