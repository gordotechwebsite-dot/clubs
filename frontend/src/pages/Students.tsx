import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { studentsApi } from "../api";
import type { Student } from "../types";
import { formatCOP } from "../utils";
import StudentForm from "../components/StudentForm";

export default function Students() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [activeOnly, setActiveOnly] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const { data } = await studentsApi.list({ search: search || undefined, active_only: activeOnly });
      setStudents(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    load();
  }

  async function onDelete(s: Student) {
    if (
      !confirm(
        `¿Eliminar a ${s.full_name}?\n\nSe borrarán también sus pagos registrados. Esta acción no se puede deshacer.`
      )
    ) {
      return;
    }
    await studentsApi.remove(s.id);
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl text-titanes-dark">Estudiantes</h1>
          <p className="text-slate-500 text-sm">Directorio y control del club</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          + Nuevo estudiante
        </button>
      </div>

      <form className="flex items-center gap-3 flex-wrap" onSubmit={onSearchSubmit}>
        <input
          className="input max-w-sm"
          placeholder="Buscar por nombre, documento o teléfono"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={(e) => setActiveOnly(e.target.checked)}
          />
          Solo activos
        </label>
        <button type="submit" className="btn-ghost">
          Buscar
        </button>
      </form>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 uppercase text-xs">
            <tr>
              <th className="text-left px-4 py-3">Nombre</th>
              <th className="text-left px-4 py-3">Deporte · Categoría</th>
              <th className="text-left px-4 py-3">Contacto</th>
              <th className="text-right px-4 py-3">Cuota</th>
              <th className="text-right px-4 py-3">Deuda</th>
              <th className="text-center px-4 py-3">Estado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr>
                <td colSpan={7} className="text-center py-8 text-slate-400">
                  Cargando...
                </td>
              </tr>
            )}
            {!loading && students.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-8 text-slate-400">
                  No hay estudiantes. Agrega uno nuevo.
                </td>
              </tr>
            )}
            {students.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-900">{s.full_name}</div>
                  <div className="text-xs text-slate-500">{s.document_id || "—"}</div>
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {[s.sport, s.category].filter(Boolean).join(" · ") || "—"}
                </td>
                <td className="px-4 py-3">
                  <div>{s.phone || "—"}</div>
                  <div className="text-xs text-slate-500">{s.guardian_name || ""}</div>
                </td>
                <td className="px-4 py-3 text-right">{formatCOP(s.monthly_fee)}</td>
                <td className="px-4 py-3 text-right">
                  <span
                    className={s.balance > 0 ? "text-rose-700 font-semibold" : "text-slate-500"}
                  >
                    {formatCOP(s.balance)}
                  </span>
                  {s.pending_months > 0 && (
                    <div className="text-xs text-rose-600">{s.pending_months} mes(es)</div>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={
                      s.is_active
                        ? "badge bg-emerald-100 text-emerald-800"
                        : "badge bg-slate-200 text-slate-600"
                    }
                  >
                    {s.is_active ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <Link to={`/estudiantes/${s.id}`} className="text-titanes-navy font-medium hover:underline mr-4">
                    Ver →
                  </Link>
                  <button
                    className="text-rose-600 hover:text-rose-800 font-medium"
                    onClick={() => onDelete(s)}
                    title="Eliminar estudiante"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <StudentForm
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            load();
          }}
        />
      )}
    </div>
  );
}
