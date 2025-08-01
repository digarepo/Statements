// app/db.server.ts
import dotenv from "dotenv";
import mariadb from "mariadb";


// Load environment variables
dotenv.config();

const pool = mariadb.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "Abcd1234@&",
  database: process.env.DB_NAME || "statements_db",
  port: Number(process.env.DB_PORT) || 3306,
  connectionLimit: 5,
});

// Generic query function with proper typing
export async function query<T = unknown>(
  sql: string,
  params?: (string | number | boolean | null)[]
): Promise<T[]> {
  let conn;
  try {
    conn = await pool.getConnection();
    const results: T[] = await conn.query(sql, params);
    console.log(`Executed query: ${sql}`);
    return results;
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  } finally {
    if (conn) {
      try {
        conn.release(); // Release connection back to pool
      } catch (e) {
        console.error("Error closing connection:", e);
      }
    }
  }
}

// Type definitions for better maintainability
export interface Statement {
  dp_id: string;
  amount: number;
  deposit_date: string | null;
  owner_name: string;
  depositor_name: string;
  bank_name: string;
  reconciliation: string;
  ref_number: string;
  deposit_number: string;
  account_type: string;
  comment: string;
}

// Example usage with proper typing:
// const statements = await query<Statement>("SELECT * FROM statements");
