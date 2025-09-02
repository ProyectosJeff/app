// backend/src/db.js
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Conecta usando UNA sola variable de entorno:
 * - DB_URL (preferida)
 *   o, si no existe:
 * - MYSQL_URL (privada de Railway)
 * - MYSQL_PUBLIC_URL (proxy público de Railway)
 *
 * Ejemplos de URL:
 *   mysql://root:XXXX@mysql.railway.internal:3306/railway
 *   mysql://root:XXXX@<proxy-domain>:<proxy-port>/railway
 */

const URL =
  process.env.DB_URL ||
  process.env.MYSQL_URL ||
  process.env.MYSQL_PUBLIC_URL;

if (!URL) {
  throw new Error('No hay DB_URL/MYSQL_URL/MYSQL_PUBLIC_URL configurada');
}

// Garantizamos timezone=Z en la URL
const sep = URL.includes('?') ? '&' : '?';
const finalUrl = `${URL}${sep}timezone=Z`;

export const pool = mysql.createPool(finalUrl);

export async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

