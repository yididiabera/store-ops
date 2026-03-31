import { Pool, type PoolClient } from "pg";
import { env } from "../env";

const globalForDb = globalThis as unknown as {
  apiPgPool?: Pool;
};

export function getPool() {
  if (!env.databaseUrl) {
    throw new Error("DATABASE_URL is not configured");
  }

  if (!globalForDb.apiPgPool) {
    globalForDb.apiPgPool = new Pool({
      connectionString: env.databaseUrl,
      ssl: env.databaseUrl.includes("supabase.co")
        ? { rejectUnauthorized: false }
        : undefined,
    });
  }

  return globalForDb.apiPgPool;
}

export type DbExecutor = Pool | PoolClient;

export async function withTransaction<T>(callback: (client: PoolClient) => Promise<T>) {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("begin");
    const result = await callback(client);
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function checkDatabaseConnection() {
  if (!env.databaseUrl) {
    return {
      configured: false,
      connected: false,
    };
  }

  try {
    const pool = getPool();
    await pool.query("select 1");

    return {
      configured: true,
      connected: true,
    };
  } catch (error) {
    return {
      configured: true,
      connected: false,
      error: error instanceof Error ? error.message : "Unknown database error",
    };
  }
}
