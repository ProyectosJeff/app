// backend/src/index.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import { pool } from './db.js';
import authRoutes, { seedUsers } from './routes/auth.routes.js';
import itemsRoutes from './routes/items.routes.js';

const app = express();

/* ===== CORS robusto: lista blanca + preflight ===== */
const allowlist = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean); // p.ej.: ["https://inventarioexistencias.netlify.app","http://localhost:5173"]

const corsOptions = {
  origin(origin, cb) {
    // Algunas solicitudes internas (o curl) no traen Origin
    if (!origin) return cb(null, true);
    const ok =
      allowlist.length === 0 ||
      allowlist.some(a => origin === a || origin.endsWith(a));
    cb(null, ok);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false, // pon true solo si vas a usar cookies
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // responder preflight

app.use(express.json());

/* ===== Health =====
   - No tumba la app si la DB falla.
   - Responde ok:true aunque la DB esté caída (db:false).
*/
app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, db: true });
  } catch (e) {
    res.status(200).json({ ok: true, db: false, code: e.code || String(e) });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/items', itemsRoutes);

const PORT = Number(process.env.PORT || 4000);

// ¡Arranca SIEMPRE el servidor!
app.listen(PORT, () => {
  console.log(`[API] escuchando en puerto ${PORT}`);
});

// Ping de DB en background (no tumba el proceso)
(async () => {
  try {
    await pool.query('SELECT 1');
    console.log('[DB] Conexión OK');
    if (process.env.SEED_ON_BOOT === 'true') {
      try {
        await seedUsers();
        console.log('[Seed] Usuarios iniciales verificados/creados');
      } catch (se) {
        console.error('[Seed] Error:', se.code || se.message);
      }
    }
  } catch (e) {
    console.error('[DB] Aún no conecta:', e.code || e.message);
  }
})();




