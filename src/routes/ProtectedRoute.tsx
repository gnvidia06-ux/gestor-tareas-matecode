import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  // Mientras Firebase todavia esta revisando si hay sesion guardada,
  // no mostramos nada (evita el "parpadeo" hacia /login antes de tiempo).
  if (loading) {
    return <p>Cargando...</p>;
  }

  // Si ya terminó de cargar y no hay usuario, redirige a /login.
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Si hay usuario, muestra la pagina protegida normalmente.
  return <>{children}</>;
}