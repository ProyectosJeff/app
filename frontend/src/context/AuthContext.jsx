// frontend/src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";
const BASE = API_BASE.replace(/\/$/, "");

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);         // { id, username, role }
  const [token, setToken] = useState(null);
  const [ready, setReady] = useState(false);

  // hidratar sesión
  useEffect(() => {
    try {
      const t = localStorage.getItem("token");
      const u = localStorage.getItem("user");
      if (t && u) {
        setToken(t);
        setUser(JSON.parse(u));
      }
    } catch {}
    setReady(true);
  }, []);

  const login = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    // No navegamos aquí: que cada pantalla decida (o TopBar)
  };

  // helper para fetch con auth
  const authFetch = async (input, init = {}) => {
    const headers = new Headers(init.headers || {});
    if (token) headers.set("Authorization", `Bearer ${token}`);
    const res = await fetch(input, { ...init, headers });

    // Si el token expiró → limpia sesión
    if (res.status === 401) {
      logout();
    }
    return res;
  };

  return (
    <AuthCtx.Provider value={{ user, token, ready, login, logout, authFetch, BASE }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  return useContext(AuthCtx);
}




