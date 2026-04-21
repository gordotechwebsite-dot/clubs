import type { Payment } from "../types";

const LABELS: Record<Payment["status"], string> = {
  paid: "Pagado",
  pending: "Pendiente",
  overdue: "Atrasado",
  partial: "Parcial",
};

const CLASS: Record<Payment["status"], string> = {
  paid: "badge-paid",
  pending: "badge-pending",
  overdue: "badge-overdue",
  partial: "badge-partial",
};

export default function PaymentBadge({ status }: { status: Payment["status"] }) {
  return <span className={CLASS[status]}>{LABELS[status]}</span>;
}
