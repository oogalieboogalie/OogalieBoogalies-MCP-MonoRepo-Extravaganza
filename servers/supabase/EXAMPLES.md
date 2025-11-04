# Supabase MCP Usage Examples

## Real-World Scenarios

### 1. Trading System Database Setup

```typescript
// Step 1: Create users table
await createTable({
  tableName: "users",
  columns: [
    { name: "id", type: "uuid", primaryKey: true, default: "gen_random_uuid()" },
    { name: "email", type: "text", unique: true, nullable: false },
    { name: "created_at", type: "timestamp", default: "now()" }
  ]
});

// Step 2: Create trades table with foreign key
await createTable({
  tableName: "trades",
  columns: [
    { name: "id", type: "uuid", primaryKey: true, default: "gen_random_uuid()" },
    { 
      name: "user_id", 
      type: "uuid", 
      nullable: false,
      references: { table: "users", column: "id", onDelete: "CASCADE" }
    },
    { name: "symbol", type: "text", nullable: false },
    { name: "side", type: "text", nullable: false }, // 'BUY' or 'SELL'
    { name: "quantity", type: "numeric", nullable: false },
    { name: "price", type: "numeric", nullable: false },
    { name: "status", type: "text", default: "'pending'" },
    { name: "executed_at", type: "timestamp", default: "now()" }
  ],
  indexes: [
    { name: "idx_trades_user_id", columns: ["user_id"] },
    { name: "idx_trades_symbol", columns: ["symbol"] },
    { name: "idx_trades_executed_at", columns: ["executed_at"] }
  ]
});

// Step 3: Create positions table (current holdings)
await createTable({
  tableName: "positions",
  columns: [
    { name: "id", type: "uuid", primaryKey: true, default: "gen_random_uuid()" },
    { 
      name: "user_id", 
      type: "uuid", 
      nullable: false,
      references: { table: "users", column: "id", onDelete: "CASCADE" }
    },
    { name: "symbol", type: "text", nullable: false },
    { name: "quantity", type: "numeric", nullable: false },
    { name: "average_price", type: "numeric", nullable: false },
    { name: "updated_at", type: "timestamp", default: "now()" }
  ],
  indexes: [
    { name: "idx_positions_user_symbol", columns: ["user_id", "symbol"], unique: true }
  ]
});

// Step 4: Enable real-time for live updates
await enableRealtime({ tableName: "trades" });
await enableRealtime({ tableName: "positions" });

// Step 5: Set up RLS policies for security
await createRLSPolicy({
  tableName: "trades",
  policyName: "users_view_own_trades",
  command: "SELECT",
  using: "auth.uid() = user_id",
  role: "authenticated"
});

await createRLSPolicy({
  tableName: "positions",
  policyName: "users_view_own_positions",
  command: "SELECT",
  using: "auth.uid() = user_id",
  role: "authenticated"
});
```

### 2. Multi-Tenant SaaS Application

```typescript
// Organizations table
await createTable({
  tableName: "organizations",
  columns: [
    { name: "id", type: "uuid", primaryKey: true, default: "gen_random_uuid()" },
    { name: "name", type: "text", nullable: false },
    { name: "slug", type: "text", unique: true, nullable: false },
    { name: "created_at", type: "timestamp", default: "now()" }
  ]
});

// Members table (many-to-many)
await createTable({
  tableName: "organization_members",
  columns: [
    { 
      name: "organization_id", 
      type: "uuid",
      references: { table: "organizations", column: "id", onDelete: "CASCADE" }
    },
    { 
      name: "user_id", 
      type: "uuid",
      references: { table: "users", column: "id", onDelete: "CASCADE" }
    },
    { name: "role", type: "text", nullable: false }, // 'owner', 'admin', 'member'
    { name: "joined_at", type: "timestamp", default: "now()" }
  ],
  indexes: [
    { 
      name: "idx_org_members_unique", 
      columns: ["organization_id", "user_id"], 
      unique: true 
    }
  ]
});

// Projects table (tenant-isolated)
await createTable({
  tableName: "projects",
  columns: [
    { name: "id", type: "uuid", primaryKey: true, default: "gen_random_uuid()" },
    { 
      name: "organization_id", 
      type: "uuid",
      nullable: false,
      references: { table: "organizations", column: "id", onDelete: "CASCADE" }
    },
    { name: "name", type: "text", nullable: false },
    { name: "status", type: "text", default: "'active'" },
    { name: "created_at", type: "timestamp", default: "now()" }
  ],
  indexes: [
    { name: "idx_projects_org_id", columns: ["organization_id"] }
  ]
});

// RLS: Users can only see projects from their organizations
await createRLSPolicy({
  tableName: "projects",
  policyName: "users_view_org_projects",
  command: "SELECT",
  using: `
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
  `,
  role: "authenticated"
});
```

