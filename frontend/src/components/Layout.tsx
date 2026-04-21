import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";

export default function Layout() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-4 py-2 text-xs font-semibold uppercase tracking-widest transition-colors border-b-2 ${
      isActive
        ? "border-titanes-red text-slate-900"
        : "border-transparent text-slate-500 hover:text-slate-900"
    }`;

  return (
    <div className="min-h-full flex flex-col bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-6">
          <Link to="/" className="flex items-center gap-4">
            <img
              src="/logo.png"
              alt="Club Titanes"
              className="h-14 w-14 object-contain"
            />
            <div className="leading-tight">
              <div className="display text-2xl text-slate-900">CLUB TITANES</div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.4em] text-slate-500">
                Soatá Boyacá
              </div>
            </div>
          </Link>
          <nav className="ml-auto hidden md:flex items-center">
            <NavLink to="/" end className={navLinkClass}>
              Inicio
            </NavLink>
            <NavLink to="/estudiantes" className={navLinkClass}>
              Roster
            </NavLink>
            <NavLink to="/pagos" className={navLinkClass}>
              Pagos
            </NavLink>
          </nav>
          <div className="flex items-center gap-4 text-sm">
            <div className="hidden md:block text-right leading-tight">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                Administrador
              </div>
              <div className="text-sm font-semibold text-slate-900">
                {admin?.name}
              </div>
            </div>
            <button
              className="btn-ghost"
              onClick={() => {
                logout();
                navigate("/login");
              }}
            >
              Cerrar sesión
            </button>
          </div>
        </div>
        <div className="h-1 accent-bar" />
      </header>
      <nav className="md:hidden border-b border-slate-200 bg-white overflow-x-auto">
        <div className="px-4 flex">
          <NavLink to="/" end className={navLinkClass}>
            Inicio
          </NavLink>
          <NavLink to="/estudiantes" className={navLinkClass}>
            Roster
          </NavLink>
          <NavLink to="/pagos" className={navLinkClass}>
            Pagos
          </NavLink>
        </div>
      </nav>
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <Outlet />
        </div>
      </main>
      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="" className="h-8 w-8 object-contain opacity-80" />
            <div>
              <div className="display text-sm text-slate-900">CLUB TITANES</div>
              <div className="uppercase tracking-widest text-[10px]">
                Soatá Boyacá
              </div>
            </div>
          </div>
          <div className="text-right uppercase tracking-widest text-[10px]">
            Registro oficial del club
            <div className="text-slate-400 normal-case tracking-normal mt-0.5">
              {new Date().getFullYear()} Club Titanes
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
