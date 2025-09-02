// backend/src/index.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import { pool } from './db.js';
import authRoutes, { seedUsers } from './routes/auth.routes.js';
import itemsRoutes from './routes/items.routes.js';

const app = express();

/* === CORS robusto (lista blanca + preflight) === */
const allowlist = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean); // p.ej.: ["https://inventarioexistencias.netlify.app","http://localhost:5173"]

const corsOptions = {
  origin(origin, cb) {
    // Algunas solicitudes (curl/health, o mismas de servidor) no traen Origin
    if (!origin) return cb(null, true);

    // Coincidencia exacta o por sufijo (útil si usas subdominios)
    const ok =
      allowlist.length === 0 ||
      allowlist.some(a => origin === a || origin.endsWith(a));

    cb(null, ok);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false, // pon true si realmente vas a usar cookies
};

app.use(cors(corsOptions));
// Responder preflight para cualquier ruta
app.options('*', cors(corsOptions));

app.use(express.json());

// Health + prueba DB
app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, db: true });
  } catch (e) {
    res.status(500).json({ ok: false, db: false, code: e.code || e.message });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/items', itemsRoutes);

const PORT = Number(process.env.PORT || 4000);

async function start() {
  try {
    const [rows] = await pool.query('SELECT 1 AS ok');
    console.log('[DB] Conexión OK:', rows[0].ok);

    if (process.env.SEED_ON_BOOT === 'true') {
      await seedUsers();
      console.log('[Seed] Usuarios iniciales verificados/creados');
    }

    app.listen(PORT, () => {
      console.log(`[API] escuchando en puerto ${PORT}`);
    });
  } catch (err) {
    console.error('[DB] Error de conexión:', err.code || err.message);
    process.exit(1);
  }
}

start();



