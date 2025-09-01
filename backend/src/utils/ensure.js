import { pool } from '../db.js';
import bcrypt from 'bcryptjs';

/**
 * Crea columnas/usuarios mínimos si faltan.
 * - agrega alias/almacen si no existen
 * - crea usuarios inventariador / cliente con contraseñas pedidas si no existen
 */
export async function ensureBootstrap() {
  // columnas en items
  await pool.query(`
    ALTER TABLE items
      ADD COLUMN IF NOT EXISTS alias   VARCHAR(100) NULL AFTER descripcion
  `).catch(()=>{});
  await pool.query(`
    ALTER TABLE items
      ADD COLUMN IF NOT EXISTS almacen VARCHAR(100) NULL AFTER alias
  `).catch(()=>{});

  // tabla usuarios
  await pool.query(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role ENUM('admin','inventariador','cliente') NOT NULL DEFAULT 'inventariador',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // insertar inventariador / cliente si no existen
  await ensureUser('inventariador', 'inv123', 'inventariador');
  await ensureUser('cliente', 'clin123', 'cliente');
}

async function ensureUser(username, password, role) {
  const [rows] = await pool.query('SELECT id FROM usuarios WHERE username = ?', [username]);
  if (rows.length) return;
  const hash = await bcrypt.hash(password, 10);
  await pool.query('INSERT INTO usuarios (username, password_hash, role) VALUES (?,?,?)',
    [username, hash, role]);
  console.log(`Seeded user: ${username} / ${role}`);
}
