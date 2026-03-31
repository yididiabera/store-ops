import type { FastifyInstance } from "fastify";
import {
  createProduct,
  deleteProduct,
  getProductsPageData,
  updateProduct,
} from "../modules/products/service";

export async function registerProductRoutes(app: FastifyInstance) {
  app.get("/products", async () => {
    return getProductsPageData();
  });

  app.post("/products", async (request, reply) => {
    try {
      const created = await createProduct((request.body as Record<string, unknown> | null) ?? {});
      reply.code(201);
      return created;
    } catch (error) {
      reply.code(400);
      return {
        message: error instanceof Error ? error.message : "Unable to create product",
      };
    }
  });

  app.put("/products/:id", async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      return await updateProduct(id, (request.body as Record<string, unknown> | null) ?? {});
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update product";
      reply.code(message === "Product not found" ? 404 : 400);
      return { message };
    }
  });

  app.delete("/products/:id", async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      return await deleteProduct(id);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to delete product";
      reply.code(message === "Product not found" ? 404 : 400);
      return { message };
    }
  });
}
