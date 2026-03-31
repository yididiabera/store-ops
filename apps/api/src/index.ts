import { buildServer } from "./server";
import { env } from "./env";

async function start() {
  const app = await buildServer();

  try {
    await app.listen({
      host: env.host,
      port: env.port,
    });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

void start();
