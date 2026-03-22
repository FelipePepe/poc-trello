import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

let db: ReturnType<typeof drizzle<typeof schema>>;

export function initDb(): void {
  const url = process.env['DATABASE_URL'];
  if (!url) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }
  const pool = new Pool({ connectionString: url });
  db = drizzle(pool, { schema });
}

export function getDb(): ReturnType<typeof drizzle<typeof schema>> {
  if (!db) throw new Error('Database not initialized. Call initDb() first.');
  return db;
}
