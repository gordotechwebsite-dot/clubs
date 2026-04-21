import jsPDF from "jspdf";
import type { AccountStatement } from "./types";
import { formatCOP, formatDateEs, getLogoDataUrl, MONTH_NAMES_ES } from "./utils";

const NAVY: [number, number, number] = [11, 27, 74];
const NAVY_HEAD: [number, number, number] = [19, 42, 122];
const CRIMSON: [number, number, number] = [183, 28, 28];
const BODY: [number, number, number] = [40, 40, 40];
const MUTED: [number, number, number] = [110, 116, 130];
const PANEL: [number, number, number] = [244, 247, 253];
const ROW_ALT: [number, number, number] = [248, 250, 253];
const BORDER: [number, number, number] = [215, 220, 230];

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

export async function buildStatementPdf(s: AccountStatement): Promise<jsPDF> {
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
  doc.setFontSize(24);
  doc.setTextColor(...NAVY);
  doc.text("CLUB TITANES", W - margin, y + 26, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  doc.text("Soatá, Boyacá", W - margin, y + 44, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...NAVY);
  doc.text("ESTADO DE CUENTA", W - margin, y + 68, { align: "right" });

  y += 100;

  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.8);
  doc.line(margin, y, W - margin, y);
  y += 18;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text("EMITIDO", margin, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...BODY);
  doc.text(formatDateEs(new Date().toISOString()), margin + 70, y);
  y += 22;

  // Student / guardian block
  const blockH = 100;
  doc.setFillColor(...PANEL);
  doc.roundedRect(margin, y, contentW, blockH, 6, 6, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...NAVY);
  doc.text("DEPORTISTA", margin + 16, y + 22);
  doc.text("ACUDIENTE", margin + contentW / 2 + 16, y + 22);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...BODY);
  doc.text(s.student_name, margin + 16, y + 44);
  doc.text(s.guardian_name || "Sin registrar", margin + contentW / 2 + 16, y + 44);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...MUTED);
  const disc = [s.sport, s.category].filter(Boolean).join(" / ") || "—";
  doc.text(disc, margin + 16, y + 64);
  doc.text(`Cuota: ${formatCOP(s.monthly_fee)}`, margin + 16, y + 82);
  if (s.guardian_phone) {
    doc.text(`Tel. ${s.guardian_phone}`, margin + contentW / 2 + 16, y + 64);
  }

  y += blockH + 24;

  // Table of lines
  const colPeriodo = 150;
  const colVence = 100;
  const colValor = 90;
  const colPagado = 90;
  const colSaldo = contentW - colPeriodo - colVence - colValor - colPagado;

  const xPeriodo = margin;
  const xVence = xPeriodo + colPeriodo;
  const xValorR = xVence + colVence + colValor - 8;
  const xPagadoR = xValorR + colPagado;
  const xSaldoR = xPagadoR + colSaldo;

  const headH = 26;
  doc.setFillColor(...NAVY_HEAD);
  doc.rect(margin, y, contentW, headH, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text("PERIODO", xPeriodo + 14, y + 17);
  doc.text("VENCE", xVence + 10, y + 17);
  doc.text("VALOR", xValorR, y + 17, { align: "right" });
  doc.text("PAGADO", xPagadoR, y + 17, { align: "right" });
  doc.text("SALDO", xSaldoR - 14, y + 17, { align: "right" });
  y += headH;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...BODY);

  const rowH = 22;
  const bottomLimit = H - margin - 170;
  const lines = [...s.lines].sort(
    (a, b) =>
      a.period_year - b.period_year || a.period_month - b.period_month,
  );

  lines.forEach((ln, idx) => {
    if (y > bottomLimit) {
      doc.addPage();
      y = margin;
    }
    if (idx % 2 === 0) {
      doc.setFillColor(...ROW_ALT);
      doc.rect(margin, y, contentW, rowH, "F");
    }
    const periodo = `${MONTH_NAMES_ES[ln.period_month - 1]} ${ln.period_year}`;
    const vence = ln.due_date ? formatDateEs(ln.due_date) : "—";
    const mid = y + 15;
    if (ln.status === "overdue") {
      doc.setTextColor(...CRIMSON);
    } else {
      doc.setTextColor(...BODY);
    }
    doc.text(periodo, xPeriodo + 14, mid);
    doc.setTextColor(...BODY);
    doc.text(vence, xVence + 10, mid);
    doc.text(formatCOP(ln.amount_due), xValorR, mid, { align: "right" });
    doc.text(formatCOP(ln.amount_paid), xPagadoR, mid, { align: "right" });
    if (ln.balance > 0) {
      doc.setTextColor(...CRIMSON);
    }
    doc.text(formatCOP(ln.balance), xSaldoR - 14, mid, { align: "right" });
    doc.setTextColor(...BODY);

    // Status badge
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...MUTED);
    doc.text(statusLabel(ln.status).toUpperCase(), xVence + 10, mid + 10);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...BODY);

    y += rowH;
  });

  if (lines.length === 0) {
    doc.setTextColor(...MUTED);
    doc.text("Sin movimientos registrados.", margin + 14, y + 16);
    y += rowH;
  }

  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.8);
  doc.line(margin, y, W - margin, y);

  // Totals
  y += 24;
  const totalsW = 280;
  const totalsX = W - margin - totalsW;
  const totalsH = 130;
  doc.setFillColor(...PANEL);
  doc.roundedRect(totalsX, y, totalsW, totalsH, 6, 6, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...MUTED);
  doc.text("Total facturado", totalsX + 18, y + 26);
  doc.setTextColor(...BODY);
  doc.text(formatCOP(s.total_due), totalsX + totalsW - 18, y + 26, {
    align: "right",
  });

  doc.setTextColor(...MUTED);
  doc.text("Total pagado", totalsX + 18, y + 50);
  doc.setTextColor(...BODY);
  doc.text(formatCOP(s.total_paid), totalsX + totalsW - 18, y + 50, {
    align: "right",
  });

  doc.setTextColor(...MUTED);
  doc.text("Meses pendientes", totalsX + 18, y + 74);
  doc.setTextColor(...BODY);
  doc.text(String(s.pending_months), totalsX + totalsW - 18, y + 74, {
    align: "right",
  });

  doc.setDrawColor(...BORDER);
  doc.line(totalsX + 14, y + 90, totalsX + totalsW - 14, y + 90);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...NAVY);
  doc.text("Saldo pendiente", totalsX + 18, y + 114);
  doc.setTextColor(...CRIMSON);
  doc.setFontSize(15);
  doc.text(formatCOP(s.balance), totalsX + totalsW - 18, y + 114, {
    align: "right",
  });

  // Footer
  const footerY = H - margin;
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.6);
  doc.line(margin, footerY - 40, W - margin, footerY - 40);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(
    "Documento interno del Club Titanes. Conserve este estado de cuenta.",
    margin,
    footerY - 22,
  );
  doc.text("Club Titanes  ·  Soatá, Boyacá", W - margin, footerY - 22, {
    align: "right",
  });

  return doc;
}

export async function downloadStatement(s: AccountStatement) {
  const doc = await buildStatementPdf(s);
  const filename = `Estado_de_cuenta_${s.student_name.replace(/\s+/g, "_")}.pdf`;
  doc.save(filename);
}
