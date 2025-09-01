import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

/* =======================
   Helper: decodifica JWT (sin libs)
   ======================= */
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
      bin
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(json);
  } catch {
    return null; // si está corrupto, no crashea la app
  }
}

/* =======================
   Config API
   ======================= */
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";
export const BASE = API_BASE.replace(/\/$/, "");

/* =======================
   Contexto de Autenticación
   ======================= */
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // token
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");

  // usuario: primero intenta de localStorage, luego del JWT (si hay)
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("user");
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        /* ignore */
      }
    }
    const payload = parseJwtPayload(localStorage.getItem("token") || "");
    // adapta a lo que devuelve tu backend:
    // si metes el user completo en el token, úsalo;
    // si solo trae username/role, construimos un objeto simple.
    if (payload?.user) return payload.user;
    if (payload?.username || payload?.role) {
      return { username: payload.username || "", role: payload.role || "" };
    }
    return null;
  });

  // sincroniza al cambiar token
  useEffect(() => {
    if (!token) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
      return;
    }
    localStorage.setItem("token", token);

    // si no hay user en memoria, intenta del token
    if (!user) {
      const payload = parseJwtPayload(token);
      let u = null;
      if (payload?.user) u = payload.user;
      else if (payload?.username || payload?.role) {
        u = { username: payload.username || "", role: payload.role || "" };
      }
      if (u) {
        setUser(u);
        localStorage.setItem("user", JSON.stringify(u));
      }
    }
  }, [token]);

  // API pública del contexto
  const login = (jwt, userObj) => {
    // guarda token
    setToken(jwt);

    // preferimos el user del backend si viene; si no, del token
    let u = userObj;
    if (!u) {
      const p = parseJwtPayload(jwt);
      if (p?.user) u = p.user;
      else if (p?.username || p?.role) {
        u = { username: p.username || "", role: p.role || "" };
      }
    }
    if (!u) u = null;

    setUser(u);
    if (u) localStorage.setItem("user", JSON.stringify(u));
    else localStorage.removeItem("user");
  };

  const logout = () => {
    setToken("");
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  const value = useMemo(
    () => ({ token, user, login, logout, BASE }),
    [token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}











