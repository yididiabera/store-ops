import type { FastifyInstance } from "fastify";
import { getSalesPageData, type SalesPeriod } from "../modules/sales/service";

export async function registerSalesRoutes(app: FastifyInstance) {
  app.get("/sales", async (request, reply) => {
    const period = ((request.query as { period?: string } | undefined)?.period ?? "ALL").toUpperCase() as SalesPeriod;
    const validPeriods: SalesPeriod[] = ["ALL", "TODAY", "WEEK", "MONTH"];

    if (!validPeriods.includes(period)) {
      reply.code(400);
      return {
        message: "Invalid sales period",
      };
    }

    return getSalesPageData(period);
  });
}
