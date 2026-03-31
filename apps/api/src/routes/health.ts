import type { FastifyInstance } from "fastify";
import { checkDatabaseConnection } from "../db";

export async function registerHealthRoutes(app: FastifyInstance) {
  app.get("/health", async (_request, reply) => {
    const db = await checkDatabaseConnection();
    const healthy = db.connected || !db.configured;

    reply.code(healthy ? 200 : 503);

    return {
      status: healthy ? "ok" : "degraded",
      service: "store-ops-api",
      timestamp: new Date().toISOString(),
      db,
    };
  });
}
