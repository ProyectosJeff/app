// backend/src/index.js
import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
dotenv.config();

import authRoutes, { seedUsers } from "./routes/auth.routes.js";
import itemsRoutes from "./routes/items.routes.js";

const app = express();

// ---------- CORS profesional (Netlify + Dev) ----------
/*
  CORS_ORIGIN admite:
  - "*"  -> permitir todo (útil en dev)
  - "https://sitio.netlify.app,https://otro.com" -> lista separada por comas
*/
const rawOrigins = (process.env.CORS_ORIGIN || "*")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

const allowAll = rawOrigins.includes("*");

const corsOptions = allowAll
  ? {} // equivalente a cors() sin restricciones
  : {
      origin: rawOrigins, // array de dominios permitidos
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      optionsSuccessStatus: 204
    };

app.use(cors(allowAll ? undefined : corsOptions));
// ------------------------------------------------------

app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

// healthcheck (útil para Railway)
app.get("/health", (_req, res) => res.send("ok"));

// raíz simple
app.get("/", (_req, res) => res.json({ ok: true }));

// rutas
app.use("/api/auth", authRoutes);
app.use("/api/items", itemsRoutes);

// puerto (Railway provee PORT)
const PORT = Number(process.env.PORT || 4000);

app.listen(PORT, async () => {
  console.log(`[API] escuchando en http://localhost:${PORT}`);

  // Si quieres evitar sembrar en producción, usa SEED_ON_START=false
  const shouldSeed = String(process.env.SEED_ON_START || "true").toLowerCase() !== "false";

  if (shouldSeed) {
    try {
      await seedUsers(); // crea admin / inventariador / cliente si faltan
      console.log("[Seed] OK");
    } catch (e) {
      console.error("[Seed] Error:", e);
    }
  }
});
