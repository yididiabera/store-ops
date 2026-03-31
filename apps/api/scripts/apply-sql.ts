import "./load-env";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { Client } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const inputPath = process.argv[2];

if (!inputPath) {
  console.error("Usage: tsx scripts/apply-sql.ts <sql-file>");
  process.exit(1);
}

const resolvedPath = path.resolve(process.cwd(), inputPath);

if (!fs.existsSync(resolvedPath)) {
  console.error(`SQL file not found: ${resolvedPath}`);
  process.exit(1);
}

const sql = fs.readFileSync(resolvedPath, "utf8");
const client = new Client({
  connectionString: databaseUrl,
  ssl: databaseUrl.includes("supabase.co") ? { rejectUnauthorized: false } : undefined,
});

async function run() {
  await client.connect();
  await client.query(sql);
  await client.end();
  console.log(`Applied SQL: ${resolvedPath}`);
}

void run().catch(async (error) => {
  console.error(error);
  try {
    await client.end();
  } catch {}
  process.exit(1);
});