### 3. Content Management System

```typescript
// Posts table
await createTable({
  tableName: "posts",
  columns: [
    { name: "id", type: "uuid", primaryKey: true, default: "gen_random_uuid()" },
    { 
      name: "author_id", 
      type: "uuid",
      nullable: false,
      references: { table: "users", column: "id", onDelete: "CASCADE" }
    },
    { name: "title", type: "text", nullable: false },
    { name: "slug", type: "text", unique: true, nullable: false },
    { name: "content", type: "text" },
    { name: "status", type: "text", default: "'draft'" }, // 'draft', 'published', 'archived'
    { name: "published_at", type: "timestamp" },
    { name: "created_at", type: "timestamp", default: "now()" },
    { name: "updated_at", type: "timestamp", default: "now()" }
  ],
  indexes: [
    { name: "idx_posts_author_id", columns: ["author_id"] },
    { name: "idx_posts_slug", columns: ["slug"], unique: true },
    { name: "idx_posts_status", columns: ["status"] },
    { name: "idx_posts_published_at", columns: ["published_at"] }
  ]
});

// Comments table
await createTable({
  tableName: "comments",
  columns: [
    { name: "id", type: "uuid", primaryKey: true, default: "gen_random_uuid()" },
    { 
      name: "post_id", 
      type: "uuid",
      nullable: false,
      references: { table: "posts", column: "id", onDelete: "CASCADE" }
    },
    { 
      name: "author_id", 
      type: "uuid",
      nullable: false,
      references: { table: "users", column: "id", onDelete: "CASCADE" }
    },
    { name: "content", type: "text", nullable: false },
    { name: "created_at", type: "timestamp", default: "now()" }
  ],
  indexes: [
    { name: "idx_comments_post_id", columns: ["post_id"] },
    { name: "idx_comments_created_at", columns: ["created_at"] }
  ]
});

// RLS: Anyone can read published posts
await createRLSPolicy({
  tableName: "posts",
  policyName: "public_read_published",
  command: "SELECT",
  using: "status = 'published'",
  role: "anon"
});

// RLS: Authors can edit their own posts
await createRLSPolicy({
  tableName: "posts",
  policyName: "authors_edit_own",
  command: "UPDATE",
  using: "auth.uid() = author_id",
  role: "authenticated"
});

// Enable real-time for live comments
await enableRealtime({ tableName: "comments" });
```

### 4. Analytics / Time-Series Data

```typescript
// Events table (high-volume writes)
await createTable({
  tableName: "events",
  columns: [
    { name: "id", type: "uuid", primaryKey: true, default: "gen_random_uuid()" },
    { name: "user_id", type: "uuid" },
    { name: "event_type", type: "text", nullable: false },
    { name: "event_data", type: "jsonb" },
    { name: "timestamp", type: "timestamp", default: "now()", nullable: false }
  ],
  indexes: [
    { name: "idx_events_user_id", columns: ["user_id"] },
    { name: "idx_events_type", columns: ["event_type"] },
    { name: "idx_events_timestamp", columns: ["timestamp"] }
  ]
});

// Create a materialized view for aggregated metrics
await executeSQL({
  sql: `
    CREATE MATERIALIZED VIEW daily_user_activity AS
    SELECT 
      user_id,
      DATE(timestamp) as activity_date,
      event_type,
      COUNT(*) as event_count
    FROM events
    GROUP BY user_id, DATE(timestamp), event_type
  `
});

// Create an index on the materialized view
await executeSQL({
  sql: `
    CREATE INDEX idx_daily_activity_user_date 
    ON daily_user_activity (user_id, activity_date)
  `
});
```

## Common Queries

### Insert data
```typescript
// Single insert
await insert({
  table: "users",
  data: { email: "user@example.com" }
});

// Bulk insert
await insert({
  table: "trades",
  data: [
    { user_id: "...", symbol: "AAPL", quantity: 10, price: 150.00, side: "BUY" },
    { user_id: "...", symbol: "GOOGL", quantity: 5, price: 2800.00, side: "BUY" }
  ]
});
```

