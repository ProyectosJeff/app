import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { jwtDecode } from "jwt-decode";

// URL del API (Railway) embebida por Vite en build
export const BASE = (import.meta.env.VITE_API_URL || "http://localhost:4000").replace(/\/$/, "");

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

function safeDecode(token) {
  try {
    return jwtDecode(token); // <-- solo decodifica (no verifica firma)
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const [user, setUser] = useState(() => {
    const t = localStorage.getItem("token");
    if (!t) return null;
    const p = safeDecode(t);
    // tu backend suele devolver user explícito en /login; si no, toma del payload
    return p?.user || null;
  });

  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }
    const p = safeDecode(token);
    if (!p) {
      setToken("");
      localStorage.removeItem("token");
      setUser(null);
      return;
    }
    // si ya tienes el user en localStorage (lo guardas al hacer login), úsalo primero
    const fromLS = localStorage.getItem("user");
    if (fromLS) {
      try { setUser(JSON.parse(fromLS)); } catch { setUser(null); }
    } else {
      setUser(p?.user ?? null);
    }
  }, [token]);

  const value = useMemo(() => ({
    token,
    user,
    login: (t, u) => {
      localStorage.setItem("token", t);
      if (u) localStorage.setItem("user", JSON.stringify(u));
      setToken(t);
      setUser(u || null);
    },
    logout: () => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setToken("");
      setUser(null);
    },
    BASE,
  }), [token, user]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}






