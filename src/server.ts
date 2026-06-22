import "dotenv/config";
import { createServer } from "http";
import { createApp } from "./app";
import { connectDatabase, ensureCollections } from "./config/database";
import { getConfig } from "./config/env";

async function bootstrap(): Promise<void> {
  const config = getConfig();
  const app = createApp();
  const server = createServer(app);

  await connectDatabase(config.mongoUri);
  await ensureCollections();

  server.listen(config.port, () => {
    console.log(`FoodHub API listening on port ${config.port}`);
  });
}

void bootstrap().catch((error: unknown) => {
  console.error("Failed to start FoodHub API", error);
  process.exitCode = 1;
});