import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { studentsApi } from "../../api";
import type { Student } from "../../types";
import { CATEGORIES, formatCOP, SPORTS } from "../../utils";
import PageHeader from "../../components/PageHeader";
import StudentPhoto from "../../components/StudentPhoto";

export default function StudentsList() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sport, setSport] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [activeOnly, setActiveOnly] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const { data } = await studentsApi.list({
        search: search || undefined,
        sport: sport || undefined,
        category: category || undefined,
        active_only: activeOnly,
      });
      setStudents(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sport, category, activeOnly]);

  function onSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    load();
  }

  async function onArchiveToggle(s: Student) {
    const nextActive = !s.is_active;
    const verbo = nextActive ? "Restaurar" : "Archivar";
    const mensaje = nextActive
      ? `Restaurar a ${s.full_name} como activo en la plantilla?`
      : `Archivar a ${s.full_name}?\n\nEl registro y todos sus datos se conservan, solo deja de aparecer en los listados activos.`;
    if (!confirm(`${verbo} ${mensaje}`)) return;
    await studentsApi.update(s.id, { is_active: nextActive });
    load();
  }

  return (
    <div>
      <PageHeader
        eyebrow="Plantilla oficial"
        title="Estudiantes del club"
        subtitle="Directorio completo del Club Titanes. Cada ficha centraliza datos, pagos, carnet y factura del deportista."
        actions={
          <Link to="/estudiantes/nuevo" className="btn-primary">
            Inscribir nuevo
          </Link>
        }
      />

      <form
        className="card p-3 md:p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4 mb-4 md:mb-6"
        onSubmit={onSearchSubmit}
      >
        <div className="sm:col-span-2 lg:col-span-2 min-w-0">
          <label className="label">Buscar</label>
          <input
            className="input"
            placeholder="Nombre, documento o teléfono"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="min-w-0">
          <label className="label">Deporte</label>
          <select
            className="input"
            value={sport}
            onChange={(e) => setSport(e.target.value)}
          >
            <option value="">Todos</option>
            {SPORTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-0">
          <label className="label">Categoría</label>
          <select
            className="input"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Todas</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end gap-3 flex-wrap">
          <label className="flex items-center gap-2 text-sm text-slate-700 pb-2">
            <input
              type="checkbox"
              className="h-4 w-4 accent-titanes-navy"
              checked={activeOnly}
              onChange={(e) => setActiveOnly(e.target.checked)}
            />
            Solo activos
          </label>
          <button type="submit" className="btn-ghost">
            Buscar
          </button>
        </div>
      </form>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[860px] text-sm">
          <thead className="bg-slate-900 text-white text-[10px] uppercase tracking-widest">
            <tr>
              <th className="text-left px-4 py-3 w-16">N°</th>
              <th className="text-left px-4 py-3">Deportista</th>
              <th className="text-left px-4 py-3">Disciplina</th>
              <th className="text-left px-4 py-3">Contacto</th>
              <th className="text-right px-4 py-3">Cuota</th>
              <th className="text-right px-4 py-3">Saldo</th>
              <th className="text-center px-4 py-3">Estado</th>
              <th className="text-right px-4 py-3 w-48">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading && (
              <tr>
                <td colSpan={8} className="text-center py-10 text-slate-400 uppercase tracking-widest text-xs">
                  Cargando
                </td>
              </tr>
            )}
            {!loading && students.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-10 text-slate-400">
                  No hay estudiantes registrados. Inscribe el primero.
                </td>
              </tr>
            )}
            {students.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50">
                <td className="px-4 py-4">
                  <span className="display text-xl text-slate-400">
                    {s.id.toString().padStart(3, "0")}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <StudentPhoto url={s.photo_url} name={s.full_name} size="sm" />
                    <div>
                      <div className="font-semibold text-slate-900">{s.full_name}</div>
                      <div className="text-xs text-slate-500">
                        {s.document_id ? `CC ${s.document_id}` : "Documento pendiente"}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-slate-700">
                  <div className="font-medium">{s.sport || "Sin disciplina"}</div>
                  <div className="text-xs text-slate-500">{s.category || ""}</div>
                </td>
                <td className="px-4 py-4 text-slate-700">
                  <div>{s.phone || "Sin teléfono"}</div>
                  <div className="text-xs text-slate-500">{s.guardian_name || ""}</div>
                </td>
                <td className="px-4 py-4 text-right font-mono text-sm">
                  {formatCOP(s.monthly_fee)}
                </td>
                <td className="px-4 py-4 text-right">
                  <div
                    className={`font-mono ${
                      s.balance > 0 ? "text-rose-700 font-semibold" : "text-slate-500"
                    }`}
                  >
                    {formatCOP(s.balance)}
                  </div>
                  {s.pending_months > 0 && (
                    <div className="text-[10px] uppercase tracking-widest text-rose-600">
                      {s.pending_months} mes pendiente
                    </div>
                  )}
                </td>
                <td className="px-4 py-4 text-center">
                  <span className={s.is_active ? "pill-active" : "pill-inactive"}>
                    {s.is_active ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-4 py-4 text-right whitespace-nowrap">
                  <Link to={`/estudiantes/${s.id}`} className="btn-link mr-4">
                    Ver ficha
                  </Link>
                  <button
                    className="text-[11px] font-semibold uppercase tracking-widest text-slate-600 hover:text-slate-900"
                    onClick={() => onArchiveToggle(s)}
                  >
                    {s.is_active ? "Archivar" : "Restaurar"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
