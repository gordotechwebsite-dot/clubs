import { useEffect, useMemo, useState } from "react";
import { attendanceApi } from "../../api";
import type { AttendanceSheetEntry, AttendanceStatus } from "../../types";
import PageHeader from "../../components/PageHeader";
import { CATEGORIES, formatDateEs, SPORTS } from "../../utils";

const STATUS_OPTIONS: { value: AttendanceStatus; label: string; btnClass: string }[] = [
  {
    value: "present",
    label: "Presente",
    btnClass: "bg-emerald-700 text-white border-emerald-700 hover:bg-emerald-800",
  },
  {
    value: "late",
    label: "Tarde",
    btnClass: "bg-amber-500 text-white border-amber-500 hover:bg-amber-600",
  },
  {
    value: "excused",
    label: "Excusa",
    btnClass: "bg-sky-600 text-white border-sky-600 hover:bg-sky-700",
  },
  {
    value: "absent",
    label: "Ausente",
    btnClass: "bg-rose-600 text-white border-rose-600 hover:bg-rose-700",
  },
];

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function AttendanceSheet() {
  const [sessionDate, setSessionDate] = useState<string>(today());
  const [sport, setSport] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [entries, setEntries] = useState<AttendanceSheetEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setSaveMsg(null);
    try {
      const { data } = await attendanceApi.sheet({
        session_date: sessionDate,
        sport: sport || undefined,
        category: category || undefined,
        only_active: true,
      });
      setEntries(data.entries);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionDate, sport, category]);

  function setStatus(studentId: number, status: AttendanceStatus) {
    setEntries((prev) =>
      prev.map((e) => (e.student_id === studentId ? { ...e, status } : e))
    );
  }

  function setNotes(studentId: number, notes: string) {
    setEntries((prev) =>
      prev.map((e) => (e.student_id === studentId ? { ...e, notes } : e))
    );
  }

  function markAll(status: AttendanceStatus) {
    setEntries((prev) => prev.map((e) => ({ ...e, status })));
  }

  async function save() {
    setSaving(true);
    setSaveMsg(null);
    try {
      const toSave = entries
        .filter((e) => e.status)
        .map((e) => ({
          student_id: e.student_id,
          status: e.status as AttendanceStatus,
          notes: e.notes,
        }));
      if (toSave.length === 0) {
        setSaveMsg("Marca al menos un estudiante antes de guardar.");
        return;
      }
      await attendanceApi.bulk(sessionDate, toSave);
      setSaveMsg(`Asistencia guardada para ${toSave.length} estudiantes.`);
      load();
    } finally {
      setSaving(false);
    }
  }

  const summary = useMemo(() => {
    const base = { present: 0, absent: 0, late: 0, excused: 0, pending: 0 };
    entries.forEach((e) => {
      if (e.status) {
        base[e.status] += 1;
      } else {
        base.pending += 1;
      }
    });
    return base;
  }, [entries]);

  return (
    <div>
      <PageHeader
        eyebrow="Asistencia"
        title="Planilla del día"
        subtitle={`Registro de asistencia para la sesión del ${formatDateEs(sessionDate)}. Marca el estado de cada deportista y guarda los cambios.`}
        actions={
          <button className="btn-primary" onClick={save} disabled={saving || loading}>
            {saving ? "Guardando" : "Guardar asistencia"}
          </button>
        }
      />

      <div className="card p-3 md:p-4 mb-4 md:mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
          <div className="min-w-0">
            <label className="label">Fecha de sesión</label>
            <input
              type="date"
              className="input"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
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
        </div>
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <button className="btn-ghost" onClick={() => markAll("present")}>
            Todos presentes
          </button>
          <button className="btn-ghost" onClick={() => markAll("absent")}>
            Todos ausentes
          </button>
        </div>
      </div>

      {saveMsg && (
        <div className="mb-6 border-l-4 border-titanes-navy bg-slate-50 px-4 py-3 text-sm text-slate-700">
          {saveMsg}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="card p-4">
          <div className="stat-label">Presentes</div>
          <div className="stat-num mt-1 text-emerald-700">{summary.present}</div>
        </div>
        <div className="card p-4">
          <div className="stat-label">Tarde</div>
          <div className="stat-num mt-1 text-amber-600">{summary.late}</div>
        </div>
        <div className="card p-4">
          <div className="stat-label">Excusas</div>
          <div className="stat-num mt-1 text-sky-700">{summary.excused}</div>
        </div>
        <div className="card p-4">
          <div className="stat-label">Ausentes</div>
          <div className="stat-num mt-1 text-rose-700">{summary.absent}</div>
        </div>
        <div className="card p-4">
          <div className="stat-label">Sin marcar</div>
          <div className="stat-num mt-1 text-slate-500">{summary.pending}</div>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[780px]">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-widest text-slate-500 w-10">
                #
              </th>
              <th className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                Deportista
              </th>
              <th className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                Deporte
              </th>
              <th className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                Estado
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
                  Cargando planilla
                </td>
              </tr>
            ) : entries.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-slate-500">
                  No hay deportistas activos para los filtros seleccionados.
                </td>
              </tr>
            ) : (
              entries.map((e, idx) => (
                <tr key={e.student_id} className="border-b border-slate-100">
                  <td className="px-6 py-3 text-sm text-slate-500">{idx + 1}</td>
                  <td className="px-6 py-3 text-sm font-semibold text-slate-900">
                    {e.student_name}
                  </td>
                  <td className="px-6 py-3 text-sm text-slate-600">
                    {[e.sport, e.category].filter(Boolean).join(" / ") || "—"}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {STATUS_OPTIONS.map((opt) => {
                        const active = e.status === opt.value;
                        return (
                          <button
                            key={opt.value}
                            onClick={() => setStatus(e.student_id, opt.value)}
                            className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest border rounded-sm transition-colors ${
                              active
                                ? opt.btnClass
                                : "bg-white text-slate-700 border-slate-300 hover:border-slate-500"
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <input
                      type="text"
                      className="input text-sm py-1.5"
                      placeholder="Opcional"
                      value={e.notes ?? ""}
                      onChange={(ev) => setNotes(e.student_id, ev.target.value)}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
