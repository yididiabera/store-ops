import type { FastifyInstance } from "fastify";
import { getDashboardData } from "../modules/dashboard/service";

export async function registerDashboardRoutes(app: FastifyInstance) {
  app.get("/dashboard", async () => {
    return getDashboardData();
  });
}
