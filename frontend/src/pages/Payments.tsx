import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { paymentsApi, studentsApi } from "../api";
import type { Payment, Student } from "../types";
import { currentPeriod, formatCOP, formatDateEs, MONTH_NAMES_ES } from "../utils";
import PaymentBadge from "../components/PaymentBadge";

export default function Payments() {
  const { year: nowYear, month: nowMonth } = currentPeriod();
  const [year, setYear] = useState<number>(nowYear);
  const [month, setMonth] = useState<number>(nowMonth);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<Record<number, Student>>({});
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [p, s] = await Promise.all([
        paymentsApi.list({ year, month, status_filter: statusFilter || undefined }),
        studentsApi.list(),
      ]);
      setPayments(p.data);
      const byId: Record<number, Student> = {};
      s.data.forEach((st) => {
        byId[st.id] = st;
      });
      setStudents(byId);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month, statusFilter]);

  async function onGenerate() {
    setGenerating(true);
    setMessage(null);
    try {
      const { data } = await paymentsApi.generateMonth(year, month);
      setMessage(
        data.length === 0
          ? `No se crearon cobros nuevos (ya existían para ${MONTH_NAMES_ES[month - 1]} ${year}).`
          : `Se generaron ${data.length} cobro(s) para ${MONTH_NAMES_ES[month - 1]} ${year}.`
      );
      load();
    } finally {
      setGenerating(false);
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

  const totals = useMemo(() => {
    const due = payments.reduce((a, p) => a + p.amount_due, 0);
    const paid = payments.reduce((a, p) => a + p.amount_paid, 0);
    return { due, paid, balance: due - paid };
  }, [payments]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-titanes-dark">Pagos</h1>
        <p className="text-slate-500 text-sm">Control mensual de cuotas del club</p>
      </div>

      <div className="card p-4 flex items-end gap-3 flex-wrap">
        <div>
          <label className="label">Año</label>
          <input
            type="number"
            className="input w-28"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="label">Mes</label>
          <select
            className="input w-40"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
          >
            {MONTH_NAMES_ES.map((name, idx) => (
              <option key={idx} value={idx + 1}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Estado</label>
          <select
            className="input w-40"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Todos</option>
            <option value="pending">Pendientes</option>
            <option value="overdue">Atrasados</option>
            <option value="partial">Parciales</option>
            <option value="paid">Pagados</option>
          </select>
        </div>
        <div className="ml-auto">
          <button className="btn-primary" onClick={onGenerate} disabled={generating}>
            {generating ? "Generando..." : `Generar cobros ${MONTH_NAMES_ES[month - 1]}`}
          </button>
        </div>
      </div>

      {message && (
        <div className="rounded-md bg-titanes-ice text-titanes-navy px-4 py-2 text-sm border border-titanes-navy/20">
          {message}
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <div className="card p-3">
          <div className="text-xs uppercase text-slate-500">Facturado</div>
          <div className="text-xl font-display">{formatCOP(totals.due)}</div>
        </div>
        <div className="card p-3">
          <div className="text-xs uppercase text-slate-500">Cobrado</div>
          <div className="text-xl font-display text-emerald-700">{formatCOP(totals.paid)}</div>
        </div>
        <div className="card p-3">
          <div className="text-xs uppercase text-slate-500">Pendiente</div>
          <div className="text-xl font-display text-rose-700">{formatCOP(totals.balance)}</div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-600">
            <tr>
              <th className="text-left px-4 py-3">Estudiante</th>
              <th className="text-left px-4 py-3">Categoría</th>
              <th className="text-right px-4 py-3">Cobrado</th>
              <th className="text-right px-4 py-3">Pagado</th>
              <th className="text-right px-4 py-3">Saldo</th>
              <th className="text-center px-4 py-3">Estado</th>
              <th className="text-left px-4 py-3">Pagado el</th>
              <th />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr>
                <td colSpan={8} className="text-center py-8 text-slate-400">
                  Cargando...
                </td>
              </tr>
            )}
            {!loading && payments.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-8 text-slate-400">
                  Sin pagos en este periodo. Genera los cobros del mes.
                </td>
              </tr>
            )}
            {payments.map((p) => {
              const s = students[p.student_id];
              return (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    {s ? (
                      <Link to={`/estudiantes/${s.id}`} className="font-medium text-titanes-navy hover:underline">
                        {s.full_name}
                      </Link>
                    ) : (
                      `#${p.student_id}`
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {s ? [s.sport, s.category].filter(Boolean).join(" · ") : "—"}
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
                      <button className="text-emerald-700 font-semibold hover:underline" onClick={() => onMarkPaid(p)}>
                        Marcar pagado
                      </button>
                    ) : (
                      <button className="text-amber-700 font-semibold hover:underline" onClick={() => onMarkUnpaid(p)}>
                        Revertir
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
