# Supabase MCP Server

Model Context Protocol server for Supabase operations. Enables AI assistants to manage database schemas, query data, create RLS policies, and more.

## Features

- **Schema Management**: Create tables with full PostgreSQL support
- **CRUD Operations**: Query, insert, update, delete data
- **Security**: Create Row Level Security (RLS) policies
- **Real-time**: Enable real-time subscriptions on tables
- **Introspection**: List tables and describe schemas
- **Raw SQL**: Execute custom SQL queries

## Installation

```bash
npm install
npm run build
```

## Configuration

Add to your MCP settings file (e.g., `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "supabase": {
      "command": "node",
      "args": ["/path/to/mcp-servers/servers/supabase/dist/index.js"],
      "env": {
        "SUPABASE_URL": "https://your-project.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "your-service-role-key"
      }
    }
  }
}
```

**Where to find your credentials:**
- SUPABASE_URL: Project Settings → API → Project URL
- SUPABASE_SERVICE_ROLE_KEY: Project Settings → API → service_role key (⚠️ Keep this secret!)

## Required Supabase Setup

For the MCP to work properly, you need to create a helper function in your Supabase database:

```sql
-- Create a function to execute arbitrary SQL (use service role only!)
CREATE OR REPLACE FUNCTION exec_sql_plpgsql(p_sql text, p_params jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
  v_rec record;
  v_wrapped_sql text;
  v_sql_upper text;
BEGIN
  -- Handle parameter substitution if params provided
  IF p_params != '{}'::jsonb THEN
    FOR v_rec IN SELECT * FROM jsonb_each_text(p_params)
    LOOP
      p_sql := replace(p_sql, ':' || v_rec.key, quote_literal(v_rec.value));
    END LOOP;
  END IF;

  -- Normalize SQL for checking (remove leading whitespace, convert to uppercase)
  v_sql_upper := upper(trim(p_sql));

  -- Check if this is a statement that doesn't return rows (DDL or DML without RETURNING)
  IF v_sql_upper ~* '^\s*(CREATE|ALTER|DROP|TRUNCATE|GRANT|REVOKE|INSERT|UPDATE|DELETE)\s'
     AND v_sql_upper !~* 'RETURNING' THEN
    -- Statement doesn't return rows - execute directly
    EXECUTE p_sql;

    RETURN jsonb_build_object(
      'ok', true,
      'rows', '[]'::jsonb,
      'row_count', 0,
      'message', 'Statement executed successfully'
    );
  ELSE
    -- Query statement (SELECT, or INSERT/UPDATE/DELETE with RETURNING) - wrap to get rows
    v_wrapped_sql := format('SELECT COALESCE(json_agg(row_to_json(t)), ''[]''::json)::jsonb FROM (%s) t', p_sql);

    -- Execute the wrapped SQL
    EXECUTE v_wrapped_sql INTO v_result;

    -- Return structured response
    RETURN jsonb_build_object(
      'ok', true,
      'rows', v_result,
      'row_count', jsonb_array_length(v_result)
    );
  END IF;

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'ok', false,
    'error', SQLERRM,
    'detail', SQLSTATE,
    'sql', p_sql
  );
END;
$$;

-- Only allow service role to execute
GRANT EXECUTE ON FUNCTION exec_sql_plpgsql TO service_role;
```

⚠️ **Security Note**: The `exec_sql_plpgsql` function should only be accessible via the service role key, never exposed to public/anon keys.

## Available Tools

### create_table
Create a new table with columns, constraints, and indexes.

**Example:**
```json
{
  "tableName": "users",
  "columns": [
    { "name": "id", "type": "uuid", "primaryKey": true, "default": "gen_random_uuid()" },
    { "name": "email", "type": "text", "unique": true, "nullable": false },
    { "name": "name", "type": "text" },
    { "name": "created_at", "type": "timestamp", "default": "now()" }
  ],
  "indexes": [
    { "name": "idx_users_email", "columns": ["email"], "unique": true }
  ]
}
```

### query
Query data from a table with filtering and ordering.

**Example:**
```json
{
  "table": "users",
  "select": "id, email, name",
  "filter": { "email": "user@example.com" },
  "order": { "column": "created_at", "ascending": false },
  "limit": 10
}
```

### insert
Insert one or more rows.

**Example:**
```json
{
  "table": "users",
  "data": { "email": "new@example.com", "name": "New User" }
}
```

### update
Update rows matching a filter.

**Example:**
```json
{
  "table": "users",
  "filter": { "id": "123" },
  "data": { "name": "Updated Name" }
}
```

### delete
Delete rows matching a filter.

**Example:**
```json
{
  "table": "users",
  "filter": { "id": "123" }
}
```

### create_rls_policy
Create a Row Level Security policy.

**Example:**
```json
{
  "tableName": "users",
  "policyName": "users_select_own",
  "command": "SELECT",
  "using": "auth.uid() = id",
  "role": "authenticated"
}
```

### enable_realtime
Enable real-time subscriptions on a table.

**Example:**
```json
{
  "tableName": "messages"
}
```

### execute_sql
Execute raw SQL (use with caution).

**Example:**
```json
{
  "sql": "SELECT COUNT(*) as total FROM users WHERE created_at > NOW() - INTERVAL '7 days'"
}
```

### list_tables
List all tables in the public schema.

### describe_table
Get detailed schema information for a table.

**Example:**
```json
{
  "tableName": "users"
}
```

## Usage Examples

### Setting up a trading system database:

1. Create tables for trades, positions, and strategies
2. Set up RLS policies for user data isolation
3. Enable real-time on the trades table
4. Create indexes for performance

### Content management system:

1. Create posts, comments, and users tables with relationships
2. Set up RLS for content ownership
3. Enable real-time for live updates
4. Add full-text search indexes

## Development

```bash
# Watch mode
npm run watch

# Build
npm run build

# Test
npm test
```

## Security Best Practices

1. **Always use the service role key** - Never expose it to client-side code
2. **Create RLS policies** - Protect your data at the database level
3. **Validate input** - The MCP uses Zod for validation, but be cautious with raw SQL
4. **Audit logs** - Consider logging all schema changes
5. **Backup regularly** - Schema changes can't be easily undone

## Roadmap

- [ ] Support for Edge Functions deployment
- [ ] Migration management and versioning
- [ ] Database backup/restore operations
- [ ] Performance monitoring and query analysis
- [ ] Schema diffing and validation
- [ ] Support for views and materialized views
- [ ] PostGIS and vector extensions support

## License

MIT

## Contributing

Pull requests welcome! Please ensure:
- TypeScript types are correct
- Zod schemas validate inputs
- Error handling is comprehensive
- Documentation is updated
