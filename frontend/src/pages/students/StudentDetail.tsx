import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { attendanceApi, paymentsApi, studentsApi } from "../../api";
import type { Attendance, AttendanceStats, Payment, Student } from "../../types";
import AttendanceBadge from "../../components/AttendanceBadge";
import { currentPeriod, formatCOP, formatDateEs, MONTH_NAMES_ES } from "../../utils";
import PageHeader from "../../components/PageHeader";
import PaymentBadge from "../../components/PaymentBadge";
import StudentPhoto from "../../components/StudentPhoto";

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
        {label}
      </div>
      <div className="text-sm text-slate-900 font-medium mt-0.5">{value}</div>
    </div>
  );
}

export default function StudentDetail() {
  const { id } = useParams<{ id: string }>();
  const studentId = Number(id);
  const [student, setStudent] = useState<Student | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, p, a, st] = await Promise.all([
        studentsApi.get(studentId),
        paymentsApi.list({ student_id: studentId }),
        attendanceApi.list({ student_id: studentId }),
        attendanceApi.stats(studentId),
      ]);
      setStudent(s.data);
      setPayments(p.data);
      setAttendance(a.data);
      setAttendanceStats(st.data);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function onAddMonth() {
    if (!student) return;
    const { year, month } = currentPeriod();
    try {
      await paymentsApi.create({
        student_id: student.id,
        period_year: year,
        period_month: month,
        amount_due: student.monthly_fee,
        amount_paid: 0,
      });
      setMessage(`Cobro de ${MONTH_NAMES_ES[month - 1]} ${year} creado.`);
      load();
    } catch (err) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        "No se pudo crear el cobro";
      setMessage(msg);
    }
  }

  async function onMarkPaid(p: Payment) {
    await paymentsApi.markPaid(p.id, {});
    load();
  }

  async function onMarkUnpaid(p: Payment) {
    await paymentsApi.markUnpaid(p.id);
    load();
  }

  async function onArchiveStudent() {
    if (!student) return;
    const nextActive = !student.is_active;
    const mensaje = nextActive
      ? `Restaurar a ${student.full_name} como activo en la plantilla?`
      : `Archivar a ${student.full_name}?\n\nEl registro y sus datos se conservan; solo deja de aparecer en los listados activos.`;
    if (!confirm(mensaje)) return;
    await studentsApi.update(student.id, { is_active: nextActive });
    load();
  }

  if (loading || !student) {
    return <div className="text-slate-500 uppercase tracking-widest text-xs">Cargando</div>;
  }

  return (
    <div>
      <PageHeader
        eyebrow={`Plantilla / Ficha número ${student.id.toString().padStart(4, "0")}`}
        title={student.full_name}
        subtitle={[student.sport, student.category].filter(Boolean).join(" / ") || "Deportista del club"}
        actions={
          <>
            <Link to="/estudiantes" className="btn-ghost">
              Volver a la plantilla
            </Link>
            <Link to={`/estudiantes/${student.id}/editar`} className="btn-ghost">
              Editar datos
            </Link>
            <button className="btn-ghost" onClick={onArchiveStudent}>
              {student.is_active ? "Archivar" : "Restaurar"}
            </button>
          </>
        }
      />

      <section className="card p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6">
          <div className="flex flex-col items-center gap-3">
            <StudentPhoto url={student.photo_url} name={student.full_name} size="xl" />
            <span className={student.is_active ? "pill-active" : "pill-inactive"}>
              {student.is_active ? "Activo" : "Inactivo"}
            </span>
          </div>
          <div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6">
              <DetailItem label="Documento" value={student.document_id || "Sin registrar"} />
              <DetailItem
                label="Fecha de nacimiento"
                value={formatDateEs(student.birth_date)}
              />
              <DetailItem label="Ingreso al club" value={formatDateEs(student.join_date)} />
              <DetailItem label="Teléfono" value={student.phone || "Sin registrar"} />
              <DetailItem label="Dirección" value={student.address || "Sin registrar"} />
              <DetailItem
                label="Cuota mensual"
                value={formatCOP(student.monthly_fee)}
              />
              <DetailItem label="Acudiente" value={student.guardian_name || "Sin registrar"} />
              <DetailItem
                label="Teléfono acudiente"
                value={student.guardian_phone || "Sin registrar"}
              />
              <DetailItem label="Disciplina" value={student.sport || "Sin registrar"} />
              <DetailItem
                label="Categoría"
                value={student.category || "Sin registrar"}
              />
              {student.notes && (
                <div className="col-span-2 md:col-span-3">
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                    Notas
                  </div>
                  <div className="text-sm text-slate-700">{student.notes}</div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 mt-6 flex-wrap">
              <Link to={`/estudiantes/${student.id}/carnet`} className="btn-primary">
                Ver carnet oficial
              </Link>
              <Link to={`/estudiantes/${student.id}/factura`} className="btn-ghost">
                Emitir factura
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card p-4 border-l-4 border-slate-200">
          <div className="stat-label">Total cobrado</div>
          <div className="stat-num mt-1">{formatCOP(student.total_due)}</div>
        </div>
        <div className="card p-4 border-l-4 border-emerald-600">
          <div className="stat-label">Total pagado</div>
          <div className="stat-num mt-1 text-emerald-700">
            {formatCOP(student.total_paid)}
          </div>
        </div>
        <div className="card p-4 border-l-4 border-titanes-red">
          <div className="stat-label">Saldo pendiente</div>
          <div
            className={`stat-num mt-1 ${
              student.balance > 0 ? "text-titanes-crimson" : "text-slate-700"
            }`}
          >
            {formatCOP(student.balance)}
          </div>
          {student.pending_months > 0 && (
            <div className="text-[10px] uppercase tracking-widest text-titanes-crimson mt-1">
              {student.pending_months} mes pendiente
            </div>
          )}
        </div>
      </div>

      {attendanceStats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="card p-4 border-l-4 border-titanes-navy">
            <div className="stat-label">Índice asistencia</div>
            <div className="stat-num mt-1">
              {attendanceStats.attendance_rate.toFixed(1)}%
            </div>
            <div className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">
              {attendanceStats.total_sessions} sesiones
            </div>
          </div>
          <div className="card p-4">
            <div className="stat-label">Presentes</div>
            <div className="stat-num mt-1 text-emerald-700">
              {attendanceStats.present}
            </div>
          </div>
          <div className="card p-4">
            <div className="stat-label">Tarde</div>
            <div className="stat-num mt-1 text-amber-600">
              {attendanceStats.late}
            </div>
          </div>
          <div className="card p-4">
            <div className="stat-label">Excusas</div>
            <div className="stat-num mt-1 text-sky-700">
              {attendanceStats.excused}
            </div>
          </div>
          <div className="card p-4">
            <div className="stat-label">Ausencias</div>
            <div className="stat-num mt-1 text-rose-700">
              {attendanceStats.absent}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
        <h2 className="h-section">Historial de asistencia</h2>
        <Link to="/asistencia" className="btn-ghost">
          Tomar asistencia
        </Link>
      </div>
      <div className="card overflow-hidden mb-8">
        <table className="w-full text-sm">
          <thead className="bg-slate-900 text-white text-[10px] uppercase tracking-widest">
            <tr>
              <th className="text-left px-4 py-3">Fecha</th>
              <th className="text-left px-4 py-3">Estado</th>
              <th className="text-left px-4 py-3">Observaciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {attendance.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center py-8 text-slate-400">
                  Aún no hay registros de asistencia para este deportista.
                </td>
              </tr>
            ) : (
              attendance.slice(0, 20).map((a) => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">{formatDateEs(a.session_date)}</td>
                  <td className="px-4 py-3">
                    <AttendanceBadge status={a.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-600">{a.notes || "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
        <h2 className="h-section">Historial de pagos</h2>
        <button className="btn-ghost" onClick={onAddMonth}>
          Registrar mes actual
        </button>
      </div>

      {message && (
        <div className="mb-4 border-l-4 border-titanes-navy bg-slate-50 px-4 py-3 text-sm text-slate-700">
          {message}
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-900 text-white text-[10px] uppercase tracking-widest">
            <tr>
              <th className="text-left px-4 py-3">Periodo</th>
              <th className="text-right px-4 py-3">Cobrado</th>
              <th className="text-right px-4 py-3">Pagado</th>
              <th className="text-right px-4 py-3">Saldo</th>
              <th className="text-center px-4 py-3">Estado</th>
              <th className="text-left px-4 py-3">Pagado el</th>
              <th className="text-right px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {payments.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-8 text-slate-400">
                  Aún no hay pagos registrados para este deportista.
                </td>
              </tr>
            )}
            {payments.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  {MONTH_NAMES_ES[p.period_month - 1]} {p.period_year}
                </td>
                <td className="px-4 py-3 text-right font-mono">
                  {formatCOP(p.amount_due)}
                </td>
                <td className="px-4 py-3 text-right font-mono">
                  {formatCOP(p.amount_paid)}
                </td>
                <td className="px-4 py-3 text-right font-mono">
                  {formatCOP(Math.max(0, p.amount_due - p.amount_paid))}
                </td>
                <td className="px-4 py-3 text-center">
                  <PaymentBadge status={p.status} />
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {formatDateEs(p.paid_at)}
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  {p.status !== "paid" ? (
                    <button
                      className="btn-link text-emerald-700 hover:text-emerald-900 mr-4"
                      onClick={() => onMarkPaid(p)}
                    >
                      Marcar pagado
                    </button>
                  ) : (
                    <button
                      className="btn-link text-amber-700 hover:text-amber-900 mr-4"
                      onClick={() => onMarkUnpaid(p)}
                    >
                      Revertir
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
