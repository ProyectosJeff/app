// src/pages/Inventory.jsx
import React, { useEffect, useMemo, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import "../styles/inventory.css";

const notifyDash = () => window.dispatchEvent(new Event("inventario:actualizado"));
const API = ((import.meta.env && import.meta.env.VITE_API_URL) || "http://localhost:4000").replace(/\/$/, "");

/* ========== ICONOS ========== */
const IconSearch = () => (
  <span className="icon"><svg viewBox="0 0 24 24" fill="none"><path d="M21 21l-3.5-3.5M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg></span>
);
const IconEye = () => (
  <span className="icon"><svg viewBox="0 0 24 24" fill="none"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/></svg></span>
);
const IconPlus = () => (
  <span className="icon"><svg viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg></span>
);
const IconEdit = () => (
  <span className="icon"><svg viewBox="0 0 24 24" fill="none"><path d="M4 21h4l10.5-10.5a2.121 2.121 0 1 0-3-3L5 18v3Z" stroke="currentColor" strokeWidth="2"/><path d="M13.5 6.5l4 4" stroke="currentColor" strokeWidth="2"/></svg></span>
);
const IconRestore = () => (
  <span className="icon"><svg viewBox="0 0 24 24" fill="none"><path d="M12 5v4l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 12a9 9 0 1 1-3-6.7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg></span>
);
const IconChevronsLeft = () => (
  <span className="icon"><svg viewBox="0 0 24 24" fill="none"><path d="M11 17l-5-5 5-5M18 17l-5-5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
);
const IconChevronLeft = () => (
  <span className="icon"><svg viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
);
const IconChevronRight = () => (
  <span className="icon"><svg viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
);

/* ========== HELPERS ========== */
function statusFrom(it){ if (it.conteo == null) return "pendiente"; const d = Number(it.diferencia ?? 0); return d===0?"conciliado":(d>0?"sobrante":"faltante"); }
function fmt(n){ const v = Number(n); if (n==null || Number.isNaN(v)) return "—"; return new Intl.NumberFormat("en-US",{minimumFractionDigits:2,maximumFractionDigits:2}).format(v); }
function normalizeNum(val){ if (val==null) return ""; return String(val).trim().replace(",","."); }
function dateOr(d){ return d?String(d).slice(0,10):"—"; }
function getPagesToShow(current,total){ if(total<=7) return Array.from({length:total},(_,i)=>i+1); const s=new Set([1,total,current,current-1,current+1,current-2,current+2]); const a=[...s].filter(p=>p>=1&&p<=total).sort((x,y)=>x-y); const r=[]; for(let i=0;i<a.length;i++){r.push(a[i]); if(i<a.length-1&&a[i+1]-a[i]>1) r.push("...");} return r; }

/* ========== Columnas (orden + anchos) ========== */
const ORDER_KEY = "inv.col.order.v1";
const WIDTH_KEY = "inv.col.widths.v1";
const DEFAULT_WIDTHS = {
  codigo:170, descripcion:320, alias:120, almacen:140, um:70,
  stock:90, conteo:90, diferencia:90, estatus:110, usuario:110, fecha:110, accion:96
};
const DEFAULT_COLS = [
  { key:"codigo",     label:"Cod.",        thClass:"col-code",       tdClass:"col-code",       render:(it)=> <span className="clip">{it.codigo}</span> },
  { key:"descripcion",label:"Descripción", thClass:"col-desc",       tdClass:"col-desc",       render:(it)=> <span className="clip2">{it.descripcion}</span> },
  { key:"alias",      label:"Alias",       thClass:"col-alias",      tdClass:"col-alias",      render:(it)=> it.alias || "—" },
  { key:"almacen",    label:"Almacén",     thClass:"col-almacen",    tdClass:"col-almacen",    render:(it)=> it.almacen || "—" },
  { key:"um",         label:"U.M.",        thClass:"col-um",         tdClass:"col-um",         render:(it)=> it.unidad_medida },
  { key:"stock",      label:"Stock",       thClass:"col-stock",      tdClass:"col-stock text-right",      render:(it)=> fmt(it.stock) },
  { key:"conteo",     label:"Conteo",      thClass:"col-conteo",     tdClass:"col-conteo text-right",     render:(it)=> it.conteo==null?"—":fmt(it.conteo) },
  { key:"diferencia", label:"Diferencia",  thClass:"col-diferencia", tdClass:"col-diferencia text-right", render:(it)=> it.diferencia==null?"—":fmt(it.diferencia) },
  { key:"estatus",    label:"Estatus",     thClass:"col-estatus",    tdClass:"col-estatus",    render:(it)=> <span className={`badge badge--${statusFrom(it)}`}>{statusFrom(it)}</span> },
  { key:"usuario",    label:"Usuario",     thClass:"col-usuario",    tdClass:"col-usuario",    render:(it)=> it.usuario_modifica || "—" },
  { key:"fecha",      label:"Fecha",       thClass:"col-fecha",      tdClass:"col-fecha",      render:(it)=> dateOr(it.fecha_modificacion) },
  { key:"accion",     label:"Acción",      thClass:"col-accion",     tdClass:"col-accion",     render:(it, onEdit)=>(<button className="btn btn-primary btn-sm" onClick={()=>onEdit(it)}><IconEdit/> Editar</button>) },
];

function useColumnState(){
  const [order, setOrderState] = useState(()=>{
    try{
      const saved = JSON.parse(localStorage.getItem(ORDER_KEY) || "[]");
      const keys = DEFAULT_COLS.map(c=>c.key);
      const merged = [...saved.filter(k=>keys.includes(k)), ...keys.filter(k=>!saved.includes(k))];
      return merged.length?merged:keys;
    }catch{ return DEFAULT_COLS.map(c=>c.key); }
  });
  const setOrder = (next)=>{ setOrderState(next); localStorage.setItem(ORDER_KEY, JSON.stringify(next)); };

  const [widths, setWidthsState] = useState(()=>{
    try{
      const w = JSON.parse(localStorage.getItem(WIDTH_KEY) || "{}");
      return { ...DEFAULT_WIDTHS, ...w };
    }catch{ return { ...DEFAULT_WIDTHS }; }
  });
  const setWidths = (next)=>{ setWidthsState(next); localStorage.setItem(WIDTH_KEY, JSON.stringify(next)); };

  const restoreAll = ()=>{
    const defOrder = DEFAULT_COLS.map(c=>c.key);
    setOrder(defOrder);
    setWidths({ ...DEFAULT_WIDTHS });
  };

  return { order, setOrder, widths, setWidths, restoreAll };
}

export default function Inventory(){
  const { token, user } = useAuth();
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [openNew, setOpenNew] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const headers = useMemo(()=>{
    const h = { "Content-Type": "application/json" };
    if (token) h.Authorization = `Bearer ${token}`;
    return h;
  },[token]);

  // === Traer TODO del backend (sin límite) para paginar en el front ===
  const loadAll = async ()=>{
    setLoading(true);
    try{
      const r = await fetch(`${API}/api/items?all=true`, { headers });
      const data = r.ok ? await r.json() : [];
      setItems(Array.isArray(data)?data:[]);
      setPage(1);
    }catch(e){ console.error(e); setItems([]); }
    finally{ setLoading(false); }
  };

  // === Buscar (también con all=true para no quedar limitado) ===
  const search = async ()=>{
    if (!q.trim()) return loadAll();
    setLoading(true);
    try{
      const qs = new URLSearchParams();
      qs.set("all","true");
      qs.set("q", q.trim());       // por si tu endpoint usa ?q=
      qs.set("codigo", q.trim());  // y por si usa ?codigo=
      const r = await fetch(`${API}/api/items?${qs.toString()}`, { headers });
      const data = r.ok ? await r.json() : [];
      setItems(Array.isArray(data)?data:(data?[data]:[]));
      setPage(1);
    }catch(e){ console.error(e); setItems([]); }
    finally{ setLoading(false); }
  };

  useEffect(()=>{ loadAll(); },[]);

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const current = items.slice(start, start + pageSize);

  const goFirst = ()=>setPage(1);
  const goPrev  = ()=>setPage(p=>Math.max(1,p-1));
  const goNext  = ()=>setPage(p=>Math.min(totalPages,p+1));
  const goLast  = ()=>setPage(totalPages);
  const pagesToShow = getPagesToShow(safePage, totalPages);

  const { order, setOrder, widths, setWidths, restoreAll } = useColumnState();
  const [dragKey, setDragKey] = useState(null);
  const [overKey, setOverKey] = useState(null);

  const colsByKey = useMemo(()=>{
    const map = new Map(DEFAULT_COLS.map(c=>[c.key,c]));
    return order.map(k=>map.get(k)).filter(Boolean);
  },[order]);

  const onDragStart = (e,key)=>{ setDragKey(key); e.dataTransfer.setData("text/plain", key); e.dataTransfer.effectAllowed="move"; };
  const onDragOver  = (e,key)=>{ e.preventDefault(); if (key!==overKey) setOverKey(key); };
  const onDragLeave = ()=> setOverKey(null);
  const onDrop = (e,dropKey)=>{
    e.preventDefault();
    const from = order.indexOf(dragKey);
    const to   = order.indexOf(dropKey);
    if (from===-1 || to===-1 || from===to){ setOverKey(null); setDragKey(null); return; }
    const next=[...order]; const [m]=next.splice(from,1); next.splice(to,0,m); setOrder(next);
    setOverKey(null); setDragKey(null);
  };

  const resizeRef = useRef({ active:false, key:null, startX:0, startW:0 });
  const startResize = (e,key)=>{
    e.stopPropagation();
    const startX = e.clientX;
    const startW = widths[key] ?? DEFAULT_WIDTHS[key] ?? 120;
    resizeRef.current = { active:true, key, startX, startW };
    document.addEventListener("mousemove", onResizing);
    document.addEventListener("mouseup", stopResize);
  };
  const onResizing = (e)=>{
    const st = resizeRef.current;
    if (!st.active) return;
    const dx = e.clientX - st.startX;
    const nextW = Math.max(70, Math.min(800, st.startW + dx));
    setWidths({ ...widths, [st.key]: nextW });
  };
  const stopResize = ()=>{
    resizeRef.current = { active:false, key:null, startX:0, startW:0 };
    document.removeEventListener("mousemove", onResizing);
    document.removeEventListener("mouseup", stopResize);
  };

  return (
    <div className="inventory-page">
      <div className="container">
        <div style={{ marginBottom: 6, color: "#cbd5e1" }}>
          <div style={{ fontWeight: 600 }}>Inventario</div>
          <div>Usuario activo: <b>{user?.username}</b></div>
        </div>

        {/* Toolbar (búsqueda + acciones) */}
        <div className="inv-toolbar">
          <div className="inv-search">
            <IconSearch />
            <input
              placeholder="Buscar (código, alias, almacén, descripción, etc.)"
              value={q}
              onChange={(e)=>setQ(e.target.value)}
              onKeyDown={(e)=> e.key==="Enter" && search()}
            />
          </div>

          <div className="inv-actions">
            <button onClick={search}  className="btn btn-primary"><IconSearch/> Buscar</button>
            <button onClick={loadAll} className="btn btn-secondary"><IconEye/> Ver todo</button>
            <button onClick={()=>setOpenNew(true)} className="btn btn-success"><IconPlus/> Nuevo</button>
            <button onClick={restoreAll} className="btn btn-secondary"><IconRestore/> Restaurar</button>
          </div>
        </div>

        <div className="inv-card">
          <div className="inv-table-wrap">
            <table className="inv-table">
              <colgroup>
                {colsByKey.map(col=>(
                  <col key={col.key} style={{ width: (widths[col.key] ?? DEFAULT_WIDTHS[col.key] ?? 120) + "px" }} />
                ))}
              </colgroup>
              <thead>
                <tr>
                  {colsByKey.map(col=>(
                    <th
                      key={col.key}
                      className={`drg ${col.thClass} ${overKey===col.key?"th-over":""} ${dragKey===col.key?"th-drag":""}`}
                      draggable
                      onDragStart={(e)=>onDragStart(e,col.key)}
                      onDragOver={(e)=>onDragOver(e,col.key)}
                      onDragLeave={onDragLeave}
                      onDrop={(e)=>onDrop(e,col.key)}
                      title="Arrastra para reordenar. Usa el grip ▮ para cambiar ancho."
                    >
                      <span className="th-label">{col.label}</span>
                      <span className="col-resizer" onMouseDown={(e)=>startResize(e,col.key)} title="Redimensionar" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={colsByKey.length} className="td-center">Cargando…</td></tr>}
                {!loading && current.length===0 && <tr><td colSpan={colsByKey.length} className="td-center">Sin resultados</td></tr>}
                {!loading && current.map(it=>(
                  <tr key={it.id}>
                    {colsByKey.map(col=>(
                      <td key={col.key} className={col.tdClass}>
                        {col.key==="accion" ? col.render(it, (item)=>setEditItem(item)) : col.render(it)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* MÓVIL: Cards */}
          <div className="inv-cards">
            {loading && <div className="inv-cardItem">Cargando…</div>}
            {!loading && current.length===0 && <div className="inv-cardItem">Sin resultados</div>}
            {!loading && current.map(it=>(
              <div key={it.id} className="inv-cardItem">
                <div className="inv-cardHead">
                  <div>
                    <div className="inv-title">{it.codigo} — {it.descripcion}</div>
                    <div className="inv-sub">{it.unidad_medida} • {dateOr(it.fecha_modificacion)} • {it.usuario_modifica || "—"}</div>
                  </div>
                  <span className={`badge badge--chip badge--${statusFrom(it)}`}>{statusFrom(it)}</span>
                </div>
                <div className="kv"><span className="label">Alias</span><span className="value">{it.alias || "—"}</span></div>
                <div className="kv"><span className="label">Almacén</span><span className="value">{it.almacen || "—"}</span></div>
                <div className="kv"><span className="label">Stock</span><span className="value">{fmt(it.stock)}</span></div>
                <div className="kv"><span className="label">Conteo</span><span className="value">{it.conteo==null?"—":fmt(it.conteo)}</span></div>
                <div className="kv"><span className="label">Diferencia</span><span className="value">{it.diferencia==null?"—":fmt(it.diferencia)}</span></div>
                <div className="card-actions">
                  <button className="btn btn-primary btn-sm" onClick={()=>setEditItem(it)}><IconEdit/> Editar</button>
                </div>
              </div>
            ))}
          </div>

          {/* PAGINACIÓN */}
          <div className="table-nav">
            <div className="left">
              <div className="page-size">
                <span>Por página</span>
                <select value={pageSize} onChange={(e)=>{ setPageSize(Number(e.target.value)); setPage(1); }}>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={500}>500</option>
                  <option value={1000}>1000</option>
                </select>
              </div>
              <div className="muted">Mostrando <b>{current.length}</b> de <b>{total}</b> registros</div>
            </div>
            <div className="right">
              <div className="pager">
                <button className="page-btn" onClick={goFirst} disabled={safePage===1} title="Primera"><IconChevronsLeft/></button>
                <button className="page-btn" onClick={goPrev}  disabled={safePage===1} title="Anterior"><IconChevronLeft/></button>
                {pagesToShow.map((p,i)=> p==="..." ? <span key={`d${i}`} className="dots">…</span> :
                  <button key={p} className={`page-btn ${p===safePage?"page-btn--active":""}`} onClick={()=>setPage(p)}>{p}</button>
                )}
                <button className="page-btn" onClick={goNext} disabled={safePage===totalPages} title="Siguiente"><IconChevronRight/></button>
                <button className="page-btn" onClick={goLast} disabled={safePage===totalPages} title="Última">»</button>
              </div>
            </div>
          </div>
        </div>

        {/* MODALES */}
        {openNew && (
          <NewItemModal
            headers={headers}
            onClose={()=>setOpenNew(false)}
            onCreated={()=>{ setOpenNew(false); loadAll(); notifyDash(); }}
          />
        )}
        {editItem && (
          <EditItemModal
            item={editItem}
            headers={headers}
            onClose={()=>setEditItem(null)}
            onSaved={()=>{ setEditItem(null); loadAll(); notifyDash(); }}
          />
        )}
      </div>
    </div>
  );
}

/* ========= Modal Crear ========= */
function NewItemModal({ headers, onClose, onCreated }) {
  const { user } = useAuth();
  const [codigo, setCodigo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [alias, setAlias] = useState("");
  const [almacen, setAlmacen] = useState("");
  const [unidad, setUnidad] = useState("UND");
  const [stock, setStock] = useState("0");
  const [conteo, setConteo] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const first = useRef(null);
  const unidades = ["UND","M","KG","CJ","PAQ","LT","PAR"];

  useEffect(()=>{ first.current?.focus(); },[]);

  const submit = async (e)=>{
    e.preventDefault();
    setError("");
    const cod = codigo.trim().toUpperCase();
    if (!cod){ setError("El código es obligatorio"); return; }
    const body = {
      codigo: cod,
      descripcion: descripcion.trim(),
      alias: alias.trim() || null,
      almacen: almacen.trim() || null,
      unidad_medida: unidad,
      stock: Number(normalizeNum(stock||"0")),
      conteo: conteo==="" ? null : Number(normalizeNum(conteo)),
      usuario: user?.username || "admin",
    };
    try{
      setSaving(true);
      const r = await fetch(`${API}/api/items`, { method:"POST", headers, body: JSON.stringify(body) });
      const data = await r.json().catch(()=> ({}));
      if (r.status===201) return onCreated?.(data);
      if (r.status===409) return setError("El código ya existe. Usa otro.");
      setError(data?.error || `No se pudo crear (HTTP ${r.status}).`);
    }catch(err){ console.error(err); setError("Error de red al crear el ítem."); }
    finally{ setSaving(false); }
  };

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal-card" onMouseDown={(e)=>e.stopPropagation()}>
        <div className="modal-head">
          <h2 className="m-0">Nuevo ítem</h2>
          <button onClick={onClose} className="btn btn-secondary btn-sm">✕</button>
        </div>
        <div className="modal-body">
          <form onSubmit={submit}>
            <div className="modal-grid modal-grid--cols3">
              <div className="field">
                <label>Código *</label>
                <input ref={first} value={codigo} onChange={(e)=>setCodigo(e.target.value)} placeholder="A005" />
              </div>
              <div className="field">
                <label>U. Medida</label>
                <select value={unidad} onChange={(e)=>setUnidad(e.target.value)}>
                  {unidades.map(u=><option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Stock inicial</label>
                <input type="number" inputMode="decimal" step="0.01" value={stock} onChange={(e)=>setStock(e.target.value)} />
              </div>

              <div className="field field--full">
                <label>Descripción</label>
                <input value={descripcion} onChange={(e)=>setDescripcion(e.target.value)} placeholder="Producto X" />
              </div>

              <div className="field">
                <label>Alias (opcional)</label>
                <input value={alias} onChange={(e)=>setAlias(e.target.value)} placeholder="Alias (opcional)" />
              </div>
              <div className="field">
                <label>Almacén (opcional)</label>
                <input value={almacen} onChange={(e)=>setAlmacen(e.target.value)} placeholder="Almacén (opcional)" />
              </div>
              <div className="field">
                <label>Conteo (opcional)</label>
                <input type="number" inputMode="decimal" step="0.01" value={conteo} onChange={(e)=>setConteo(e.target.value)} />
              </div>
            </div>

            {error && <div className="form-error">{error}</div>}

            <div className="modal-actions">
              <button type="button" onClick={onClose} className="btn btn-secondary">Cancelar</button>
              <button type="submit" disabled={saving} className="btn btn-success">{saving? "Guardando…" : "Crear"}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ========= Modal Editar ========= */
function EditItemModal({ item, headers, onClose, onSaved }) {
  const { user } = useAuth();
  const [conteo, setConteo] = useState(item?.conteo ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e)=>{
    e.preventDefault();
    setError("");
    if (conteo==="" || conteo==null){ setError("Ingrese un conteo"); return; }
    try{
      setSaving(true);
      const r = await fetch(`${API}/api/items/${item.id}/conteo`, {
        method:"PUT", headers,
        body: JSON.stringify({ conteo: Number(normalizeNum(conteo)), usuario: user?.username || "admin" }),
      });
      const data = await r.json().catch(()=> ({}));
      if (!r.ok) return setError(data?.error || `No se pudo guardar (HTTP ${r.status}).`);
      onSaved?.(data);
    }catch(err){ console.error(err); setError("Error de red al guardar."); }
    finally{ setSaving(false); }
  };

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal-card" onMouseDown={(e)=>e.stopPropagation()}>
        <div className="modal-head">
          <h2 className="m-0">Editar conteo — {item?.codigo}</h2>
          <button onClick={onClose} className="btn btn-secondary btn-sm">✕</button>
        </div>
        <div className="modal-body">
          <form onSubmit={submit}>
            <div className="modal-grid">
              <div className="field">
                <label>Stock (referencia)</label>
                <input value={fmt(item?.stock)} readOnly />
              </div>
              <div className="field">
                <label>Conteo</label>
                <input type="number" inputMode="decimal" step="0.01" value={conteo} onChange={(e)=>setConteo(e.target.value)} autoFocus/>
              </div>
              <div className="field field--full muted">Se recalcularán diferencia, estatus, usuario y fecha.</div>
            </div>
            {error && <div className="form-error">{error}</div>}
            <div className="modal-actions">
              <button type="button" onClick={onClose} className="btn btn-secondary">Cancelar</button>
              <button type="submit" disabled={saving} className="btn btn-primary">{saving? "Guardando…" : "Guardar"}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}




