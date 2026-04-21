import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { studentsApi } from "../../api";
import type { AccountStatement } from "../../types";
import { formatCOP, formatDateEs, MONTH_NAMES_ES, whatsappLink } from "../../utils";
import PageHeader from "../../components/PageHeader";
import { downloadStatement } from "../../statement";

function statusLabel(status: string): string {
  switch (status) {
    case "paid":
      return "Pagado";
    case "partial":
      return "Parcial";
    case "overdue":
      return "En mora";
    default:
      return "Pendiente";
  }
}

function statusClass(status: string): string {
  switch (status) {
    case "paid":
      return "text-emerald-700 bg-emerald-50 border-emerald-200";
    case "partial":
      return "text-amber-700 bg-amber-50 border-amber-200";
    case "overdue":
      return "text-rose-700 bg-rose-50 border-rose-200";
    default:
      return "text-slate-700 bg-slate-50 border-slate-200";
  }
}

export default function StudentStatement() {
  const { id } = useParams<{ id: string }>();
  const studentId = Number(id);
  const [data, setData] = useState<AccountStatement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    studentsApi
      .statement(studentId)
      .then((r) => {
        if (!cancelled) setData(r.data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [studentId]);

  async function onDownload() {
    if (!data) return;
    await downloadStatement(data);
  }

  function onWhatsApp() {
    if (!data) return;
    const pending = data.lines.filter((l) => l.status !== "paid");
    const body =
      data.balance > 0
        ? `Saludo cordial ${data.guardian_name || data.student_name}. Le compartimos el estado de cuenta de ${data.student_name} en el Club Titanes.\n\nSaldo pendiente: ${formatCOP(
            data.balance,
          )} (${data.pending_months} ${data.pending_months === 1 ? "mes" : "meses"} pendientes).\n\n${pending
            .slice(0, 6)
            .map(
              (l) =>
                `- ${MONTH_NAMES_ES[l.period_month - 1]} ${l.period_year}: ${formatCOP(l.balance)}`,
            )
            .join("\n")}`
        : `Saludo cordial ${data.guardian_name || data.student_name}. La cuenta de ${data.student_name} en el Club Titanes se encuentra al día. Gracias por su puntualidad.`;
    const link = whatsappLink(data.guardian_phone, body);
    if (!link) {
      alert("Este deportista no tiene teléfono del acudiente registrado.");
      return;
    }
    window.open(link, "_blank");
  }

  if (loading || !data) {
    return (
      <div className="text-slate-500 uppercase tracking-widest text-xs">
        Cargando
      </div>
    );
  }

  const pending = data.lines.filter((l) => l.status !== "paid");
  const paid = data.lines.filter((l) => l.status === "paid");

  return (
    <div>
      <PageHeader
        eyebrow="Estado de cuenta"
        title={data.student_name}
        subtitle="Resumen consolidado de todos los periodos facturados."
        actions={
          <>
            <Link to={`/estudiantes/${data.student_id}`} className="btn-ghost">
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

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <div className="card p-4">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            Total facturado
          </div>
          <div className="display text-2xl text-slate-900 mt-2">
            {formatCOP(data.total_due)}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            Total pagado
          </div>
          <div className="display text-2xl text-emerald-700 mt-2">
            {formatCOP(data.total_paid)}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            Saldo pendiente
          </div>
          <div className="display text-2xl text-rose-700 mt-2">
            {formatCOP(data.balance)}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            Meses pendientes
          </div>
          <div className="display text-2xl text-slate-900 mt-2">
            {data.pending_months}
          </div>
          {data.overdue_months > 0 && (
            <div className="text-xs text-rose-700 mt-1">
              {data.overdue_months} en mora
            </div>
          )}
        </div>
      </div>

      <div className="card p-4 mb-6 grid gap-3 md:grid-cols-2">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            Acudiente
          </div>
          <div className="text-sm text-slate-900 font-semibold mt-1">
            {data.guardian_name || "Sin registrar"}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {data.guardian_phone || "Sin teléfono"}
          </div>
        </div>
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            Cuota mensual
          </div>
          <div className="text-sm text-slate-900 font-semibold mt-1">
            {formatCOP(data.monthly_fee)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {[data.sport, data.category].filter(Boolean).join(" / ") || "—"}
          </div>
        </div>
      </div>

      {pending.length > 0 && (
        <div className="card mb-6 overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-widest text-slate-700">
            Periodos pendientes ({pending.length})
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white">
                <tr className="text-[10px] uppercase tracking-widest text-slate-500">
                  <th className="text-left px-4 py-3">Periodo</th>
                  <th className="text-left px-4 py-3">Vence</th>
                  <th className="text-right px-4 py-3">Valor</th>
                  <th className="text-right px-4 py-3">Pagado</th>
                  <th className="text-right px-4 py-3">Saldo</th>
                  <th className="text-left px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody>
                {pending.map((l) => (
                  <tr key={l.payment_id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {MONTH_NAMES_ES[l.period_month - 1]} {l.period_year}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatDateEs(l.due_date)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatCOP(l.amount_due)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatCOP(l.amount_paid)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-rose-700">
                      {formatCOP(l.balance)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block text-[10px] font-semibold uppercase tracking-widest px-2 py-1 border rounded ${statusClass(
                          l.status,
                        )}`}
                      >
                        {statusLabel(l.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-widest text-slate-700">
          Historial pagado ({paid.length})
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white">
              <tr className="text-[10px] uppercase tracking-widest text-slate-500">
                <th className="text-left px-4 py-3">Periodo</th>
                <th className="text-left px-4 py-3">Pagado el</th>
                <th className="text-right px-4 py-3">Valor</th>
                <th className="text-right px-4 py-3">Pagado</th>
              </tr>
            </thead>
            <tbody>
              {paid.map((l) => (
                <tr key={l.payment_id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    {MONTH_NAMES_ES[l.period_month - 1]} {l.period_year}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {l.paid_at ? formatDateEs(l.paid_at) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {formatCOP(l.amount_due)}
                  </td>
                  <td className="px-4 py-3 text-right text-emerald-700 font-semibold">
                    {formatCOP(l.amount_paid)}
                  </td>
                </tr>
              ))}
              {paid.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-6 text-center text-slate-500 text-sm"
                  >
                    Aún no hay pagos registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
