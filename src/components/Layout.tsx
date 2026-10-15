import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import { useStore } from "../store";

const publicLinks = [
  { to: "/earn", label: "Earn points" },
  { to: "/help", label: "Help and rules" },
];

const memberLinks = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/earn", label: "Earn points" },
  { to: "/report", label: "Report an issue" },
  { to: "/my-reports", label: "My reports" },
  { to: "/rewards", label: "Rewards" },
  { to: "/ledger", label: "Ledger" },
  { to: "/help", label: "Help and rules" },
];

export default function Layout() {
  const { balance } = useStore();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = user ? memberLinks : publicLinks;

  async function onLogout() {
    await logout();
    navigate("/");
  }

  return (
    <>
      <header className="site-header">
        <div className="wrap header-row">
          <Link to="/" className="brand">
            <span className="brand-seal" aria-hidden="true">CP</span>
            Citizen Points
          </Link>
          <nav aria-label="Main" className="nav">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} className={({ isActive }) => (isActive ? "active" : "")}>
                {l.label}
              </NavLink>
            ))}
          </nav>
          <div className="header-actions">
            {user ? (
              <>
                <span className="balance-chip" title="Your current points">{balance} pts</span>
                <span className="small user-name">{user.name}</span>
                <button className="btn btn-small" onClick={onLogout}>Sign out</button>
              </>
            ) : (
              <Link to="/login" className="btn btn-small">Sign in</Link>
            )}
          </div>
        </div>
      </header>
      <main className="wrap page">
        <Outlet />
      </main>
      <footer className="site-footer">
        <div className="wrap footer-row">
          <span>Citizen Points is a verified civic contribution and rewards platform.</span>
          {user?.role === "verifier" && (
            <span>
              <Link to="/admin">Verifier portal</Link>
            </span>
          )}
        </div>
      </footer>
    </>
  );
}
