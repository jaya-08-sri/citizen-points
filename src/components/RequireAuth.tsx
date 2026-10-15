import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../auth";

export default function RequireAuth({ role }: { role?: "verifier" }) {
  const { user, loading } = useAuth();

  if (loading) return <p className="muted">Loading...</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) {
    return (
      <div className="narrow">
        <h1>Access restricted</h1>
        <p>This area is only for verifiers.</p>
      </div>
    );
  }
  return <Outlet />;
}
