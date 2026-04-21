import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { paymentsApi, studentsApi } from "../../api";
import type { Payment, Student } from "../../types";
import { formatCOP, formatDateEs, MONTH_NAMES_ES, whatsappLink } from "../../utils";
import PageHeader from "../../components/PageHeader";
import PaymentBadge from "../../components/PaymentBadge";
import { downloadInvoice } from "../../invoice";

type Scope = "period" | "pending" | "all";

export default function StudentInvoice() {
  const { id } = useParams<{ id: string }>();
  const studentId = Number(id);
  const [params] = useSearchParams();
  const qYear = params.get("year");
  const qMonth = params.get("month");
  const periodYear = qYear ? Number(qYear) : null;
  const periodMonth = qMonth ? Number(qMonth) : null;
  const hasPeriod = periodYear !== null && periodMonth !== null;
  const [student, setStudent] = useState<Student | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState<Scope>(hasPeriod ? "period" : "pending");

  async function load() {
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
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  const filtered = useMemo(() => {
    if (scope === "period" && hasPeriod) {
      return payments.filter(
        (p) => p.period_year === periodYear && p.period_month === periodMonth
      );
    }
    if (scope === "pending") {
      const pend = payments.filter((p) => p.status !== "paid");
      return pend.length > 0 ? pend : payments;
    }
    return payments;
  }, [payments, scope, hasPeriod, periodYear, periodMonth]);

  const totals = useMemo(() => {
    const due = filtered.reduce((a, p) => a + p.amount_due, 0);
    const paid = filtered.reduce((a, p) => a + p.amount_paid, 0);
    return { due, paid, balance: Math.max(0, due - paid) };
  }, [filtered]);

  async function onDownload() {
    if (!student) return;
    await downloadInvoice(student, filtered);
  }

  async function onWhatsApp() {
    if (!student) return;
    const phone = student.guardian_phone || student.phone;
    const pendingDesc = filtered
      .filter((p) => p.status !== "paid")
      .map(
        (p) =>
          `- ${MONTH_NAMES_ES[p.period_month - 1]} ${p.period_year}: ${formatCOP(
            p.amount_due - p.amount_paid
          )}`
      )
      .join("\n");
    const message =
      totals.balance > 0
        ? `Saludo cordial ${student.guardian_name || student.full_name}. Le escribimos del Club Titanes Soata.\n\nEstado de cuenta de ${student.full_name}:\n${pendingDesc}\n\nSaldo pendiente: ${formatCOP(totals.balance)}\n\nAdjuntamos la factura en PDF.`
        : `Saludo cordial ${student.guardian_name || student.full_name}. La cuenta de ${student.full_name} en el Club Titanes Soata se encuentra al dia. Gracias por su puntualidad.`;
    const link = whatsappLink(phone, message);
    if (!link) {
      alert("Este estudiante no tiene teléfono registrado.");
      return;
    }
    if (totals.balance > 0) {
      await onDownload();
    }
    window.open(link, "_blank");
  }

  const [invoiceSeq] = useState(() => Date.now().toString().slice(-6));
  const invoiceNumber = student
    ? `TIT-${student.id.toString().padStart(4, "0")}-${invoiceSeq}`
    : "";

  if (loading || !student) {
    return <div className="text-slate-500 uppercase tracking-widest text-xs">Cargando</div>;
  }

  return (
    <div>
      <PageHeader
        eyebrow="Emisión de factura"
        title={`Factura ${student.full_name}`}
        subtitle="Genera el comprobante oficial con el saldo del deportista y envíalo por WhatsApp al acudiente."
        actions={
          <>
            <Link to={`/estudiantes/${student.id}`} className="btn-ghost">
              Volver a la ficha
            </Link>
            <button className="btn-ghost" onClick={onDownload}>
              Descargar PDF
            </button>
            <button className="btn-success" onClick={onWhatsApp}>
              Enviar por WhatsApp
            </button>
          </>
        }
      />

      <div className="card p-4 mb-6 flex items-center gap-4 flex-wrap">
        <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
          Alcance
        </div>
        {hasPeriod && (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              className="accent-titanes-navy"
              checked={scope === "period"}
              onChange={() => setScope("period")}
            />
            {`${MONTH_NAMES_ES[(periodMonth as number) - 1]} ${periodYear}`}
          </label>
        )}
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            className="accent-titanes-navy"
            checked={scope === "pending"}
            onChange={() => setScope("pending")}
          />
          Solo pendientes
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            className="accent-titanes-navy"
            checked={scope === "all"}
            onChange={() => setScope("all")}
          />
          Todo el historial
        </label>
      </div>

      <section className="card p-8">
        <div className="flex items-start justify-between flex-wrap gap-4 border-b border-slate-200 pb-6">
          <div className="flex items-start gap-4">
            <img src="/logo.png" alt="" className="h-16 w-16 object-contain" />
            <div>
              <div className="display text-xl">CLUB TITANES</div>
              <div className="text-xs text-slate-500 uppercase tracking-widest">
                Soatá Boyacá
              </div>
            </div>
          </div>
          <div className="text-right text-sm">
            <div className="text-[11px] uppercase tracking-widest text-slate-500">
              Factura
            </div>
            <div className="font-mono font-semibold text-slate-900">{invoiceNumber}</div>
            <div className="mt-1 text-[11px] uppercase tracking-widest text-slate-500">
              Emitida
            </div>
            <div className="font-mono">{formatDateEs(new Date().toISOString())}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div>
            <div className="text-[11px] uppercase tracking-widest text-slate-500">
              Facturado a
            </div>
            <div className="font-semibold text-slate-900 text-lg">
              {student.guardian_name || "Sin acudiente registrado"}
            </div>
            <div className="text-sm text-slate-600">
              {student.guardian_phone ? `Tel. ${student.guardian_phone}` : "Sin teléfono"}
            </div>
            <div className="text-sm text-slate-600">
              {student.address || ""}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] uppercase tracking-widest text-slate-500">
              Deportista
            </div>
            <div className="font-semibold text-slate-900 text-lg">{student.full_name}</div>
            <div className="text-sm text-slate-600">
              {student.document_id ? `Documento ${student.document_id}` : "Sin documento"}
            </div>
            <div className="text-sm text-slate-600">
              {[student.sport, student.category].filter(Boolean).join(" / ") || "Deportista"}
            </div>
            {student.phone ? (
              <div className="text-sm text-slate-600">Tel. {student.phone}</div>
            ) : null}
          </div>
        </div>

        <table className="w-full text-sm mt-8">
          <thead className="bg-slate-900 text-white text-[10px] uppercase tracking-widest">
            <tr>
              <th className="text-left px-3 py-2">Periodo</th>
              <th className="text-left px-3 py-2">Concepto</th>
              <th className="text-right px-3 py-2">Valor</th>
              <th className="text-right px-3 py-2">Pagado</th>
              <th className="text-right px-3 py-2">Saldo</th>
              <th className="text-center px-3 py-2">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-6 text-slate-400">
                  Sin pagos en el alcance seleccionado.
                </td>
              </tr>
            )}
            {filtered.map((p) => (
              <tr key={p.id}>
                <td className="px-3 py-2">
                  {MONTH_NAMES_ES[p.period_month - 1]} {p.period_year}
                </td>
                <td className="px-3 py-2">Mensualidad del club</td>
                <td className="px-3 py-2 text-right font-mono">{formatCOP(p.amount_due)}</td>
                <td className="px-3 py-2 text-right font-mono">{formatCOP(p.amount_paid)}</td>
                <td className="px-3 py-2 text-right font-mono">
                  {formatCOP(Math.max(0, p.amount_due - p.amount_paid))}
                </td>
                <td className="px-3 py-2 text-center">
                  <PaymentBadge status={p.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-8 flex justify-end">
          <div className="w-full md:w-80 space-y-2">
            <div className="flex justify-between text-sm text-slate-600">
              <span>Total facturado</span>
              <span className="font-mono">{formatCOP(totals.due)}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-600">
              <span>Total pagado</span>
              <span className="font-mono text-emerald-700">{formatCOP(totals.paid)}</span>
            </div>
            <div className="border-t border-slate-300 pt-2 flex justify-between">
              <span className="display text-base">Saldo pendiente</span>
              <span className="font-mono display text-lg text-titanes-crimson">
                {formatCOP(totals.balance)}
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
