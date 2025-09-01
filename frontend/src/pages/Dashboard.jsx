// frontend/src/pages/Dashboard.jsx
import React, { useEffect, useMemo, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";
const BASE = API_BASE.replace(/\/$/, "");
const ITEMS_URL = `${BASE}/api/items`;

/** Estilos mínimos SOLO para la dona (no altera el resto del layout) */
function DonutStyles() {
  return (
    <style>{`
/* La dona ya la pintas con conic-gradient; aquí sólo mejoramos legibilidad */
.donut,
.donut--lg { position: relative; isolation: isolate; }

/* Agujero claro, tamaño proporcional. No toca el tamaño de la dona original */
.donut::after,
.donut--lg::after {
  content: "";
  position: absolute;
  inset: 22%;              /* diámetro del agujero (ajusta entre 20%-26% si quieres) */
  background: #f8fafc;     /* claro para contrastar con la dona */
  border-radius: 50%;
  box-shadow: inset 0 2px 6px rgba(2, 6, 23, .08);
  z-index: 1;
}

/* Texto centrado por encima del agujero */
.donut .donut-inner,
.donut--lg .donut-inner {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  z-index: 2;
  text-align: center;
  pointer-events: none;
}

.donut .donut-num,
.donut--lg .donut-num {
  font-weight: 800;
  font-size: clamp(1.6rem, 4.2vw, 2.6rem); /* responsivo sin romper tu layout */
  line-height: 1;
  color: #0b1220;
  letter-spacing: -0.02em;
  text-shadow: 0 1px 0 #fff, 0 0 1px rgba(0,0,0,.06);
}

.donut .donut-sub,
.donut--lg .donut-sub {
  margin-top: 4px;
  font-weight: 600;
  color: #475569;
  letter-spacing: .02em;
}

/* En pantallas pequeñas, abrimos un poco más el agujero para que “items” no quede apretado */
@media (max-width: 640px) {
  .donut::after,
  .donut--lg::after { inset: 24%; }
  .donut .donut-sub,
  .donut--lg .donut-sub { font-size: .95rem; }
}
    `}</style>
  );
}

export default function Dashboard() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Traer TODOS los items: intenta ?all=true y, si no existe, hace paginado (page/size)
  const load = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token") || "";
      const headers = { Authorization: `Bearer ${token}` };

      // 1) Intento directo: all=true
      const rAll = await fetch(`${ITEMS_URL}?all=true&t=${Date.now()}`, {
        headers,
        cache: "no-store",
      });

      if (rAll.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
        return;
      }

      if (rAll.ok) {
        const data = (await rAll.json()) || [];
        if (Array.isArray(data)) {
          setItems(data);
          setLoading(false);
          return;
        }
      }

      // 2) Fallback: paginado
      const acc = [];
      const SIZE = 1000;
      let page = 1;

      while (true) {
        const r = await fetch(`${ITEMS_URL}?page=${page}&size=${SIZE}&t=${Date.now()}`, {
          headers,
          cache: "no-store",
        });

        if (r.status === 401) {
          localStorage.removeItem("token");
          window.location.href = "/login";
          return;
        }
        if (!r.ok) break;

        const chunk = (await r.json()) || [];

        // Soporta dos formatos: array directo o { items, total }
        if (Array.isArray(chunk)) {
          acc.push(...chunk);
          if (chunk.length < SIZE) break;
        } else if (chunk && Array.isArray(chunk.items)) {
          acc.push(...chunk.items);
          const total = Number(chunk.total ?? acc.length);
          if (acc.length >= total || chunk.items.length < SIZE) break;
        } else {
          break;
        }

        page++;
      }

      setItems(acc);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // refrescar al volver de inventario y al volver el tab a foreground
  useEffect(() => {
    const onInv = () => load();
    const onVis = () => { if (document.visibilityState === "visible") load(); };
    window.addEventListener("inventario:actualizado", onInv);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("inventario:actualizado", onInv);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  // KPIs
  const stats = useMemo(() => {
    const s = { total: 0, pendiente: 0, conciliado: 0, faltante: 0, sobrante: 0 };
    for (const it of items) {
      s.total++;
      const est = it.conteo == null ? "pendiente" : String(it.estatus || "").toLowerCase();
      if (est === "conciliado") s.conciliado++;
      else if (est === "faltante") s.faltante++;
      else if (est === "sobrante") s.sobrante++;
      else s.pendiente++;
    }
    return s;
  }, [items]);

  const userProgress = useMemo(() => {
    const map = new Map();
    for (const it of items) {
      if (it.conteo == null) continue;
      const u = it.usuario_modifica || it.usuario || "—";
      map.set(u, (map.get(u) || 0) + 1);
    }
    return [...map.entries()]
      .map(([user, count]) => ({ user, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [items]);

  const pct = (n) => (stats.total ? Math.round((n * 100) / stats.total) : 0);

  // dona (conic-gradient)
  const donutStops = [
    { c: "#f59e0b", v: stats.pendiente },
    { c: "#16a34a", v: stats.conciliado },
    { c: "#ef4444", v: stats.faltante },
    { c: "#3b82f6", v: stats.sobrante },
  ];
  let acc = 0;
  const gradient = donutStops
    .map((s) => {
      const from = acc;
      const to = acc + pct(s.v);
      acc = to;
      return `${s.c} ${from}% ${to}%`;
    })
    .join(", ");

  return (
    <div className="container" style={{ padding: "18px 0 28px" }}>
      <DonutStyles /> {/* <- sólo estilos de la dona */}

      <h2 style={{ margin: "6px 0 12px 0" }}>Dashboard</h2>

      {/* KPI compactos (fila) */}
      <div className="kpi-row">
        <div className="kpi kpi--total">
          <div className="kpi-title">Total items</div>
          <div className="kpi-value">{stats.total}</div>
        </div>
        <div className="kpi kpi--pend">
          <div className="kpi-title">Pendientes</div>
          <div className="kpi-value">{stats.pendiente}</div>
        </div>
        <div className="kpi kpi--conc">
          <div className="kpi-title">Conciliados</div>
          <div className="kpi-value">{stats.conciliado}</div>
        </div>
        <div className="kpi kpi--falt">
          <div className="kpi-title">Faltantes</div>
          <div className="kpi-value">{stats.faltante}</div>
        </div>
        <div className="kpi kpi--sobra">
          <div className="kpi-title">Sobrantes</div>
          <div className="kpi-value">{stats.sobrante}</div>
        </div>
      </div>

      {/* Resumen general: dona + barras */}
      <div className="dash-charts" style={{ marginTop: 14 }}>
        <div className="chart-box chart-box--wide">
          <h3 className="chart-title m-0">Resumen general</h3>

          <div className="chart-flex">
            {/* Izquierda: dona + leyenda */}
            <div className="chart-left">
              <div
                className="donut donut--lg"
                style={{ background: `conic-gradient(${gradient})` }}
                aria-label="Distribución por estatus"
                role="img"
              >
                <div className="donut-inner">
                  <div className="donut-num">{stats.total}</div>
                  <div className="donut-sub">items</div>
                </div>
              </div>

              <ul className="legend legend--light">
                <li>
                  <span className="dot" style={{ background: "#f59e0b" }} />
                  <span className="leg-label">Pendiente</span>
                  <span className="leg-val">{stats.pendiente} • {pct(stats.pendiente)}%</span>
                </li>
                <li>
                  <span className="dot" style={{ background: "#16a34a" }} />
                  <span className="leg-label">Conciliado</span>
                  <span className="leg-val">{stats.conciliado} • {pct(stats.conciliado)}%</span>
                </li>
                <li>
                  <span className="dot" style={{ background: "#ef4444" }} />
                  <span className="leg-label">Faltante</span>
                  <span className="leg-val">{stats.faltante} • {pct(stats.faltante)}%</span>
                </li>
                <li>
                  <span className="dot" style={{ background: "#3b82f6" }} />
                  <span className="leg-label">Sobrante</span>
                  <span className="leg-val">{stats.sobrante} • {pct(stats.sobrante)}%</span>
                </li>
              </ul>
            </div>

            <div className="chart-divider" />

            {/* Derecha: barras por usuario */}
            <div className="chart-right">
              <div className="bars">
                {userProgress.length === 0 && (
                  <div style={{ color: "#64748b" }}>Aún no hay conteos registrados.</div>
                )}
                {userProgress.map(({ user, count }) => {
                  const max = Math.max(...userProgress.map((u) => u.count), 1);
                  const h = Math.max(6, Math.round((count / max) * 180));
                  return (
                    <div className="bar-item" key={user}>
                      <div className="bar" style={{ height: `${h}px` }}>
                        <div className="bar-val">{count}</div>
                      </div>
                      <div className="bar-label" title={user}>{user}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading && <div style={{ opacity: 0.7, marginTop: 8 }}>Cargando…</div>}
    </div>
  );
}










