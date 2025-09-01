// frontend/src/router/PrivateRoute.jsx
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

function homeFor(role) {
  if (role === "inventariador") return "/inventario";
  if (role === "cliente") return "/dashboard";
  return "/dashboard";
}

export default function PrivateRoute({ roles }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  if (roles && roles.length && !roles.includes(user.role)) {
    return <Navigate to={homeFor(user.role)} replace />;
  }

  return <Outlet />;
}
