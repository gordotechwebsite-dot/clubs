import jsPDF from "jspdf";
import type { MonthlyReport } from "./types";
import { formatCOP, formatDateEs, getLogoDataUrl, MONTH_NAMES_ES } from "./utils";

const NAVY: [number, number, number] = [11, 27, 74];
const NAVY_HEAD: [number, number, number] = [19, 42, 122];
const CRIMSON: [number, number, number] = [183, 28, 28];
const SUCCESS: [number, number, number] = [21, 128, 61];
const BODY: [number, number, number] = [40, 40, 40];
const MUTED: [number, number, number] = [110, 116, 130];
const PANEL: [number, number, number] = [244, 247, 253];
const ROW_ALT: [number, number, number] = [248, 250, 253];
const BORDER: [number, number, number] = [215, 220, 230];

const BAR_COLORS: [number, number, number][] = [
  [19, 42, 122],
  [183, 28, 28],
  [21, 128, 61],
  [180, 83, 9],
  [71, 85, 105],
];

export async function buildMonthlyReportPdf(
  r: MonthlyReport,
): Promise<jsPDF> {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const margin = 54;
  const contentW = W - margin * 2;
  let y = margin;

  const logo = await getLogoDataUrl();
  if (logo) {
    try {
      doc.addImage(logo, "PNG", margin, y, 80, 80);
    } catch {
      // ignore
    }
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...NAVY);
  doc.text("REPORTE FINANCIERO", W - margin, y + 28, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(...BODY);
  doc.text(
    `${MONTH_NAMES_ES[r.month - 1]} ${r.year}`,
    W - margin,
    y + 48,
    { align: "right" },
  );
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(
    `Generado el ${formatDateEs(r.generated_at)}`,
    W - margin,
    y + 64,
    { align: "right" },
  );

  y += 100;
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.8);
  doc.line(margin, y, W - margin, y);
  y += 24;

  // KPI cards (4 cards)
  const gap = 14;
  const cardW = (contentW - gap * 3) / 4;
  const cardH = 78;

  const kpis: { label: string; value: string; color: [number, number, number] }[] = [
    { label: "Total facturado", value: formatCOP(r.total_due), color: NAVY },
    { label: "Recaudado", value: formatCOP(r.total_collected), color: SUCCESS },
    { label: "Pendiente", value: formatCOP(r.total_pending), color: [180, 83, 9] },
    { label: "Mora", value: formatCOP(r.total_overdue), color: CRIMSON },
  ];

  kpis.forEach((k, i) => {
    const x = margin + (cardW + gap) * i;
    doc.setFillColor(...PANEL);
    doc.roundedRect(x, y, cardW, cardH, 6, 6, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...MUTED);
    doc.text(k.label.toUpperCase(), x + 14, y + 22);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(...k.color);
    doc.text(k.value, x + 14, y + 52);
  });

  y += cardH + 22;

  // Payment counts
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...NAVY);
  doc.text("RESUMEN DE PAGOS", margin, y);
  y += 8;
  doc.setDrawColor(...BORDER);
  doc.line(margin, y, W - margin, y);
  y += 16;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...BODY);
  doc.text(`Pagos marcados como pagados: ${r.payments_paid}`, margin, y);
  y += 16;
  doc.text(`Pagos pendientes: ${r.payments_pending}`, margin, y);
  y += 16;
  doc.text(`Pagos en mora: ${r.payments_overdue}`, margin, y);
  y += 22;

  // Chart: recaudo por deporte (bar chart)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...NAVY);
  doc.text("RECAUDO POR DISCIPLINA", margin, y);
  y += 8;
  doc.setDrawColor(...BORDER);
  doc.line(margin, y, W - margin, y);
  y += 16;

  const chartH = 150;
  const chartY = y;
  const chartX = margin;
  const chartW = contentW;

  doc.setDrawColor(...BORDER);
  doc.line(chartX, chartY + chartH, chartX + chartW, chartY + chartH);

  const maxDue = Math.max(
    1,
    ...r.by_sport.map((b) => Math.max(b.amount_due, b.amount_paid)),
  );
  const groupCount = Math.max(1, r.by_sport.length);
  const groupW = chartW / groupCount;
  const barW = Math.min(38, groupW / 3);

  r.by_sport.forEach((b, idx) => {
    const gx = chartX + groupW * idx + groupW / 2;
    const paidH = (b.amount_paid / maxDue) * (chartH - 20);
    const dueH = (b.amount_due / maxDue) * (chartH - 20);
    const color = BAR_COLORS[idx % BAR_COLORS.length];

    // Bar: total due
    doc.setFillColor(...color);
    doc.rect(gx - barW - 2, chartY + chartH - dueH, barW, dueH, "F");
    // Bar: paid
    doc.setFillColor(...SUCCESS);
    doc.rect(gx + 2, chartY + chartH - paidH, barW, paidH, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...BODY);
    doc.text(b.sport.toUpperCase(), gx, chartY + chartH + 14, {
      align: "center",
    });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...MUTED);
    doc.text(formatCOP(b.amount_paid), gx, chartY + chartH + 24, {
      align: "center",
    });
  });

  // Legend
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setFillColor(...NAVY_HEAD);
  doc.rect(chartX, chartY - 12, 10, 8, "F");
  doc.setTextColor(...BODY);
  doc.text("Facturado", chartX + 14, chartY - 5);
  doc.setFillColor(...SUCCESS);
  doc.rect(chartX + 80, chartY - 12, 10, 8, "F");
  doc.text("Recaudado", chartX + 94, chartY - 5);

  y = chartY + chartH + 48;

  // Table: desglose por deporte
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...NAVY);
  doc.text("DESGLOSE POR DISCIPLINA", margin, y);
  y += 8;
  doc.setDrawColor(...BORDER);
  doc.line(margin, y, W - margin, y);
  y += 12;

  const colSport = 120;
  const colActive = 80;
  const colDue = 110;
  const colPaid = 110;
  const colBalance = contentW - colSport - colActive - colDue - colPaid;

  const xSport = margin;
  const xActive = xSport + colSport;
  const xDueR = xActive + colActive + colDue - 8;
  const xPaidR = xDueR + colPaid;
  const xBalR = xPaidR + colBalance;

  const headH = 24;
  doc.setFillColor(...NAVY_HEAD);
  doc.rect(margin, y, contentW, headH, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text("DISCIPLINA", xSport + 12, y + 15);
  doc.text("ACTIVOS", xActive + 8, y + 15);
  doc.text("FACTURADO", xDueR, y + 15, { align: "right" });
  doc.text("PAGADO", xPaidR, y + 15, { align: "right" });
  doc.text("SALDO", xBalR - 12, y + 15, { align: "right" });
  y += headH;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...BODY);

  const rowH = 22;
  r.by_sport.forEach((b, idx) => {
    if (idx % 2 === 0) {
      doc.setFillColor(...ROW_ALT);
      doc.rect(margin, y, contentW, rowH, "F");
    }
    const mid = y + 15;
    doc.text(b.sport, xSport + 12, mid);
    doc.text(String(b.active_students), xActive + 8, mid);
    doc.text(formatCOP(b.amount_due), xDueR, mid, { align: "right" });
    doc.text(formatCOP(b.amount_paid), xPaidR, mid, { align: "right" });
    if (b.balance > 0) doc.setTextColor(...CRIMSON);
    doc.text(formatCOP(b.balance), xBalR - 12, mid, { align: "right" });
    doc.setTextColor(...BODY);
    y += rowH;
  });

  if (r.by_sport.length === 0) {
    doc.setTextColor(...MUTED);
    doc.text("Sin datos para el periodo.", margin + 12, y + 15);
    y += rowH;
  }

  const footerY = H - margin;
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.6);
  doc.line(margin, footerY - 40, W - margin, footerY - 40);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(
    "Reporte interno del Club Titanes. Uso exclusivo de la dirección.",
    margin,
    footerY - 22,
  );
  doc.text("Club Titanes  ·  Soatá, Boyacá", W - margin, footerY - 22, {
    align: "right",
  });

  return doc;
}

export async function downloadMonthlyReport(r: MonthlyReport) {
  const doc = await buildMonthlyReportPdf(r);
  const filename = `Reporte_${r.year}_${String(r.month).padStart(2, "0")}.pdf`;
  doc.save(filename);
}
