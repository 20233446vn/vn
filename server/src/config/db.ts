import mysql from "mysql2";
import dotenv from "dotenv";

dotenv.config();
console.log("🔵 DB_NAME backend đang dùng:", process.env.DB_NAME);
console.log("👉 File index.ts đang chạy:", __filename);

// Tạo pool kết nối MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 10,
  charset: "utf8mb4_general_ci"
});

// Dùng Promise để tiện await
export const db = pool.promise();

// Hàm test kết nối
export async function testConnection() {
  try {
    const [rows] = await db.query("SELECT 1 + 1 AS result");
    const result = (rows as any)[0].result;
    console.log("✅ MySQL connected! Test query result:", result);
  } catch (error) {
    console.error("❌ MySQL connection error:", error);
  }
}
