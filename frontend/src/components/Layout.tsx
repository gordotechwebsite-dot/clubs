import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";

export default function Layout() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive
        ? "bg-white/15 text-white"
        : "text-white/80 hover:bg-white/10 hover:text-white"
    }`;

  return (
    <div className="min-h-full flex flex-col">
      <header className="bg-gradient-to-r from-titanes-dark via-titanes-navy to-titanes-crimson text-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="Titanes" className="h-12 w-12 object-contain drop-shadow" />
            <div className="hidden sm:block leading-tight">
              <div className="font-display text-xl tracking-wide">CLUB TITANES</div>
              <div className="text-xs opacity-80">Soatá · Panel de administración</div>
            </div>
          </Link>
          <nav className="ml-auto flex items-center gap-1">
            <NavLink to="/" end className={navLinkClass}>
              Inicio
            </NavLink>
            <NavLink to="/estudiantes" className={navLinkClass}>
              Estudiantes
            </NavLink>
            <NavLink to="/pagos" className={navLinkClass}>
              Pagos
            </NavLink>
          </nav>
          <div className="ml-4 flex items-center gap-3 text-sm">
            <span className="hidden md:inline opacity-90">{admin?.name}</span>
            <button
              className="rounded-md bg-white/10 hover:bg-white/20 px-3 py-1.5 text-xs font-semibold"
              onClick={() => {
                logout();
                navigate("/login");
              }}
            >
              Salir
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Outlet />
        </div>
      </main>
      <footer className="text-center text-xs text-slate-500 py-4">
        Club Titanes · Soatá · © {new Date().getFullYear()}
      </footer>
    </div>
  );
}
