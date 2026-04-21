import jsPDF from "jspdf";
import type { Payment, Student } from "./types";
import { formatCOP, formatDateEs, getLogoDataUrl, MONTH_NAMES_ES } from "./utils";

const NAVY: [number, number, number] = [11, 27, 74];
const NAVY_HEAD: [number, number, number] = [19, 42, 122];
const CRIMSON: [number, number, number] = [183, 28, 28];
const BODY: [number, number, number] = [40, 40, 40];
const MUTED: [number, number, number] = [110, 116, 130];
const PANEL: [number, number, number] = [244, 247, 253];
const ROW_ALT: [number, number, number] = [248, 250, 253];
const BORDER: [number, number, number] = [215, 220, 230];

function paymentsTotalDue(payments: Payment[]): number {
  return payments.reduce(
    (acc, p) => acc + Math.max(0, p.amount_due - p.amount_paid),
    0
  );
}

export async function buildInvoicePdf(
  student: Student,
  payments: Payment[],
  opts: { issueDate?: Date; invoiceNumber?: string } = {}
): Promise<jsPDF> {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const margin = 54;
  const contentW = W - margin * 2;

  // ===== HEADER =====
  let y = margin;

  const logo = await getLogoDataUrl();
  if (logo) {
    try {
      doc.addImage(logo, "PNG", margin, y, 90, 90);
    } catch {
      // ignore
    }
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(...NAVY);
  doc.text("CLUB TITANES", W - margin, y + 30, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  doc.text("Soatá, Boyacá", W - margin, y + 48, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...NAVY);
  doc.text("FACTURA", W - margin, y + 70, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...BODY);
  doc.text(
    opts.invoiceNumber || `INV-${Date.now()}`,
    W - margin,
    y + 85,
    { align: "right" }
  );

  y += 110;

  // Divider
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.8);
  doc.line(margin, y, W - margin, y);

  // Emitted date line
  y += 18;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text("EMITIDA", margin, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...BODY);
  doc.text(
    formatDateEs((opts.issueDate || new Date()).toISOString()),
    margin + 70,
    y
  );

  y += 24;

  // ===== PARTY BLOCKS =====
  const blockH = 110;
  const gap = 18;
  const blockW = (contentW - gap) / 2;

  // Left: Facturado a (guardian)
  doc.setFillColor(...PANEL);
  doc.roundedRect(margin, y, blockW, blockH, 6, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...NAVY);
  doc.text("FACTURADO A", margin + 16, y + 22);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...BODY);
  doc.text(
    student.guardian_name || "Sin acudiente registrado",
    margin + 16,
    y + 44
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...MUTED);
  let linePos = y + 64;
  if (student.guardian_phone) {
    doc.text(`Tel. ${student.guardian_phone}`, margin + 16, linePos);
    linePos += 16;
  }
  if (student.address) {
    const wrapped = doc.splitTextToSize(student.address, blockW - 32);
    doc.text(wrapped, margin + 16, linePos);
  }

  // Right: Deportista
  const rx = margin + blockW + gap;
  doc.setFillColor(...PANEL);
  doc.roundedRect(rx, y, blockW, blockH, 6, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...NAVY);
  doc.text("DEPORTISTA", rx + 16, y + 22);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...BODY);
  doc.text(student.full_name, rx + 16, y + 44);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...MUTED);
  let rLine = y + 64;
  if (student.document_id) {
    doc.text(`Documento ${student.document_id}`, rx + 16, rLine);
    rLine += 16;
  }
  if (student.sport || student.category) {
    const cat = [student.sport, student.category].filter(Boolean).join(" / ");
    doc.text(cat, rx + 16, rLine);
    rLine += 16;
  }
  if (student.phone) {
    doc.text(`Tel. ${student.phone}`, rx + 16, rLine);
  }

  y += blockH + 30;

  // ===== TABLE =====
  // Columns: PERIODO | CONCEPTO | VALOR | PAGADO | SALDO
  const colValor = 80;
  const colPagado = 80;
  const colSaldo = 90;
  const colPeriodo = 120;
  const colConcepto = contentW - colPeriodo - colValor - colPagado - colSaldo;

  const xPeriodo = margin;
  const xConcepto = xPeriodo + colPeriodo;
  const xValorR = xConcepto + colConcepto + colValor - 8; // right edge for right-align
  const xPagadoR = xValorR + colPagado;
  const xSaldoR = xPagadoR + colSaldo;

  // Header row
  const headH = 28;
  doc.setFillColor(...NAVY_HEAD);
  doc.rect(margin, y, contentW, headH, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text("PERIODO", xPeriodo + 14, y + 18);
  doc.text("CONCEPTO", xConcepto + 8, y + 18);
  doc.text("VALOR", xValorR, y + 18, { align: "right" });
  doc.text("PAGADO", xPagadoR, y + 18, { align: "right" });
  doc.text("SALDO", xSaldoR - 14, y + 18, { align: "right" });
  y += headH;

  // Rows
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...BODY);

  const rowH = 28;
  const rows = payments.length > 0 ? payments : [];
  rows.forEach((p, idx) => {
    if (idx % 2 === 0) {
      doc.setFillColor(...ROW_ALT);
      doc.rect(margin, y, contentW, rowH, "F");
    }
    const periodo = `${MONTH_NAMES_ES[p.period_month - 1]} ${p.period_year}`;
    const saldo = Math.max(0, p.amount_due - p.amount_paid);
    const mid = y + 18;
    doc.text(periodo, xPeriodo + 14, mid);
    doc.text("Mensualidad del club", xConcepto + 8, mid);
    doc.text(formatCOP(p.amount_due), xValorR, mid, { align: "right" });
    doc.text(formatCOP(p.amount_paid), xPagadoR, mid, { align: "right" });
    doc.text(formatCOP(saldo), xSaldoR - 14, mid, { align: "right" });
    y += rowH;
  });

  if (rows.length === 0) {
    doc.setTextColor(...MUTED);
    doc.text("Sin pagos en el alcance seleccionado.", margin + 14, y + 18);
    y += rowH;
  }

  // Bottom border of table
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.8);
  doc.line(margin, y, W - margin, y);

  // ===== TOTALS PANEL =====
  y += 28;
  const totalDue = payments.reduce((acc, p) => acc + p.amount_due, 0);
  const totalPaid = payments.reduce((acc, p) => acc + p.amount_paid, 0);
  const pendingTotal = paymentsTotalDue(payments);

  const totalsW = 280;
  const totalsX = W - margin - totalsW;
  const totalsH = 110;

  doc.setFillColor(...PANEL);
  doc.roundedRect(totalsX, y, totalsW, totalsH, 6, 6, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...MUTED);
  doc.text("Total facturado", totalsX + 18, y + 26);
  doc.setTextColor(...BODY);
  doc.text(formatCOP(totalDue), totalsX + totalsW - 18, y + 26, {
    align: "right",
  });

  doc.setTextColor(...MUTED);
  doc.text("Total pagado", totalsX + 18, y + 50);
  doc.setTextColor(...BODY);
  doc.text(formatCOP(totalPaid), totalsX + totalsW - 18, y + 50, {
    align: "right",
  });

  // Separator
  doc.setDrawColor(...BORDER);
  doc.line(totalsX + 14, y + 66, totalsX + totalsW - 14, y + 66);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...NAVY);
  doc.text("Saldo pendiente", totalsX + 18, y + 92);
  doc.setTextColor(...CRIMSON);
  doc.setFontSize(15);
  doc.text(formatCOP(pendingTotal), totalsX + totalsW - 18, y + 92, {
    align: "right",
  });

  // ===== FOOTER =====
  const footerY = H - margin;
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.6);
  doc.line(margin, footerY - 40, W - margin, footerY - 40);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(
    "Gracias por su puntualidad. Por favor conserve este comprobante.",
    margin,
    footerY - 22
  );
  doc.text(
    "Club Titanes  ·  Soatá, Boyacá",
    W - margin,
    footerY - 22,
    { align: "right" }
  );

  return doc;
}

export async function downloadInvoice(
  student: Student,
  payments: Payment[],
  opts: { invoiceNumber?: string } = {}
) {
  const doc = await buildInvoicePdf(student, payments, opts);
  const filename = `Factura_${student.full_name.replace(/\s+/g, "_")}.pdf`;
  doc.save(filename);
}