### Query with filters
```typescript
// Get user's open positions
await query({
  table: "positions",
  filter: { user_id: "..." },
  order: { column: "updated_at", ascending: false }
});

// Get recent trades for a symbol
await query({
  table: "trades",
  filter: { symbol: "AAPL" },
  order: { column: "executed_at", ascending: false },
  limit: 50
});
```

### Update data
```typescript
// Update trade status
await update({
  table: "trades",
  filter: { id: "..." },
  data: { status: "executed" }
});

// Update position quantity
await update({
  table: "positions",
  filter: { user_id: "...", symbol: "AAPL" },
  data: { 
    quantity: 15, 
    average_price: 152.50,
    updated_at: "now()"
  }
});
```

### Complex SQL
```typescript
// Get user portfolio value
await executeSQL({
  sql: `
    SELECT 
      p.symbol,
      p.quantity,
      p.average_price,
      p.quantity * p.average_price as cost_basis
    FROM positions p
    WHERE p.user_id = $1
    ORDER BY cost_basis DESC
  `,
  params: ["user-uuid-here"]
});

// Get top traders by volume
await executeSQL({
  sql: `
    SELECT 
      u.email,
      COUNT(t.id) as trade_count,
      SUM(t.quantity * t.price) as total_volume
    FROM users u
    JOIN trades t ON t.user_id = u.id
    WHERE t.executed_at > NOW() - INTERVAL '30 days'
    GROUP BY u.id, u.email
    ORDER BY total_volume DESC
    LIMIT 10
  `
});
```

## Database Introspection

```typescript
// List all tables
await listTables();

// Get table schema
await describeTable({ tableName: "trades" });

// Find tables with a specific column
await executeSQL({
  sql: `
    SELECT table_name 
    FROM information_schema.columns 
    WHERE column_name = 'user_id' AND table_schema = 'public'
  `
});
```

## Pro Tips

1. **Always add indexes** for foreign keys and columns you'll filter/sort by
2. **Use RLS policies** to secure data at the database level
3. **Enable real-time** only on tables that need live updates (adds overhead)
4. **Use JSONB** for flexible schema fields, but don't overuse it
5. **Create materialized views** for expensive aggregations
6. **Add timestamps** (created_at, updated_at) to most tables
7. **Use UUIDs** for primary keys in distributed systems
8. **Set up CASCADE deletes** carefully - they can cascade further than you think!

## Common Patterns

### Soft Deletes
```typescript
await createTable({
  tableName: "posts",
  columns: [
    // ... other columns
    { name: "deleted_at", type: "timestamp" }
  ]
});

// Instead of DELETE, use UPDATE
await update({
  table: "posts",
  filter: { id: "..." },
  data: { deleted_at: "now()" }
});

// Query only non-deleted items
await query({
  table: "posts",
  // Note: Need enhanced query builder for IS NULL checks
  // This is where Jules enhancement helps!
});
```

### Audit Logging
```typescript
await createTable({
  tableName: "audit_log",
  columns: [
    { name: "id", type: "uuid", primaryKey: true, default: "gen_random_uuid()" },
    { name: "table_name", type: "text", nullable: false },
    { name: "record_id", type: "uuid", nullable: false },
    { name: "action", type: "text", nullable: false },
    { name: "old_data", type: "jsonb" },
    { name: "new_data", type: "jsonb" },
    { name: "user_id", type: "uuid" },
    { name: "created_at", type: "timestamp", default: "now()" }
  ],
  indexes: [
    { name: "idx_audit_table_record", columns: ["table_name", "record_id"] }
  ]
});
```

### Counters / Aggregates
```typescript
await createTable({
  tableName: "posts",
  columns: [
    // ... other columns
    { name: "view_count", type: "integer", default: "0" },
    { name: "comment_count", type: "integer", default: "0" }
  ]
});

// Trigger to update comment_count
await executeSQL({
  sql: `
    CREATE OR REPLACE FUNCTION update_comment_count()
    RETURNS TRIGGER AS $$
    BEGIN
      UPDATE posts 
      SET comment_count = comment_count + 1 
      WHERE id = NEW.post_id;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER increment_comment_count
    AFTER INSERT ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_comment_count();
  `
});
```
