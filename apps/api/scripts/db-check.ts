import "./load-env";
import process from "node:process";
import { Client } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const client = new Client({
  connectionString: databaseUrl,
  ssl: databaseUrl.includes("supabase.co") ? { rejectUnauthorized: false } : undefined,
});

async function run() {
  await client.connect();
  const result = await client.query("select now() as now");
  console.log("Database connection ok:", result.rows[0]?.now);
  await client.end();
}

void run().catch(async (error) => {
  console.error(error);
  try {
    await client.end();
  } catch {}
  process.exit(1);
});
