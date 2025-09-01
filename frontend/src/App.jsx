// frontend/src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import TopBar from "./components/TopBar.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Inventory from "./pages/Inventory.jsx";
import PrivateRoute from "./router/PrivateRoute.jsx";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <TopBar />
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Inventario: admin e inventariador */}
          <Route element={<PrivateRoute roles={["admin", "inventariador"]} />}>
            <Route path="/inventario" element={<Inventory />} />
          </Route>

          {/* Dashboard: admin y cliente */}
          <Route element={<PrivateRoute roles={["admin", "cliente"]} />}>
            <Route path="/dashboard" element={<Dashboard />} />
          </Route>

          {/* raíz: si no hay sesión → /login; si hay sesión → a su home */}
          <Route
            path="/"
            element={<RedirectHome />}
          />

          {/* fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

function RedirectHome() {
  // Componente chico para decidir adónde mandar en "/"
  const { user } = require("./context/AuthContext.jsx").useAuth();
  if (!user) return <Navigate to="/login" replace />;
  const route =
    user.role === "inventariador"
      ? "/inventario"
      : "/dashboard";
  return <Navigate to={route} replace />;
}







