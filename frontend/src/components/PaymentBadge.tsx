import type { Payment } from "../types";

const LABELS: Record<Payment["status"], string> = {
  paid: "Pagado",
  pending: "Pendiente",
  overdue: "Atrasado",
  partial: "Parcial",
};

const CLASS: Record<Payment["status"], string> = {
  paid: "pill-paid",
  pending: "pill-pending",
  overdue: "pill-overdue",
  partial: "pill-partial",
};

export default function PaymentBadge({ status }: { status: Payment["status"] }) {
  return <span className={CLASS[status]}>{LABELS[status]}</span>;
}
