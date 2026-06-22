export interface AppConfig {
  port: number;
  mongoUri: string;
  jwtSecret: string;
  nodeEnv: string;
}

const defaultPort = 3000;

function readNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function getConfig(): AppConfig {
  return {
    port: readNumber(process.env.PORT, defaultPort),
    mongoUri: process.env.MONGO_URI ?? "mongodb://127.0.0.1:27017/foodhub",
    jwtSecret: process.env.JWT_SECRET ?? "change-me-in-production",
    nodeEnv: process.env.NODE_ENV ?? "development"
  };
}