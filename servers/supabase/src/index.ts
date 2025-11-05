#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

// Environment validation
const envSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

// Helper to accept both native objects and JSON strings
const flexibleObject = z.union([
  z.record(z.any()),  // Native object
  z.string().transform((str, ctx) => {
    try {
      return JSON.parse(str);
    } catch (e) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid JSON string",
      });
      return z.NEVER;
    }
  })
]);

const flexibleArray = z.union([
  z.array(z.any()),  // Native array
  z.string().transform((str, ctx) => {
    try {
      const parsed = JSON.parse(str);
      if (!Array.isArray(parsed)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Expected array",
        });
        return z.NEVER;
      }
      return parsed;
    } catch (e) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid JSON string",
      });
      return z.NEVER;
    }
  })
]);

// Tool schemas
const createTableSchema = z.object({
  tableName: z.string(),
  columns: z.union([
    z.array(z.object({
      name: z.string(),
      type: z.string(),
      nullable: z.boolean().optional(),
      default: z.string().optional(),
      primaryKey: z.boolean().optional(),
      unique: z.boolean().optional(),
      references: z.object({
        table: z.string(),
        column: z.string(),
        onDelete: z.enum(['CASCADE', 'SET NULL', 'RESTRICT', 'NO ACTION']).optional(),
      }).optional(),
    })),
    z.string().transform((str, ctx) => {
      try {
        return JSON.parse(str);
      } catch (e) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Invalid JSON string for columns",
        });
        return z.NEVER;
      }
    })
  ]),
  indexes: z.union([
    z.array(z.object({
      name: z.string(),
      columns: z.array(z.string()),
      unique: z.boolean().optional(),
    })),
    z.string().transform((str, ctx) => {
      try {
        return JSON.parse(str);
      } catch (e) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Invalid JSON string for indexes",
        });
        return z.NEVER;
      }
    })
  ]).optional(),
});

const querySchema = z.object({
  table: z.string(),
  select: z.string().optional(),
  filter: flexibleObject.optional(),
  order: z.union([
    z.object({
      column: z.string(),
      ascending: z.boolean().optional(),
    }),
    z.string().transform((str, ctx) => {
      try {
        return JSON.parse(str);
      } catch (e) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Invalid JSON string for order",
        });
        return z.NEVER;
      }
    })
  ]).optional(),
  limit: z.number().optional(),
});

const insertSchema = z.object({
  table: z.string(),
  data: z.union([
    z.record(z.any()),  // Native object
    z.array(z.record(z.any())),  // Native array of objects
    z.string().transform((str, ctx) => {  // JSON string
      try {
        return JSON.parse(str);
      } catch (e) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Invalid JSON string for data",
        });
        return z.NEVER;
      }
    })
  ]),
});

const updateSchema = z.object({
  table: z.string(),
  filter: flexibleObject,
  data: flexibleObject,
});

const deleteSchema = z.object({
  table: z.string(),
  filter: flexibleObject,
});

