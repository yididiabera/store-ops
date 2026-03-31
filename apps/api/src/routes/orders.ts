import type { FastifyInstance } from "fastify";
import {
  createOrder,
  deleteOrder,
  getOrderDetailPageData,
  getOrdersPageData,
  updateOrder,
} from "../modules/orders/service";

export async function registerOrderRoutes(app: FastifyInstance) {
  app.get("/orders", async () => {
    return getOrdersPageData();
  });

  app.get("/orders/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const order = await getOrderDetailPageData(id);

    if (!order) {
      reply.code(404);
      return {
        message: "Order not found",
      };
    }

    return order;
  });

  app.post("/orders", async (request, reply) => {
    try {
      const created = await createOrder((request.body as Record<string, unknown> | null) ?? {});
      reply.code(201);
      return created;
    } catch (error) {
      reply.code(400);
      return {
        message: error instanceof Error ? error.message : "Unable to create order",
      };
    }
  });

  app.put("/orders/:id", async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      return await updateOrder(id, (request.body as Record<string, unknown> | null) ?? {});
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update order";
      reply.code(message === "Order not found" ? 404 : 400);
      return { message };
    }
  });

  app.delete("/orders/:id", async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      return await deleteOrder(id);
    } catch (error) {
      reply.code(400);
      return {
        message: error instanceof Error ? error.message : "Unable to delete order",
      };
    }
  });
}
