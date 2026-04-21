import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { paymentsApi, studentsApi } from "../../api";
import type { Payment, Student } from "../../types";
import { CATEGORIES, currentPeriod, formatCOP, formatDateEs, MONTH_NAMES_ES, SPORTS } from "../../utils";
import PageHeader from "../../components/PageHeader";
import PaymentBadge from "../../components/PaymentBadge";
import { downloadInvoice } from "../../invoice";

export default function PaymentsList() {
  const { year: nowYear, month: nowMonth } = currentPeriod();
  const [year, setYear] = useState<number>(nowYear);
  const [month, setMonth] = useState<number>(nowMonth);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [sport, setSport] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<Record<number, Student>>({});
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [p, s] = await Promise.all([
        paymentsApi.list({
          year,
          month,
          status_filter: statusFilter || undefined,
          sport: sport || undefined,
          category: category || undefined,
        }),
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month, statusFilter, sport, category]);

  async function onGenerate() {
    setGenerating(true);
    setMessage(null);
    try {
      const { data } = await paymentsApi.generateMonth(year, month);
      setMessage(
        data.length === 0
          ? `No se crearon cobros nuevos. Ya existían registros para ${MONTH_NAMES_ES[month - 1]} de ${year}.`
          : `Se generaron ${data.length} cobros para ${MONTH_NAMES_ES[month - 1]} de ${year}.`
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

  async function onDownloadPdf(p: Payment) {
    const s = students[p.student_id];
    if (!s) return;
    await downloadInvoice(s, [p]);
  }

  const totals = useMemo(() => {
    const due = payments.reduce((a, p) => a + p.amount_due, 0);
    const paid = payments.reduce((a, p) => a + p.amount_paid, 0);
    return { due, paid, balance: due - paid };
  }, [payments]);

  return (
    <div>
      <PageHeader
        eyebrow="Administración"
        title="Control de pagos"
        subtitle="Cobros mensuales del club. Genera, consulta y actualiza los pagos de todos los deportistas en un solo lugar."
        actions={
          <button className="btn-primary" onClick={onGenerate} disabled={generating}>
            {generating
              ? "Generando"
              : `Generar cobros ${MONTH_NAMES_ES[month - 1]}`}
          </button>
        }
      />

      <div className="card p-4 flex items-end gap-4 flex-wrap mb-6">
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
            className="input w-48"
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
          <label className="label">Deporte</label>
          <select
            className="input w-44"
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
        <div>
          <label className="label">Categoría</label>
          <select
            className="input w-44"
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
        <div>
          <label className="label">Estado</label>
          <select
            className="input w-44"
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
      </div>

      {message && (
        <div className="mb-6 border-l-4 border-titanes-navy bg-slate-50 px-4 py-3 text-sm text-slate-700">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card p-4 border-l-4 border-slate-200">
          <div className="stat-label">Facturado</div>
          <div className="stat-num mt-1">{formatCOP(totals.due)}</div>
        </div>
        <div className="card p-4 border-l-4 border-emerald-600">
          <div className="stat-label">Cobrado</div>
          <div className="stat-num mt-1 text-emerald-700">
            {formatCOP(totals.paid)}
          </div>
        </div>
        <div className="card p-4 border-l-4 border-titanes-red">
          <div className="stat-label">Pendiente</div>
          <div className="stat-num mt-1 text-titanes-crimson">
            {formatCOP(Math.max(0, totals.balance))}
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-900 text-white text-[10px] uppercase tracking-widest">
            <tr>
              <th className="text-left px-4 py-3">Deportista</th>
              <th className="text-left px-4 py-3">Disciplina</th>
              <th className="text-right px-4 py-3">Cobrado</th>
              <th className="text-right px-4 py-3">Pagado</th>
              <th className="text-right px-4 py-3">Saldo</th>
              <th className="text-center px-4 py-3">Estado</th>
              <th className="text-left px-4 py-3">Pagado el</th>
              <th className="text-right px-4 py-3">Acciones</th>
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
            {!loading && payments.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-10 text-slate-400">
                  Sin pagos en este periodo. Genera los cobros del mes para continuar.
                </td>
              </tr>
            )}
            {payments.map((p) => {
              const s = students[p.student_id];
              return (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    {s ? (
                      <Link
                        to={`/estudiantes/${s.id}`}
                        className="font-semibold text-slate-900 hover:text-titanes-navy"
                      >
                        {s.full_name}
                      </Link>
                    ) : (
                      `Estudiante ${p.student_id}`
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {s ? (
                      <>
                        <div>{s.sport || ""}</div>
                        <div className="text-xs text-slate-500">{s.category || ""}</div>
                      </>
                    ) : (
                      "-"
                    )}
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
                    <div className="flex flex-col items-end gap-1">
                      {s && (
                        <Link
                          to={`/estudiantes/${s.id}/factura?year=${p.period_year}&month=${p.period_month}`}
                          className="btn-link text-titanes-navy hover:text-slate-900"
                        >
                          Ver factura
                        </Link>
                      )}
                      {s && (
                        <button
                          className="btn-link text-slate-600 hover:text-slate-900"
                          onClick={() => onDownloadPdf(p)}
                        >
                          Descargar PDF
                        </button>
                      )}
                      {p.status !== "paid" ? (
                        <button
                          className="btn-link text-emerald-700 hover:text-emerald-900"
                          onClick={() => onMarkPaid(p)}
                        >
                          Marcar pagado
                        </button>
                      ) : (
                        <button
                          className="btn-link text-amber-700 hover:text-amber-900"
                          onClick={() => onMarkUnpaid(p)}
                        >
                          Revertir
                        </button>
                      )}
                    </div>
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
