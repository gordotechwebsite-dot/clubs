import { useEffect, useMemo, useState } from "react";
import { reportsApi } from "../../api";
import type { MonthlyReport } from "../../types";
import { currentPeriod, formatCOP, MONTH_NAMES_ES } from "../../utils";
import PageHeader from "../../components/PageHeader";
import { downloadMonthlyReport } from "../../monthlyReport";

function yearsAround(current: number): number[] {
  return [current - 2, current - 1, current, current + 1];
}

export default function MonthlyFinancial() {
  const { year: curY, month: curM } = currentPeriod();
  const [year, setYear] = useState<number>(curY);
  const [month, setMonth] = useState<number>(curM);
  const [data, setData] = useState<MonthlyReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);
    reportsApi
      .monthly(year, month)
      .then((r) => {
        if (!cancelled) setData(r.data);
      })
      .catch(() => {
        if (!cancelled) setError("No se pudo cargar el reporte.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [year, month]);

  async function onDownload() {
    if (!data) return;
    await downloadMonthlyReport(data);
  }

  const years = useMemo(() => yearsAround(curY), [curY]);

  const maxValue = useMemo(() => {
    if (!data) return 1;
    return Math.max(
      1,
      ...data.by_sport.map((b) => Math.max(b.amount_due, b.amount_paid)),
    );
  }, [data]);

  return (
    <div>
      <PageHeader
        eyebrow="Reporte financiero"
        title={`${MONTH_NAMES_ES[month - 1]} ${year}`}
        subtitle="Resumen de recaudo, mora y desglose por disciplina. Exportable para la dirección."
        actions={
          <button className="btn-primary" onClick={onDownload} disabled={!data}>
            Descargar PDF
          </button>
        }
      />

      <div className="card p-4 mb-6 flex flex-wrap items-end gap-4">
        <label className="text-sm">
          <span className="block text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-1">
            Año
          </span>
          <select
            className="input"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="block text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-1">
            Mes
          </span>
          <select
            className="input"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
          >
            {MONTH_NAMES_ES.map((m, idx) => (
              <option key={m} value={idx + 1}>
                {m}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && (
        <div className="card p-4 mb-6 text-sm text-rose-700">{error}</div>
      )}

      {loading && (
        <div className="text-slate-500 uppercase tracking-widest text-xs mb-6">
          Cargando
        </div>
      )}

      {data && (
        <>
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
                Recaudado
              </div>
              <div className="display text-2xl text-emerald-700 mt-2">
                {formatCOP(data.total_collected)}
              </div>
            </div>
            <div className="card p-4">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                Pendiente
              </div>
              <div className="display text-2xl text-amber-700 mt-2">
                {formatCOP(data.total_pending)}
              </div>
            </div>
            <div className="card p-4">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                Mora
              </div>
              <div className="display text-2xl text-rose-700 mt-2">
                {formatCOP(data.total_overdue)}
              </div>
            </div>
          </div>

          <div className="card p-4 mb-6">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-700 mb-4">
              Recaudo por disciplina
            </div>
            {data.by_sport.length === 0 ? (
              <div className="text-sm text-slate-500">
                Sin datos para el periodo.
              </div>
            ) : (
              <div className="space-y-4">
                {data.by_sport.map((b) => {
                  const percPaid = Math.min(
                    100,
                    Math.round((b.amount_paid / maxValue) * 100),
                  );
                  const percDue = Math.min(
                    100,
                    Math.round((b.amount_due / maxValue) * 100),
                  );
                  return (
                    <div key={b.sport}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <div className="font-semibold text-slate-900">
                          {b.sport}
                          <span className="ml-2 text-xs text-slate-500">
                            {b.active_students} activos
                          </span>
                        </div>
                        <div className="text-xs text-slate-500">
                          {formatCOP(b.amount_paid)} /{" "}
                          {formatCOP(b.amount_due)}
                        </div>
                      </div>
                      <div className="h-3 bg-slate-100 rounded relative overflow-hidden">
                        <div
                          className="absolute inset-y-0 left-0 bg-titanes-navy/70"
                          style={{ width: `${percDue}%` }}
                        />
                        <div
                          className="absolute inset-y-0 left-0 bg-emerald-600"
                          style={{ width: `${percPaid}%` }}
                        />
                      </div>
                      {b.overdue_balance > 0 && (
                        <div className="text-xs text-rose-700 mt-1">
                          Mora: {formatCOP(b.overdue_balance)}
                        </div>
                      )}
                    </div>
                  );
                })}
                <div className="flex gap-4 pt-2 text-[10px] uppercase tracking-widest text-slate-500">
                  <span className="flex items-center gap-2">
                    <span className="inline-block h-2 w-4 bg-titanes-navy/70" />
                    Facturado
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="inline-block h-2 w-4 bg-emerald-600" />
                    Recaudado
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="card overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-widest text-slate-700">
              Desglose por disciplina
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-white">
                  <tr className="text-[10px] uppercase tracking-widest text-slate-500">
                    <th className="text-left px-4 py-3">Disciplina</th>
                    <th className="text-right px-4 py-3">Activos</th>
                    <th className="text-right px-4 py-3">Facturado</th>
                    <th className="text-right px-4 py-3">Pagado</th>
                    <th className="text-right px-4 py-3">Saldo</th>
                    <th className="text-right px-4 py-3">Mora</th>
                  </tr>
                </thead>
                <tbody>
                  {data.by_sport.map((b) => (
                    <tr key={b.sport} className="border-t border-slate-100">
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {b.sport}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {b.active_students}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {formatCOP(b.amount_due)}
                      </td>
                      <td className="px-4 py-3 text-right text-emerald-700">
                        {formatCOP(b.amount_paid)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {formatCOP(b.balance)}
                      </td>
                      <td className="px-4 py-3 text-right text-rose-700">
                        {formatCOP(b.overdue_balance)}
                      </td>
                    </tr>
                  ))}
                  {data.by_sport.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-6 text-center text-slate-500 text-sm"
                      >
                        Sin datos.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
