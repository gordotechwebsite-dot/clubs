import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { dashboardApi, paymentsApi } from "../api";
import type { DashboardStats } from "../types";
import { currentPeriod, formatCOP, MONTH_NAMES_ES } from "../utils";
import PageHeader from "../components/PageHeader";

function StatCard({
  label,
  value,
  accent,
  hint,
}: {
  label: string;
  value: string | number;
  accent?: "default" | "navy" | "red" | "emerald" | "amber";
  hint?: string;
}) {
  const map: Record<string, string> = {
    default: "border-slate-200",
    navy: "border-titanes-navy",
    red: "border-titanes-red",
    emerald: "border-emerald-600",
    amber: "border-amber-500",
  };
  const border = map[accent || "default"];
  return (
    <div className={`card p-5 border-l-4 ${border}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-num mt-2">{value}</div>
      {hint && (
        <div className="text-xs text-slate-500 mt-1 uppercase tracking-wide">{hint}</div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const { year, month } = currentPeriod();

  async function load() {
    setLoading(true);
    try {
      const { data } = await dashboardApi.stats();
      setStats(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  async function onGenerate() {
    setGenerating(true);
    setMessage(null);
    try {
      const { data } = await paymentsApi.generateMonth(year, month);
      setMessage(
        data.length === 0
          ? `No se crearon cobros nuevos para ${MONTH_NAMES_ES[month - 1]} de ${year}. Ya existían.`
          : `Se generaron ${data.length} cobros para ${MONTH_NAMES_ES[month - 1]} de ${year}.`
      );
      load();
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Oficina del Club"
        title="Panel administrativo"
        subtitle={`Resumen operativo de ${MONTH_NAMES_ES[month - 1]} de ${year}.`}
        actions={
          <>
            <Link to="/estudiantes/nuevo" className="btn-primary">
              Inscribir estudiante
            </Link>
            <button className="btn-ghost" onClick={onGenerate} disabled={generating}>
              {generating ? "Generando" : `Generar cobros del mes`}
            </button>
          </>
        }
      />

      {message && (
        <div className="mb-6 border-l-4 border-titanes-navy bg-slate-50 px-4 py-3 text-sm text-slate-700">
          {message}
        </div>
      )}

      {loading ? (
        <div className="text-slate-500 uppercase tracking-widest text-xs">Cargando</div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Estudiantes activos"
              value={stats.active_students}
              hint={`de ${stats.total_students} registrados`}
              accent="navy"
            />
            <StatCard
              label="Cobrado este mes"
              value={formatCOP(stats.total_collected_this_month)}
              hint={`${stats.payments_this_month} pagos confirmados`}
              accent="emerald"
            />
            <StatCard
              label="Pendientes del mes"
              value={stats.pending_payments_this_month}
              hint={`${MONTH_NAMES_ES[month - 1]} ${year}`}
              accent="amber"
            />
            <StatCard
              label="Deuda total acumulada"
              value={formatCOP(stats.total_pending)}
              hint={`Atrasado: ${formatCOP(stats.total_overdue_balance)}`}
              accent="red"
            />
          </div>

          <div className="mt-8 card p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-titanes-red mb-1">
                  Operaciones
                </div>
                <h2 className="h-section">Accesos rápidos</h2>
                <p className="text-sm text-slate-500 mt-1 max-w-lg">
                  Administra el roster, registra pagos, emite facturas y carnets
                  oficiales del club.
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Link to="/estudiantes" className="btn-primary">
                  Ver roster
                </Link>
                <Link to="/pagos" className="btn-ghost">
                  Ir a pagos
                </Link>
                <Link to="/estudiantes/nuevo" className="btn-ghost">
                  Nuevo estudiante
                </Link>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-slate-500">Sin datos.</div>
      )}
    </div>
  );
}
