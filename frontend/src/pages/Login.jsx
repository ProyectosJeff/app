// frontend/src/pages/Login.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

// ✅ BASE: usa env o localhost:4000 y quita la barra final
const BASE = (import.meta.env.VITE_API_URL || "http://localhost:4000").replace(/\/$/, "");

function homeFor(role) {
  if (role === "inventariador") return "/inventario";
  if (role === "cliente") return "/dashboard";
  return "/dashboard"; // admin
}

export default function Login() {
  // ❌ NO extraigas BASE del contexto (no existe y pisa a la constante de arriba)
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  // si ya tengo sesión, redirige según rol
  useEffect(() => {
    if (user?.role) navigate(homeFor(user.role), { replace: true });
  }, [user, navigate]);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);

    try {
      const r = await fetch(`${BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
        }),
      });

      const data = await r.json().catch(() => ({}));

      if (!r.ok) {
        setErr(data?.error || "Credenciales inválidas");
        return;
      }
      if (!data?.token || !data?.user) {
        setErr("Respuesta inválida del servidor");
        return;
      }

      // guarda token/usuario en el contexto
      login(data.token, data.user);

      // redirige por rol
      navigate(homeFor(data.user.role), { replace: true });
    } catch (e2) {
      console.error(e2);
      setErr("Error de red.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-wrap">
        <div className="login-card">
          <div className="brand-row">
            <div className="brand-mark">PA</div>
            <div>
              <h3 className="brand-title">Proyecto Alianza</h3>
              <div className="brand-sub">Acceso</div>
            </div>
          </div>

          <form onSubmit={submit}>
            <label className="login-label">Usuario</label>
            <input
              className="login-input"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
            />

            <label className="login-label">Contraseña</label>
            <input
              className="login-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />

            {err && <div className="login-error">{err}</div>}

            <button className="login-btn" disabled={loading}>
              {loading ? "Ingresando…" : "Ingresar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}





