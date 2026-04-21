import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { attendanceApi, studentsApi } from "../../api";
import type { Attendance, Student } from "../../types";
import PageHeader from "../../components/PageHeader";
import AttendanceBadge from "../../components/AttendanceBadge";
import { CATEGORIES, formatDateEs, SPORTS } from "../../utils";

function firstOfMonth(): string {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().slice(0, 10);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function AttendanceHistory() {
  const [dateFrom, setDateFrom] = useState(firstOfMonth());
  const [dateTo, setDateTo] = useState(today());
  const [studentFilter, setStudentFilter] = useState<string>("");
  const [sportFilter, setSportFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [students, setStudents] = useState<Record<number, Student>>({});
  const [records, setRecords] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadStudents() {
    const { data } = await studentsApi.list();
    const byId: Record<number, Student> = {};
    data.forEach((s) => {
      byId[s.id] = s;
    });
    setStudents(byId);
  }

  async function load() {
    setLoading(true);
    try {
      const { data } = await attendanceApi.list({
        student_id: studentFilter ? Number(studentFilter) : undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      });
      const filtered = data.filter((r) => {
        const s = students[r.student_id];
        if (!s) return true;
        if (sportFilter && s.sport !== sportFilter) return false;
        if (categoryFilter && s.category !== categoryFilter) return false;
        return true;
      });
      setRecords(filtered);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadStudents();
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFrom, dateTo, studentFilter, sportFilter, categoryFilter, students]);

  const totals = useMemo(() => {
    const base = { present: 0, absent: 0, late: 0, excused: 0 };
    records.forEach((r) => {
      base[r.status] += 1;
    });
    const rate =
      records.length > 0
        ? ((base.present + base.late) / records.length) * 100
        : 0;
    return { ...base, total: records.length, rate };
  }, [records]);

  const studentList = useMemo(
    () => Object.values(students).sort((a, b) => a.full_name.localeCompare(b.full_name)),
    [students]
  );

  return (
    <div>
      <PageHeader
        eyebrow="Asistencia"
        title="Historial de asistencia"
        subtitle="Consulta y audita los registros de asistencia por rango de fechas o por deportista."
        actions={
          <Link to="/asistencia" className="btn-primary">
            Tomar asistencia
          </Link>
        }
      />

      <div className="card p-4 flex items-end gap-4 flex-wrap mb-6">
        <div>
          <label className="label">Desde</label>
          <input
            type="date"
            className="input w-48"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Hasta</label>
          <input
            type="date"
            className="input w-48"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Deporte</label>
          <select
            className="input w-44"
            value={sportFilter}
            onChange={(e) => setSportFilter(e.target.value)}
          >
            <option value="">Todos</option>
            {SPORTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Categoría</label>
          <select
            className="input w-44"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">Todas</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Deportista</label>
          <select
            className="input w-64"
            value={studentFilter}
            onChange={(e) => setStudentFilter(e.target.value)}
          >
            <option value="">Todos</option>
            {studentList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.full_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="card p-4">
          <div className="stat-label">Registros</div>
          <div className="stat-num mt-1">{totals.total}</div>
        </div>
        <div className="card p-4">
          <div className="stat-label">Presentes</div>
          <div className="stat-num mt-1 text-emerald-700">{totals.present}</div>
        </div>
        <div className="card p-4">
          <div className="stat-label">Tarde</div>
          <div className="stat-num mt-1 text-amber-600">{totals.late}</div>
        </div>
        <div className="card p-4">
          <div className="stat-label">Ausentes</div>
          <div className="stat-num mt-1 text-rose-700">{totals.absent}</div>
        </div>
        <div className="card p-4">
          <div className="stat-label">Índice</div>
          <div className="stat-num mt-1">{totals.rate.toFixed(1)}%</div>
        </div>
      </div>

      <div className="card">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                Fecha
              </th>
              <th className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                Deportista
              </th>
              <th className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                Estado
              </th>
              <th className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                Disciplina
              </th>
              <th className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                Observaciones
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-slate-500">
                  Cargando registros
                </td>
              </tr>
            ) : records.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-slate-500">
                  No hay registros en el rango seleccionado.
                </td>
              </tr>
            ) : (
              records.map((r) => {
                const s = students[r.student_id];
                return (
                  <tr key={r.id} className="border-b border-slate-100">
                    <td className="px-6 py-3 text-sm text-slate-700">
                      {formatDateEs(r.session_date)}
                    </td>
                    <td className="px-6 py-3 text-sm font-semibold text-slate-900">
                      {s ? (
                        <Link
                          to={`/estudiantes/${s.id}`}
                          className="hover:text-titanes-navy"
                        >
                          {s.full_name}
                        </Link>
                      ) : (
                        `#${r.student_id}`
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <AttendanceBadge status={r.status} />
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-600">
                      {s ? [s.sport, s.category].filter(Boolean).join(" / ") || "—" : "—"}
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-600">
                      {r.notes || "—"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
