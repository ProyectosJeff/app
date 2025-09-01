import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';

const router = Router();

/**
 * Seeds mínimos: crea admin / inventariador / cliente si no existen.
 * admin: admin123  | inventariador: inv123 | cliente: clin123
 */
export async function seedUsers() {
  const need = ['admin', 'inventariador', 'cliente'];

  // ¿quiénes existen ya?
  const rows = await query(
    `SELECT username FROM users WHERE username IN (?,?,?)`,
    need
  );
  const have = new Set(rows.map(r => r.username));

  const toInsert = [];
  if (!have.has('admin')) {
    toInsert.push(['admin', await bcrypt.hash('admin123', 10), 'admin']);
  }
  if (!have.has('inventariador')) {
    toInsert.push(['inventariador', await bcrypt.hash('inv123', 10), 'inventariador']);
  }
  if (!have.has('cliente')) {
    toInsert.push(['cliente', await bcrypt.hash('clin123', 10), 'cliente']);
  }

  // IMPORTANTE: insertar uno por uno con execute (placeholders ?,?,?)
  for (const [username, hash, role] of toInsert) {
    await query(
      `INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)`,
      [username, hash, role]
    );
  }

  if (toInsert.length) {
    console.log('[Seed] Usuarios creados:', toInsert.map(r => r[0]).join(', '));
  }
}

router.post('/login', async (req, res) => {
  try {
    const { username = '', password = '' } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ error: 'Faltan credenciales' });
    }

    const rows = await query(
      `SELECT id, username, password_hash, role FROM users WHERE username = ? LIMIT 1`,
      [username]
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const u = rows[0];
    const ok = await bcrypt.compare(password, u.password_hash || '');
    if (!ok) return res.status(401).json({ error: 'Credenciales inválidas' });

    const token = jwt.sign(
      { id: u.id, username: u.username, role: u.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '2d' }
    );

    return res.json({
      token,
      user: { id: u.id, username: u.username, role: u.role }
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Error de servidor' });
  }
});

export default router;

