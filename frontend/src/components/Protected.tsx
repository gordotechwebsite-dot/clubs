import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../auth";

export default function Protected({ children }: { children: ReactNode }) {
  const { admin, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Cargando...
      </div>
    );
  }
  if (!admin) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}
