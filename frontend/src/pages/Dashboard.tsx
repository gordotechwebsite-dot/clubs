import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { dashboardApi, paymentsApi } from "../api";
import type { DashboardStats } from "../types";
import { currentPeriod, formatCOP, MONTH_NAMES_ES } from "../utils";

function Stat({
  label,
  value,
  accent = "slate",
}: {
  label: string;
  value: string | number;
  accent?: "slate" | "navy" | "red" | "emerald" | "amber";
}) {
  const accents: Record<string, string> = {
    slate: "bg-slate-50 text-slate-700",
    navy: "bg-titanes-ice text-titanes-navy",
    red: "bg-rose-50 text-titanes-crimson",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-800",
  };
  return (
    <div className={`card p-4 ${accents[accent]}`}>
      <div className="text-xs uppercase tracking-wide opacity-70">{label}</div>
      <div className="mt-1 text-2xl font-display font-bold">{value}</div>
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
    load();
  }, []);

  async function onGenerate() {
    setGenerating(true);
    setMessage(null);
    try {
      const { data } = await paymentsApi.generateMonth(year, month);
      setMessage(
        data.length === 0
          ? `No se crearon pagos nuevos (ya existían para ${MONTH_NAMES_ES[month - 1]} ${year}).`
          : `Se generaron ${data.length} pago(s) pendientes para ${MONTH_NAMES_ES[month - 1]} ${year}.`
      );
      load();
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return <div className="text-slate-500">Cargando...</div>;
  }
  if (!stats) {
    return <div className="text-slate-500">Sin datos.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl text-titanes-dark">Panel del Club</h1>
          <p className="text-slate-500 text-sm">
            Resumen de {MONTH_NAMES_ES[month - 1]} {year}
          </p>
        </div>
        <button className="btn-primary" onClick={onGenerate} disabled={generating}>
          {generating ? "Generando..." : `Generar cobros de ${MONTH_NAMES_ES[month - 1]}`}
        </button>
      </div>

      {message && (
        <div className="rounded-md bg-titanes-ice text-titanes-navy px-4 py-2 text-sm border border-titanes-navy/20">
          {message}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Estudiantes activos" value={stats.active_students} accent="navy" />
        <Stat label="Total estudiantes" value={stats.total_students} />
        <Stat
          label="Cobrado este mes"
          value={formatCOP(stats.total_collected_this_month)}
          accent="emerald"
        />
        <Stat
          label="Pagos registrados este mes"
          value={stats.payments_this_month}
          accent="emerald"
        />
        <Stat
          label="Pendientes este mes"
          value={stats.pending_payments_this_month}
          accent="amber"
        />
        <Stat
          label="Deuda acumulada"
          value={formatCOP(stats.total_pending)}
          accent="red"
        />
        <Stat
          label="Deuda atrasada"
          value={formatCOP(stats.total_overdue_balance)}
          accent="red"
        />
      </div>

      <div className="card p-6 flex flex-col md:flex-row gap-4 items-start md:items-center">
        <img src="/logo.png" className="h-16 w-16 object-contain" alt="" />
        <div className="flex-1">
          <div className="font-display text-xl text-titanes-dark">Acciones rápidas</div>
          <p className="text-sm text-slate-600">
            Gestiona estudiantes y pagos, emite facturas y carnets virtuales.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link to="/estudiantes" className="btn-primary">
            Ver estudiantes
          </Link>
          <Link to="/pagos" className="btn-ghost">
            Ir a pagos
          </Link>
        </div>
      </div>
    </div>
  );
}
