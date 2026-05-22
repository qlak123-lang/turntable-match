import { Pool } from 'pg';

let pool: Pool | null = null;

export function getDbPool() {
  if (pool) return pool;
  
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.warn("DATABASE_URL env variable is not set. Database features will fallback to mock local storage.");
    return null;
  }
  
  pool = new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    ssl: {
      rejectUnauthorized: false
    }
  });
  
  return pool;
}

export async function dbQuery<T = any>(text: string, params?: any[]): Promise<T[]> {
  const db = getDbPool();
  if (!db) {
    throw new Error("DATABASE_URL is not configured.");
  }
  
  const res = await db.query(text, params);
  return res.rows;
}
