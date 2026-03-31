import Fastify from "fastify";
import cors from "@fastify/cors";
import { env } from "./env";
import { registerDashboardRoutes } from "./routes/dashboard";
import { registerHealthRoutes } from "./routes/health";
import { registerOrderRoutes } from "./routes/orders";
import { registerProductRoutes } from "./routes/products";
import { registerSalesRoutes } from "./routes/sales";

export async function buildServer() {
  const app = Fastify({
    logger: true,
  });

  await app.register(cors, {
    origin: env.corsOrigin,
  });

  await registerHealthRoutes(app);
  await registerDashboardRoutes(app);
  await registerProductRoutes(app);
  await registerOrderRoutes(app);
  await registerSalesRoutes(app);

  return app;
}
