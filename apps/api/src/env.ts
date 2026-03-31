import "./load-env";

const parsePort = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseCorsOrigin = (value: string | undefined) => {
  if (!value || value === "*") {
    return true as const;
  }

  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
};

export const env = {
  host: process.env.API_HOST ?? "0.0.0.0",
  port: parsePort(process.env.PORT, 4000),
  corsOrigin: parseCorsOrigin(process.env.CORS_ORIGIN),
  databaseUrl: process.env.DATABASE_URL ?? "",
} as const;
