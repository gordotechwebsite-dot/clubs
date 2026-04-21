import type { AttendanceStatus } from "../types";

const LABELS: Record<AttendanceStatus, string> = {
  present: "Presente",
  absent: "Ausente",
  late: "Tarde",
  excused: "Excusa",
};

const CLASS: Record<AttendanceStatus, string> = {
  present: "pill bg-emerald-50 text-emerald-800 border border-emerald-200",
  absent: "pill bg-rose-50 text-rose-800 border border-rose-200",
  late: "pill bg-amber-50 text-amber-800 border border-amber-200",
  excused: "pill bg-sky-50 text-sky-800 border border-sky-200",
};

export default function AttendanceBadge({ status }: { status: AttendanceStatus }) {
  return <span className={CLASS[status]}>{LABELS[status]}</span>;
}

export const ATTENDANCE_LABELS = LABELS;
