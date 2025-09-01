// frontend/src/components/TopBar.jsx
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function TopBar() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();

  const canSeeDash = user && (user.role === "admin" || user.role === "cliente");
  const canSeeInv  = user && (user.role === "admin" || user.role === "inventariador");

  return (
    <header
      className="topbar"
      style={{
        background: "linear-gradient(180deg,#2450c2,#1739a1)",
        color: "#fff",                 // <- asegúrate que sea #fff (sin la 's')
        padding: "10px 14px",
        boxShadow: "0 2px 12px rgba(0,0,0,.25)",
      }}
    >
      <div
        className="container"
        style={{ display: "flex", alignItems: "center", gap: 14, justifyContent: "space-between" }}
      >
        {/* left */}
        <nav style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontWeight: 800, letterSpacing: 0.3 }}>Proyecto Alianza</span>

          {canSeeDash && (
            <Link
              to="/dashboard"
              className={`toplink ${pathname.startsWith("/dashboard") ? "is-active" : ""}`}
              style={{ color: "#fff", textDecoration: "none" }}   // <- forzado inline
            >
              Dashboard
            </Link>
          )}

          {canSeeInv && (
            <Link
              to="/inventario"
              className={`toplink ${pathname.startsWith("/inventario") ? "is-active" : ""}`}
              style={{ color: "#fff", textDecoration: "none" }}   // <- forzado inline
            >
              Inventario
            </Link>
          )}
        </nav>

        {/* right */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {user && (
            <span>
              Sesión: <b>{user.username}</b>
            </span>
          )}
          {user && (
            <button className="btn btn-outline btn-sm" onClick={logout}>
              Salir
            </button>
          )}
        </div>
      </div>
    </header>
  );
}


