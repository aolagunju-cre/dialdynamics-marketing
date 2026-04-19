import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Lazy initialization so we only connect at runtime, not build time
let _db: ReturnType<typeof drizzle> | null = null;

function getDb() {
  if (!_db) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error("DATABASE_URL environment variable is not set");
    }
    const sql = neon(url);
    _db = drizzle(sql, { schema });
  }
  return _db;
}

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    return (getDb() as any)[prop];
  },
});