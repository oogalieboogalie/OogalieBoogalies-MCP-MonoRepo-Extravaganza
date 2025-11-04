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

### 4. Configure Claude Desktop

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
    }
  }
}
```

### 5. Restart Claude Desktop

That's it! Your MCP servers are now available in Claude Desktop.

---

## 📚 Configuration Examples

See [examples/claude_desktop_config.json](./examples/claude_desktop_config.json) for a complete configuration with all available servers.

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

- [Jules MCP Server](./servers/jules/README.md)
- [Supabase MCP Server](./servers/supabase/README.md)
- [Configuration Guide](./docs/configuration.md)

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
