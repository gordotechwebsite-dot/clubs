import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { studentsApi } from "../../api";
import type { Student } from "../../types";
import { formatCOP } from "../../utils";
import PageHeader from "../../components/PageHeader";
import StudentPhoto from "../../components/StudentPhoto";

export default function StudentsList() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeOnly, setActiveOnly] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const { data } = await studentsApi.list({
        search: search || undefined,
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
  }, []);

  function onSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    load();
  }

  async function onDelete(s: Student) {
    if (
      !confirm(
        `Eliminar a ${s.full_name} del roster?\n\nTambién se borrarán sus pagos registrados. Esta acción no se puede deshacer.`
      )
    ) {
      return;
    }
    await studentsApi.remove(s.id);
    load();
  }

  return (
    <div>
      <PageHeader
        eyebrow="Roster oficial"
        title="Estudiantes del club"
        subtitle="Directorio completo del Club Titanes. Cada ficha centraliza datos, pagos, carnet y factura del deportista."
        actions={
          <Link to="/estudiantes/nuevo" className="btn-primary">
            Inscribir nuevo
          </Link>
        }
      />

      <form
        className="card p-4 flex items-end gap-4 flex-wrap mb-6"
        onSubmit={onSearchSubmit}
      >
        <div className="flex-1 min-w-[220px]">
          <label className="label">Buscar</label>
          <input
            className="input"
            placeholder="Nombre, documento o teléfono"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
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
          Aplicar filtros
        </button>
      </form>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
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
                    className="text-[11px] font-semibold uppercase tracking-widest text-rose-700 hover:text-rose-900"
                    onClick={() => onDelete(s)}
                  >
                    Eliminar
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
