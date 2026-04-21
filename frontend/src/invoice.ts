import jsPDF from "jspdf";
import type { Payment, Student } from "./types";
import { formatCOP, formatDateEs, getLogoDataUrl, MONTH_NAMES_ES } from "./utils";

function paymentsTotalDue(payments: Payment[]): number {
  return payments.reduce((acc, p) => acc + Math.max(0, p.amount_due - p.amount_paid), 0);
}

export async function buildInvoicePdf(
  student: Student,
  payments: Payment[],
  opts: { issueDate?: Date; invoiceNumber?: string } = {}
): Promise<jsPDF> {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const W = doc.internal.pageSize.getWidth();
  const margin = 40;
  let y = margin;

  const logo = await getLogoDataUrl();
  if (logo) {
    try {
      doc.addImage(logo, "PNG", margin, y, 70, 70);
    } catch {
      // ignore
    }
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(11, 27, 74);
  doc.text("CLUB TITANES", W - margin, y + 24, { align: "right" });
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80);
  doc.text("Soatá, Boyacá", W - margin, y + 40, { align: "right" });
  doc.text(`Factura: ${opts.invoiceNumber || `INV-${Date.now()}`}`, W - margin, y + 54, {
    align: "right",
  });
  doc.text(`Fecha: ${formatDateEs((opts.issueDate || new Date()).toISOString())}`, W - margin, y + 68, {
    align: "right",
  });

  y += 100;

  // Student block
  doc.setDrawColor(220);
  doc.setFillColor(244, 247, 253);
  doc.roundedRect(margin, y, W - margin * 2, 80, 6, 6, "F");
  doc.setTextColor(11, 27, 74);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Facturado a:", margin + 12, y + 20);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(40);
  doc.setFontSize(11);
  doc.text(student.guardian_name || "Sin acudiente registrado", margin + 12, y + 38);
  if (student.guardian_phone)
    doc.text(`Tel. ${student.guardian_phone}`, margin + 12, y + 54);
  if (student.address) doc.text(student.address, margin + 12, y + 70);

  doc.setTextColor(11, 27, 74);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Deportista:", margin + 260, y + 20);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(40);
  doc.setFontSize(11);
  doc.text(student.full_name, margin + 260, y + 38);
  if (student.document_id) doc.text(`Documento: ${student.document_id}`, margin + 260, y + 54);
  if (student.sport || student.category) {
    const cat = [student.sport, student.category].filter(Boolean).join(" / ");
    doc.text(cat, margin + 260, y + 70);
  }

  y += 100;

  // Table header
  doc.setFillColor(19, 42, 122);
  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.rect(margin, y, W - margin * 2, 24, "F");
  doc.text("PERIODO", margin + 12, y + 16);
  doc.text("CONCEPTO", margin + 140, y + 16);
  doc.text("VALOR", W - margin - 120, y + 16);
  doc.text("PAGADO", W - margin - 70, y + 16);
  doc.text("SALDO", W - margin - 12, y + 16, { align: "right" });
  y += 24;

  doc.setTextColor(40);
  doc.setFont("helvetica", "normal");

  const rowHeight = 22;
  payments.forEach((p, idx) => {
    if (idx % 2 === 0) {
      doc.setFillColor(250, 250, 250);
      doc.rect(margin, y, W - margin * 2, rowHeight, "F");
    }
    const periodo = `${MONTH_NAMES_ES[p.period_month - 1]} ${p.period_year}`;
    const saldo = Math.max(0, p.amount_due - p.amount_paid);
    doc.text(periodo, margin + 12, y + 15);
    doc.text("Mensualidad", margin + 140, y + 15);
    doc.text(formatCOP(p.amount_due), W - margin - 120, y + 15);
    doc.text(formatCOP(p.amount_paid), W - margin - 70, y + 15);
    doc.text(formatCOP(saldo), W - margin - 12, y + 15, { align: "right" });
    y += rowHeight;
  });

  // Totals
  y += 10;
  const totalDue = payments.reduce((acc, p) => acc + p.amount_due, 0);
  const totalPaid = payments.reduce((acc, p) => acc + p.amount_paid, 0);
  const pendingTotal = paymentsTotalDue(payments);

  doc.setDrawColor(200);
  doc.line(margin, y, W - margin, y);
  y += 14;

  doc.setFont("helvetica", "bold");
  doc.setTextColor(11, 27, 74);
  doc.setFontSize(11);
  doc.text(`Total facturado: ${formatCOP(totalDue)}`, W - margin, y, { align: "right" });
  y += 16;
  doc.text(`Total pagado: ${formatCOP(totalPaid)}`, W - margin, y, { align: "right" });
  y += 16;
  doc.setTextColor(183, 28, 28);
  doc.setFontSize(13);
  doc.text(`Saldo pendiente: ${formatCOP(pendingTotal)}`, W - margin, y, { align: "right" });

  y += 40;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(
    "Gracias por su puntualidad. Por favor conserve este comprobante.",
    margin,
    y
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
