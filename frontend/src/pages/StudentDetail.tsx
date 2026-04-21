import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { paymentsApi, studentsApi } from "../api";
import type { Payment, Student } from "../types";
import { currentPeriod, formatCOP, formatDateEs, MONTH_NAMES_ES, whatsappLink } from "../utils";
import PaymentBadge from "../components/PaymentBadge";
import Carnet from "../components/Carnet";
import StudentForm from "../components/StudentForm";
import { downloadInvoice } from "../invoice";

export default function StudentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const studentId = Number(id);
  const [student, setStudent] = useState<Student | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [showCarnet, setShowCarnet] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, p] = await Promise.all([
        studentsApi.get(studentId),
        paymentsApi.list({ student_id: studentId }),
      ]);
      setStudent(s.data);
      setPayments(p.data);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
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

  async function onDeletePayment(p: Payment) {
    if (!confirm(`Eliminar el pago de ${MONTH_NAMES_ES[p.period_month - 1]} ${p.period_year}?`)) return;
    await paymentsApi.remove(p.id);
    load();
  }

  async function onInvoice() {
    if (!student) return;
    const pending = payments.filter((p) => p.status !== "paid");
    const target = pending.length > 0 ? pending : payments;
    await downloadInvoice(student, target);
  }

  async function onInvoiceAll() {
    if (!student) return;
    await downloadInvoice(student, payments);
  }

  async function onWhatsApp() {
    if (!student) return;
    const phone = student.guardian_phone || student.phone;
    const pending = payments.filter((p) => p.status !== "paid");
    const totalDebt = pending.reduce((a, p) => a + (p.amount_due - p.amount_paid), 0);
    const pendingDesc = pending
      .map((p) => `• ${MONTH_NAMES_ES[p.period_month - 1]} ${p.period_year}: ${formatCOP(p.amount_due - p.amount_paid)}`)
      .join("\n");
    const message = totalDebt > 0
      ? `Hola ${student.guardian_name || student.full_name}, le escribimos del *Club Titanes Soatá*.\n\nEstado de cuenta de ${student.full_name}:\n${pendingDesc}\n\nTotal pendiente: ${formatCOP(totalDebt)}\n\nAdjuntamos la factura en PDF.`
      : `Hola ${student.guardian_name || student.full_name}, su cuenta en *Club Titanes Soatá* está al día. ¡Gracias por su puntualidad!`;
    const link = whatsappLink(phone, message);
    if (!link) {
      alert("Este estudiante no tiene teléfono registrado.");
      return;
    }
    // Download invoice first so admin can attach it
    if (totalDebt > 0) {
      await onInvoice();
    }
    window.open(link, "_blank");
  }

  async function onDeleteStudent() {
    if (!student) return;
    if (!confirm(`Eliminar a ${student.full_name}? Se borrarán también sus pagos.`)) return;
    await studentsApi.remove(student.id);
    navigate("/estudiantes");
  }

  if (loading || !student) {
    return <div className="text-slate-500">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link to="/estudiantes" className="hover:text-titanes-navy">
          ← Estudiantes
        </Link>
      </div>

      <div className="card p-6 grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-6 items-start">
        <div className="h-28 w-28 rounded-full bg-slate-100 overflow-hidden border-2 border-titanes-navy/30 flex items-center justify-center">
          {student.photo_url ? (
            <img src={student.photo_url} className="h-full w-full object-cover" alt="" />
          ) : (
            <span className="text-slate-400 text-xs">Sin foto</span>
          )}
        </div>
        <div>
          <h1 className="font-display text-3xl text-titanes-dark">{student.full_name}</h1>
          <div className="text-slate-600 mt-1">
            {[student.sport, student.category].filter(Boolean).join(" · ") || "Deportista"}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 mt-4 text-sm">
            <div>
              <span className="text-slate-500">Documento:</span> {student.document_id || "—"}
            </div>
            <div>
              <span className="text-slate-500">Teléfono:</span> {student.phone || "—"}
            </div>
            <div>
              <span className="text-slate-500">Nacimiento:</span> {formatDateEs(student.birth_date)}
            </div>
            <div>
              <span className="text-slate-500">Ingreso:</span> {formatDateEs(student.join_date)}
            </div>
            <div>
              <span className="text-slate-500">Acudiente:</span> {student.guardian_name || "—"}
            </div>
            <div>
              <span className="text-slate-500">Tel. acudiente:</span> {student.guardian_phone || "—"}
            </div>
            <div className="md:col-span-2">
              <span className="text-slate-500">Dirección:</span> {student.address || "—"}
            </div>
            <div className="md:col-span-2">
              <span className="text-slate-500">Cuota mensual:</span>{" "}
              <span className="font-semibold">{formatCOP(student.monthly_fee)}</span>
            </div>
            {student.notes && (
              <div className="md:col-span-2">
                <span className="text-slate-500">Notas:</span> {student.notes}
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <button className="btn-primary" onClick={() => setEditOpen(true)}>
            Editar
          </button>
          <button className="btn-ghost" onClick={() => setShowCarnet((v) => !v)}>
            {showCarnet ? "Ocultar carnet" : "Ver carnet"}
          </button>
          <button className="btn-danger" onClick={onDeleteStudent}>
            Eliminar
          </button>
        </div>
      </div>

      {showCarnet && (
        <div className="card p-6 flex justify-center">
          <Carnet student={student} />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="text-xs uppercase text-slate-500">Total cobrado</div>
          <div className="text-2xl font-display text-titanes-dark">{formatCOP(student.total_due)}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs uppercase text-slate-500">Total pagado</div>
          <div className="text-2xl font-display text-emerald-700">{formatCOP(student.total_paid)}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs uppercase text-slate-500">Saldo pendiente</div>
          <div className={`text-2xl font-display ${student.balance > 0 ? "text-titanes-crimson" : "text-slate-700"}`}>
            {formatCOP(student.balance)}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="font-display text-xl text-titanes-dark">Historial de pagos</h2>
        <div className="flex gap-2 flex-wrap">
          <button className="btn-ghost" onClick={onAddMonth}>
            + Cobro mes actual
          </button>
          <button className="btn-ghost" onClick={onInvoice}>
            Factura (pendientes)
          </button>
          <button className="btn-ghost" onClick={onInvoiceAll}>
            Factura completa
          </button>
          <button className="btn-success" onClick={onWhatsApp}>
            Enviar por WhatsApp
          </button>
        </div>
      </div>

      {message && (
        <div className="rounded-md bg-titanes-ice text-titanes-navy px-4 py-2 text-sm border border-titanes-navy/20">
          {message}
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-600">
            <tr>
              <th className="text-left px-4 py-3">Periodo</th>
              <th className="text-right px-4 py-3">Cobrado</th>
              <th className="text-right px-4 py-3">Pagado</th>
              <th className="text-right px-4 py-3">Saldo</th>
              <th className="text-center px-4 py-3">Estado</th>
              <th className="text-left px-4 py-3">Pagado el</th>
              <th />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {payments.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-8 text-slate-400">
                  Sin pagos registrados aún.
                </td>
              </tr>
            )}
            {payments.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  {MONTH_NAMES_ES[p.period_month - 1]} {p.period_year}
                </td>
                <td className="px-4 py-3 text-right">{formatCOP(p.amount_due)}</td>
                <td className="px-4 py-3 text-right">{formatCOP(p.amount_paid)}</td>
                <td className="px-4 py-3 text-right">
                  {formatCOP(Math.max(0, p.amount_due - p.amount_paid))}
                </td>
                <td className="px-4 py-3 text-center">
                  <PaymentBadge status={p.status} />
                </td>
                <td className="px-4 py-3 text-slate-500">{formatDateEs(p.paid_at)}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  {p.status !== "paid" ? (
                    <button className="text-emerald-700 font-semibold hover:underline mr-3" onClick={() => onMarkPaid(p)}>
                      Marcar pagado
                    </button>
                  ) : (
                    <button className="text-amber-700 font-semibold hover:underline mr-3" onClick={() => onMarkUnpaid(p)}>
                      Revertir
                    </button>
                  )}
                  <button className="text-rose-600 hover:underline" onClick={() => onDeletePayment(p)}>
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editOpen && (
        <StudentForm
          student={student}
          onClose={() => setEditOpen(false)}
          onSaved={() => {
            setEditOpen(false);
            load();
          }}
        />
      )}
    </div>
  );
}
