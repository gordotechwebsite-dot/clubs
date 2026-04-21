import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@clubtitanes.com");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        "No se pudo iniciar sesión";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-white border border-slate-200 shadow-sm">
          <div className="h-1 accent-bar" />
          <div className="px-8 pt-8 pb-6 flex flex-col items-center">
            <img src="/logo.png" alt="Club Titanes" className="h-24 w-24 object-contain" />
            <div className="display text-2xl text-slate-900 mt-4">CLUB TITANES</div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.4em] text-slate-500 mt-1">
              Soatá Boyacá
            </div>
            <div className="mt-8 w-full">
              <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-titanes-red mb-2">
                Acceso privado
              </div>
              <h1 className="h-section mb-6">Panel administrativo</h1>
              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <label className="label">Correo electrónico</label>
                  <input
                    type="email"
                    className="input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
                <div>
                  <label className="label">Contraseña</label>
                  <input
                    type="password"
                    className="input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </div>
                {error && (
                  <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2">
                    {error}
                  </div>
                )}
                <button type="submit" className="btn-primary w-full" disabled={loading}>
                  {loading ? "Ingresando" : "Ingresar al sistema"}
                </button>
              </form>
            </div>
          </div>
          <div className="px-8 py-4 border-t border-slate-200 text-center text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400">
            Registro oficial del club
          </div>
        </div>
      </div>
    </div>
  );
}
