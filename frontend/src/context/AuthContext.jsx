import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const API_BASE = (import.meta.env?.VITE_API_URL || "http://localhost:4000").replace(/\/$/, "");
const AuthCtx = createContext(null);

// --- Helper sin dependencias para leer el payload del JWT ---
function parseJwtPayload(token) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  try {
    // base64url -> base64
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    // padding
    const padded = base64 + "===".slice((base64.length + 3) % 4);
    // decodificar
    const bin = atob(padded);
    const json = decodeURIComponent(
      bin.split("").map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join("")
    );
    return JSON.parse(json);
  } catch {
    return null; // si está corrupto, no rompe la app
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    try { return localStorage.getItem("token") || ""; } catch { return ""; }
  });

  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("user") || "null"); }
    catch { return null; }
  });

  // Persistencia segura
  useEffect(() => {
    try {
      if (token) localStorage.setItem("token", token);
      else localStorage.removeItem("token");
    } catch {}
  }, [token]);

  useEffect(() => {
    try {
      if (user) localStorage.setItem("user", JSON.stringify(user));
      else localStorage.removeItem("user");
    } catch {}
  }, [user]);

  // Si hay token sin usuario, intenta llenarlo desde el payload
  useEffect(() => {
    if (token && !user) {
      const p = parseJwtPayload(token);
      if (p?.username) setUser({ username: p.username, role: p.role });
    }
  }, [token, user]);

  const value = useMemo(() => ({
    token,
    user,
    apiBase: API_BASE,

    login: async (username, password) => {
      // No lanzar excepción no manejada; devolver Error claro si falla
      const r = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      if (!r.ok) {
        let msg = `Error HTTP ${r.status}`;
        try { const j = await r.json(); if (j?.error) msg = j.error; } catch {}
        throw new Error(msg);
      }
      const data = await r.json().catch(() => ({}));
      const t = data.token || "";
      setToken(t);

      let u = null;
      const p = parseJwtPayload(t);
      if (p?.username) u = { username: p.username, role: p.role };
      else if (data.user) u = data.user;

      setUser(u);
      return u;
    },

    logout: () => {
      setToken("");
      setUser(null);
    }
  }), [token, user]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);













