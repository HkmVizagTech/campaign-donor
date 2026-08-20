import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import { env } from "./config/env.js";
import { connectDatabase } from "./config/database.js";
import { logger } from "./utils/logger.js";

async function main() {
  await connectDatabase();
  app.listen(env.PORT, () => {
    logger.info(`API server running on port ${env.PORT}`);
  });
}

main().catch((err) => {
  logger.error("Failed to start server:", err);
  process.exit(1);
});
