// backend/src/routes/items.routes.js
import { Router } from 'express';
import { query } from '../db.js';
import { authRequired } from '../middlewares/auth.js';

const router = Router();

/* =========================================================
   GET /api/items
   - Sin page/size => devuelve ARRAY (compatibilidad UI)
   - Con page/size => devuelve { total, page, size, rows }
   - Filtro por q= o codigo=
========================================================= */
router.get('/', authRequired, async (req, res) => {
  try {
    const qRaw = (req.query.q ?? req.query.codigo ?? '').trim();
    const hasPagination = ('page' in req.query) || ('size' in req.query);

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const size = Math.min(1000, Math.max(1, parseInt(req.query.size, 10) || 100));

    const where = [];
    const params = [];

    if (qRaw) {
      const like = `%${qRaw}%`;
      where.push('(codigo LIKE ? OR descripcion LIKE ? OR alias LIKE ? OR almacen LIKE ?)');
      params.push(like, like, like, like);
    }
    const whereSQL = where.length ? `WHERE ${where.join(' AND ')}` : '';

    if (hasPagination) {
      const offset = (page - 1) * size;
      const totalRow = await query(`SELECT COUNT(*) AS total FROM items ${whereSQL}`, params);
      const total = totalRow[0]?.total ?? 0;

      const rows = await query(
        `
        SELECT
          id, codigo, descripcion, alias, almacen,
          unidad_medida, stock, conteo, diferencia, estatus,
          usuario_modifica, fecha_modificacion, hora_modificacion
        FROM items
        ${whereSQL}
        ORDER BY id ASC
        LIMIT ? OFFSET ?
        `,
        [...params, size, offset]
      );

      return res.json({ total, page, size, rows });
    } else {
      const rows = await query(
        `
        SELECT
          id, codigo, descripcion, alias, almacen,
          unidad_medida, stock, conteo, diferencia, estatus,
          usuario_modifica, fecha_modificacion, hora_modificacion
        FROM items
        ${whereSQL}
        ORDER BY id ASC
        `,
        params
      );

      return res.json(rows);
    }
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Error de servidor' });
  }
});

/* =========================================================
   POST /api/items   (CREAR)
   Body esperado:
   {
     codigo, descripcion, alias, almacen, unidad_medida,
     stock, conteo (opcional), usuario (quien crea/conteo)
   }
   - 201 con el item creado
   - 409 si codigo ya existe
========================================================= */
router.post('/', authRequired, async (req, res) => {
  try {
    const {
      codigo,
      descripcion = null,
      alias = null,
      almacen = null,
      unidad_medida = 'UND',
      stock = 0,
      conteo = null,
      usuario = req.user?.username || null,
    } = req.body || {};

    const cod = (codigo || '').trim().toUpperCase();
    if (!cod) return res.status(400).json({ error: 'El código es obligatorio' });

    // Duplicado
    const dup = await query(`SELECT id FROM items WHERE codigo=?`, [cod]);
    if (dup.length) return res.status(409).json({ error: 'El código ya existe' });

    const stockVal = Number(stock) || 0;
    const conteoVal = (conteo === null || conteo === undefined || isNaN(Number(conteo)))
      ? null
      : Number(conteo);

    const diferencia = conteoVal == null ? null : (conteoVal - stockVal);
    let estatus = 'pendiente';
    if (conteoVal != null) {
      estatus = diferencia === 0 ? 'conciliado' : (diferencia > 0 ? 'sobrante' : 'faltante');
    }

    // Fechas sólo si hay conteo
    const setDate = conteoVal == null ? 'NULL' : 'CURDATE()';
    const setTime = conteoVal == null ? 'NULL' : 'CURTIME()';
    const usuarioMod = conteoVal == null ? null : (usuario || null);

    await query(
      `
      INSERT INTO items
        (codigo, descripcion, alias, almacen, unidad_medida,
         stock, conteo, diferencia, estatus,
         usuario_modifica, fecha_modificacion, hora_modificacion)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ${setDate}, ${setTime})
      `,
      [
        cod,
        descripcion,
        alias,
        (almacen || null),
        unidad_medida,
        stockVal,
        conteoVal,
        diferencia,
        estatus,
        usuarioMod,
      ]
    );

    // Devuelvo el registro creado
    const rows = await query(
      `
      SELECT
        id, codigo, descripcion, alias, almacen,
        unidad_medida, stock, conteo, diferencia, estatus,
        usuario_modifica, fecha_modificacion, hora_modificacion
      FROM items
      WHERE codigo=?
      `,
      [cod]
    );

    return res.status(201).json(rows[0]);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Error de servidor' });
  }
});

/* =========================================================
   PUT /api/items/:id/conteo   (EDITAR CONTEO)
========================================================= */
router.put('/:id/conteo', authRequired, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const conteo = req.body?.conteo;
    const usuario = (req.body?.usuario || req.user?.username || null);

    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    if (conteo === null || conteo === undefined || !Number.isFinite(Number(conteo))) {
      return res.status(400).json({ error: 'Conteo inválido' });
    }

    const row = await query(`SELECT stock FROM items WHERE id=?`, [id]);
    if (row.length === 0) return res.status(404).json({ error: 'Ítem no encontrado' });

    const stock = Number(row[0].stock) || 0;
    const c = Number(conteo);
    const diferencia = c - stock;

    let estatus = 'pendiente';
    estatus = diferencia === 0 ? 'conciliado' : (diferencia > 0 ? 'sobrante' : 'faltante');

    await query(
      `
      UPDATE items
      SET conteo=?,
          diferencia=?,
          estatus=?,
          usuario_modifica=?,
          fecha_modificacion=CURDATE(),
          hora_modificacion=CURTIME()
      WHERE id=?
      `,
      [c, diferencia, estatus, usuario, id]
    );

    const updated = await query(
      `
      SELECT
        id, codigo, descripcion, alias, almacen,
        unidad_medida, stock, conteo, diferencia, estatus,
        usuario_modifica, fecha_modificacion, hora_modificacion
      FROM items
      WHERE id=?
      `,
      [id]
    );

    return res.json(updated[0]);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Error de servidor' });
  }
});

export default router;

