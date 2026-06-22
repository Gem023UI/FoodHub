"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const http_1 = require("http");
const app_1 = require("./app");
const database_1 = require("./config/database");
const env_1 = require("./config/env");
async function bootstrap() {
    const config = (0, env_1.getConfig)();
    const app = (0, app_1.createApp)();
    const server = (0, http_1.createServer)(app);
    await (0, database_1.connectDatabase)(config.mongoUri);
    await (0, database_1.ensureCollections)();
    server.listen(config.port, () => {
        console.log(`FoodHub API listening on port ${config.port}`);
    });
}
void bootstrap().catch((error) => {
    console.error("Failed to start FoodHub API", error);
    process.exitCode = 1;
});
