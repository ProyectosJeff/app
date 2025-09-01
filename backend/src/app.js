import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import authRoutes from './routes/auth.routes.js';
import itemsRoutes from './routes/items.routes.js';

const app = express();

const ORIGINS = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map(s => s.trim());

app.use(cors({ origin: ORIGINS, credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

// salud
app.get('/api/health', (req, res) => res.json({ ok: true }));

// rutas
app.use('/api/auth', authRoutes);
app.use('/api/items', itemsRoutes);

// manejo de errores
app.use((err, _req, res, _next) => {
  console.error('API error:', err);
  res.status(500).json({ error: 'Server error' });
});

export default app;
