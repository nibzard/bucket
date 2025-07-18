import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

// Database configuration with connection pool settings
const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
  concurrency: parseInt(process.env.DB_CONCURRENCY_LIMIT || '50'),
  syncInterval: parseInt(process.env.DB_SYNC_INTERVAL || '60000'), // 1 minute
});

export const db = drizzle(client, { schema });

export * from "./schema";