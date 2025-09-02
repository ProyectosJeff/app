// backend/src/index.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import { pool } from './db.js';
import authRoutes, { seedUsers } from './routes/auth.routes.js';
import itemsRoutes from './routes/items.routes.js';

const app = express();

const ORIGIN = (process.env.CORS_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({ origin: ORIGIN.length ? ORIGIN : true }));
app.use(express.json());

// Health simple + prueba DB
app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, db: true });
  } catch (e) {
    res.status(500).json({ ok: false, db: false, code: e.code || e.message });
  }
});
app.get('/api/debug/db', async (_req, res) => {
  try {
    const { DB_HOST, DB_PORT, DB_USER, DB_NAME } = process.env;
    const masked = (s) => (s ? s[0] + '***' + s.slice(-1) : '');
    // ping
    await pool.query('SELECT 1 AS ok');
    res.json({
      ok: true,
      env: {
        DB_HOST,
        DB_PORT,
        DB_USER: masked(DB_USER),
        DB_NAME
      }
    });
  } catch (e) {
    res.status(500).json({
      ok: false,
      code: e.code || null,
      errno: e.errno || null,
      sqlState: e.sqlState || null,
      message: e.message
    });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/items', itemsRoutes);

const PORT = Number(process.env.PORT || 4000);

async function start() {
  try {
    // ping de conexión antes de levantar el server
    const [rows] = await pool.query('SELECT 1 AS ok');
    console.log('[DB] Conexión OK:', rows[0].ok);

    // Semilla opcional (ejecuta solo si lo necesitas)
    if (process.env.SEED_ON_BOOT === 'true') {
      await seedUsers();
      console.log('[Seed] Usuarios iniciales verificados/creados');
    }

    app.listen(PORT, () => {
      console.log(`[API] escuchando en puerto ${PORT}`);
    });
  } catch (err) {
    console.error('[DB] Error de conexión:', err.code || err.message);
    process.exit(1); // aborta si no conecta
  }
}

start();

