import app from "./app";
import { logger } from "./lib/logger";
import { seedSpendingDemo } from "./services/decisions";
import { seedDemoFamily } from "./services/family";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function start() {
  // Create the demo family on first run; a no-op when it already exists.
  const seed = await seedDemoFamily();
  logger.info(
    seed,
    seed.created ? "Seeded demo family" : "Demo family present",
  );
  // Then merchants, the policy, the card and its history; adds only what's missing.
  const spending = await seedSpendingDemo();
  logger.info(spending, "Spending demo data ready");

  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }

    logger.info({ port }, "Server listening");
  });
}

start().catch((err: unknown) => {
  logger.error({ err }, "API startup failed");
  process.exit(1);
});
