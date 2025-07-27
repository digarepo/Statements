// app/db.server.ts
import mariadb from "mariadb";

const pool = mariadb.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "Abcd1234@&",
  database: process.env.DB_NAME || "users",
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
        await conn.end(); // Properly close the connection
      } catch (e) {
        console.error("Error closing connection:", e);
      }
    }
  }
}

// Migration function to update table schema
export async function migrateUsersTable(): Promise<void> {
  try {
    // Drop existing table
    await query("DROP TABLE IF EXISTS users");

    // Create new table with updated schema
    await query(`
      CREATE TABLE users (
        dp_id VARCHAR(6) not null PRIMARY KEY,
        amount INT NOT NULL,
        deposit_date datetime DEFAULT NULL
      )
    `);

    console.log("Users table migrated successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
}

// Example usage with proper typing:
// interface User {
//   dp_id: string;
//   amount: number;
//   deposit_date: string | null;
// }
// const users = await query<User>("SELECT * FROM users");
// const users = await query<User>("SELECT * FROM users");