const createRLSPolicySchema = z.object({
  tableName: z.string(),
  policyName: z.string(),
  command: z.enum(['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'ALL']),
  using: z.string().optional(),
  withCheck: z.string().optional(),
  role: z.string().optional(),
});

const enableRealtimeSchema = z.object({
  tableName: z.string(),
});

const executeRawSQLSchema = z.object({
  sql: z.string(),
  params: z.array(z.any()).optional(),
});

class SupabaseMCPServer {
  private server: Server;
  private supabase: SupabaseClient;

  constructor() {
    // Validate environment
    const env = envSchema.parse(process.env);

    // Initialize Supabase client with service role (full access)
    this.supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Initialize MCP server
    this.server = new Server(
      {
        name: "supabase-mcp",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: this.getTools(),
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "create_table":
            return await this.createTable(createTableSchema.parse(args));
          case "query":
            return await this.query(querySchema.parse(args));
          case "insert":
            return await this.insert(insertSchema.parse(args));
          case "update":
            return await this.update(updateSchema.parse(args));
          case "delete":
            return await this.delete(deleteSchema.parse(args));
          case "create_rls_policy":
            return await this.createRLSPolicy(createRLSPolicySchema.parse(args));
          case "enable_realtime":
            return await this.enableRealtime(enableRealtimeSchema.parse(args));
          case "execute_sql":
            return await this.executeSQL(executeRawSQLSchema.parse(args));
          case "list_tables":
            return await this.listTables();
          case "describe_table":
            return await this.describeTable(z.object({ tableName: z.string() }).parse(args));
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        // Enhanced error serialization for Supabase errors
        let errorMessage: string;
        if (error instanceof Error) {
          errorMessage = error.message;
          // Supabase errors might have additional details
          if ('details' in error) {
            errorMessage += `\nDetails: ${JSON.stringify((error as any).details)}`;
          }
          if ('hint' in error) {
            errorMessage += `\nHint: ${(error as any).hint}`;
          }
          if ('code' in error) {
            errorMessage += `\nCode: ${(error as any).code}`;
          }
        } else if (typeof error === 'object' && error !== null) {
          // Handle non-Error objects
          errorMessage = JSON.stringify(error, Object.getOwnPropertyNames(error));
        } else {
          errorMessage = String(error);
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ error: errorMessage }, null, 2),
            },
          ],
        };
      }
    });
  }

  private getTools(): Tool[] {
    return [
      {
        name: "create_table",
        description: "Create a new table in Supabase with columns, constraints, and indexes",
        inputSchema: {
          type: "object",
          properties: {
            tableName: { type: "string", description: "Name of the table to create" },
            columns: {
              type: "array",
              description: "Array of column definitions",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  type: { type: "string", description: "PostgreSQL data type (text, integer, timestamp, uuid, etc.)" },
                  nullable: { type: "boolean" },
                  default: { type: "string" },
                  primaryKey: { type: "boolean" },
                  unique: { type: "boolean" },
                  references: {
                    type: "object",
                    properties: {
                      table: { type: "string" },
                      column: { type: "string" },
                      onDelete: { type: "string", enum: ["CASCADE", "SET NULL", "RESTRICT", "NO ACTION"] },
                    },
                  },
                },
                required: ["name", "type"],
              },
            },
            indexes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  columns: { type: "array", items: { type: "string" } },
                  unique: { type: "boolean" },
                },
              },
            },
          },
          required: ["tableName", "columns"],
        },
      },
      {
        name: "query",
        description: "Query data from a Supabase table with filtering, ordering, and limits",
        inputSchema: {
          type: "object",
          properties: {
            table: { type: "string" },
            select: { type: "string", description: "Columns to select (default: *)" },
            filter: { type: "object", description: "Filter conditions (key: value pairs)" },
            order: {
              type: "object",
              properties: {
                column: { type: "string" },
                ascending: { type: "boolean" },
              },
            },
            limit: { type: "number" },
          },
          required: ["table"],
        },
      },
      {
        name: "insert",
        description: "Insert one or more rows into a Supabase table",
        inputSchema: {
          type: "object",
          properties: {
            table: { type: "string" },
            data: {
              description: "Object or array of objects to insert",
              oneOf: [
                { type: "object" },
                { type: "array", items: { type: "object" } },
              ],
            },
          },
          required: ["table", "data"],
        },
      },
      {
        name: "update",
        description: "Update rows in a Supabase table",
        inputSchema: {
          type: "object",
          properties: {
            table: { type: "string" },
            filter: { type: "object", description: "Filter to match rows to update" },
            data: { type: "object", description: "Data to update" },
          },
          required: ["table", "filter", "data"],
        },
      },
      {
        name: "delete",
        description: "Delete rows from a Supabase table",
        inputSchema: {
          type: "object",
          properties: {
            table: { type: "string" },
            filter: { type: "object", description: "Filter to match rows to delete" },
          },
          required: ["table", "filter"],
        },
      },
      {
        name: "create_rls_policy",
        description: "Create a Row Level Security (RLS) policy on a table",
        inputSchema: {
          type: "object",
          properties: {
            tableName: { type: "string" },
            policyName: { type: "string" },
            command: { type: "string", enum: ["SELECT", "INSERT", "UPDATE", "DELETE", "ALL"] },
            using: { type: "string", description: "USING clause (for SELECT, UPDATE, DELETE)" },
            withCheck: { type: "string", description: "WITH CHECK clause (for INSERT, UPDATE)" },
            role: { type: "string", description: "Role to apply policy to (default: public)" },
          },
          required: ["tableName", "policyName", "command"],
        },
      },
      {
        name: "enable_realtime",
        description: "Enable real-time subscriptions on a table",
        inputSchema: {
          type: "object",
          properties: {
            tableName: { type: "string" },
          },
          required: ["tableName"],
        },
      },
      {
        name: "execute_sql",
        description: "Execute raw SQL query (use with caution)",
        inputSchema: {
          type: "object",
          properties: {
            sql: { type: "string", description: "SQL query to execute" },
            params: { type: "array", description: "Query parameters", items: {} },
          },
          required: ["sql"],
        },
      },
      {
        name: "list_tables",
        description: "List all tables in the database",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "describe_table",
        description: "Get detailed information about a table's structure",
        inputSchema: {
          type: "object",
          properties: {
            tableName: { type: "string" },
          },
          required: ["tableName"],
        },
      },
    ];
  }

  private async createTable(args: z.infer<typeof createTableSchema>) {
    const { tableName, columns, indexes } = args;

    // Build CREATE TABLE statement
    const columnDefs = columns.map((col: any) => {
      let def = `"${col.name}" ${col.type}`;
      if (col.primaryKey) def += " PRIMARY KEY";
      if (col.unique) def += " UNIQUE";
      if (!col.nullable) def += " NOT NULL";
      if (col.default) def += ` DEFAULT ${col.default}`;
      if (col.references) {
        def += ` REFERENCES "${col.references.table}"("${col.references.column}")`;
        if (col.references.onDelete) def += ` ON DELETE ${col.references.onDelete}`;
      }
      return def;
    });

    let sql = `CREATE TABLE "${tableName}" (${columnDefs.join(", ")})`;

    const { data, error } = await this.supabase.rpc("exec_sql_plpgsql", { p_sql: sql, p_params: {} });
    if (error) throw error;

    // Create indexes if specified
    if (indexes) {
      for (const index of indexes) {
        const uniqueStr = index.unique ? "UNIQUE" : "";
        const indexSql = `CREATE ${uniqueStr} INDEX "${index.name}" ON "${tableName}" (${index.columns.map((c: any) => `"${c}"`).join(", ")})`;
        const { error: indexError } = await this.supabase.rpc("exec_sql_plpgsql", { p_sql: indexSql, p_params: {} });
        if (indexError) throw indexError;
      }
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ success: true, table: tableName }, null, 2),
        },
      ],
    };
  }

  private async query(args: z.infer<typeof querySchema>) {
    const { table, select = "*", filter, order, limit } = args;

    let query = this.supabase.from(table).select(select);

    if (filter) {
      Object.entries(filter).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }

    if (order) {
      query = query.order(order.column, { ascending: order.ascending ?? true });
    }

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    if (error) throw error;

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ data, count: data?.length ?? 0 }, null, 2),
        },
      ],
    };
  }

  private async insert(args: z.infer<typeof insertSchema>) {
    const { table, data } = args;

    const { data: result, error } = await this.supabase.from(table).insert(data).select();
    if (error) throw error;

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ success: true, inserted: result }, null, 2),
        },
      ],
    };
  }

  private async update(args: z.infer<typeof updateSchema>) {
    const { table, filter, data } = args;

    let query = this.supabase.from(table).update(data);

    Object.entries(filter).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    const { data: result, error } = await query.select();
    if (error) throw error;

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ success: true, updated: result }, null, 2),
        },
      ],
    };
  }

  private async delete(args: z.infer<typeof deleteSchema>) {
    const { table, filter } = args;

    let query = this.supabase.from(table).delete();

    Object.entries(filter).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    const { error } = await query;
    if (error) throw error;

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ success: true }, null, 2),
        },
      ],
    };
  }

  private async createRLSPolicy(args: z.infer<typeof createRLSPolicySchema>) {
    const { tableName, policyName, command, using, withCheck, role = "public" } = args;

    let sql = `CREATE POLICY "${policyName}" ON "${tableName}" FOR ${command} TO ${role}`;
    if (using) sql += ` USING (${using})`;
    if (withCheck) sql += ` WITH CHECK (${withCheck})`;

    const { data, error } = await this.supabase.rpc("exec_sql_plpgsql", { p_sql: sql, p_params: {} });
    if (error) throw error;

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ success: true, policy: policyName }, null, 2),
        },
      ],
    };
  }

  private async enableRealtime(args: z.infer<typeof enableRealtimeSchema>) {
    const { tableName } = args;

    const sql = `ALTER PUBLICATION supabase_realtime ADD TABLE "${tableName}"`;
    const { data, error } = await this.supabase.rpc("exec_sql_plpgsql", { p_sql: sql, p_params: {} });
    if (error) throw error;

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ success: true, realtime_enabled: tableName }, null, 2),
        },
      ],
    };
  }

  private async executeSQL(args: z.infer<typeof executeRawSQLSchema>) {
    const { sql } = args;

    const { data: result, error } = await this.supabase.rpc("exec_sql_plpgsql", { p_sql: sql, p_params: {} });
    const data = result?.rows;
    if (error) throw error;

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ success: true, data }, null, 2),
        },
      ],
    };
  }

  private async listTables() {
    const sql = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;

    const { data: result, error } = await this.supabase.rpc("exec_sql_plpgsql", { p_sql: sql, p_params: {} });
    const data = result?.rows;
    if (error) throw error;

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ tables: data }, null, 2),
        },
      ],
    };
  }

  private async describeTable(args: { tableName: string }) {
    const { tableName } = args;

    const sql = `
      SELECT
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = '${tableName}'
      ORDER BY ordinal_position
    `;

    const { data: result, error } = await this.supabase.rpc("exec_sql_plpgsql", { p_sql: sql, p_params: {} });
    const data = result?.rows;
    if (error) throw error;

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ table: tableName, columns: data }, null, 2),
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Supabase MCP Server running on stdio");
  }
}

// Start server
const server = new SupabaseMCPServer();
server.run().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
