import { Router } from "express";
import { pool } from "../db.js";
import { authRequired } from "../middleware/auth.js";
const r = Router();
r.get("/items", async (_req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM items");
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
r.get("/", authRequired, async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) return res.status(400).json({ error: "code requerido" });
    const [rows] = await pool.query("SELECT * FROM items WHERE codigo=?", [
      code,
    ]);
    if (!rows.length) return res.status(404).json({ error: "No encontrado" });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
r.put("/:id/count", authRequired, async (req, res) => {
  try {
    const { id } = req.params;
    const { conteo } = req.body;
    if (conteo === undefined || conteo === null)
      return res.status(400).json({ error: "conteo requerido" });
    const [rows] = await pool.query("SELECT stock FROM items WHERE id=?", [id]);
    if (!rows.length) return res.status(404).json({ error: "Item no existe" });
    const stock = Number(rows[0].stock);
    const c = Number(conteo);
    const dif = c - stock;
    let est = "conciliado";
    if (dif < 0) est = "faltante";
    else if (dif > 0) est = "sobrante";
    const now = new Date();
    const fecha = now.toISOString().slice(0, 10);
    const hora = now.toTimeString().slice(0, 8);
    await pool.query(
      "UPDATE items SET conteo=?,diferencia=?,estatus=?,usuario_modifica=?,fecha_modificacion=?,hora_modificacion=? WHERE id=?",
      [c, dif, est, req.user.username, fecha, hora, id]
    );
    const [upd] = await pool.query("SELECT * FROM items WHERE id=?", [id]);
    res.json(upd[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
export default r;
