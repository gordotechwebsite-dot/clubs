export type AdminRole = "director" | "staff" | "coach" | "viewer";

export interface Admin {
  id: number;
  email: string;
  name: string;
  role: AdminRole;
  is_active: boolean;
}

export interface AdminInput {
  email: string;
  name: string;
  password: string;
  role: AdminRole;
}

export interface SearchStudent {
  id: number;
  full_name: string;
  document_id: string | null;
  phone: string | null;
  sport: string | null;
  category: string | null;
  is_active: boolean;
}

export interface AccountStatementLine {
  payment_id: number;
  period_year: number;
  period_month: number;
  due_date: string | null;
  amount_due: number;
  amount_paid: number;
  balance: number;
  status: "pending" | "paid" | "partial" | "overdue";
  paid_at: string | null;
}

export interface AccountStatement {
  student_id: number;
  student_name: string;
  sport: string | null;
  category: string | null;
  guardian_name: string | null;
  guardian_phone: string | null;
  monthly_fee: number;
  generated_at: string;
  total_due: number;
  total_paid: number;
  balance: number;
  pending_months: number;
  overdue_months: number;
  lines: AccountStatementLine[];
}

export interface SportBreakdown {
  sport: string;
  active_students: number;
  amount_due: number;
  amount_paid: number;
  balance: number;
  overdue_balance: number;
}

export interface MonthlyReport {
  year: number;
  month: number;
  generated_at: string;
  total_due: number;
  total_collected: number;
  total_pending: number;
  total_overdue: number;
  payments_paid: number;
  payments_pending: number;
  payments_overdue: number;
  by_sport: SportBreakdown[];
}

export interface BackupItem {
  filename: string;
  size_bytes: number;
  created_at: string;
}

export interface Student {
  id: number;
  public_token: string | null;
  full_name: string;
  document_id: string | null;
  birth_date: string | null;
  phone: string | null;
  address: string | null;
  guardian_name: string | null;
  guardian_phone: string | null;
  category: string | null;
  sport: string | null;
  photo_url: string | null;
  join_date: string;
  monthly_fee: number;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  total_due: number;
  total_paid: number;
  balance: number;
  pending_months: number;
}

export type StudentInput = Partial<
  Omit<
    Student,
    | "id"
    | "public_token"
    | "created_at"
    | "updated_at"
    | "total_due"
    | "total_paid"
    | "balance"
    | "pending_months"
  >
> & {
  full_name: string;
};

export interface PublicStudent {
  id: number;
  full_name: string;
  sport: string | null;
  category: string | null;
  photo_url: string | null;
  join_date: string;
  is_active: boolean;
}

export interface Payment {
  id: number;
  student_id: number;
  period_year: number;
  period_month: number;
  due_date: string | null;
  amount_due: number;
  amount_paid: number;
  status: "pending" | "paid" | "partial" | "overdue";
  paid_at: string | null;
  payment_method: string | null;
  reference: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type AttendanceStatus = "present" | "absent" | "late" | "excused";

export interface Attendance {
  id: number;
  student_id: number;
  session_date: string;
  status: AttendanceStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AttendanceSheetEntry {
  student_id: number;
  student_name: string;
  sport: string | null;
  category: string | null;
  attendance_id: number | null;
  status: AttendanceStatus | null;
  notes: string | null;
}

export interface AttendanceSheet {
  session_date: string;
  entries: AttendanceSheetEntry[];
}

export interface AttendanceStats {
  total_sessions: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  attendance_rate: number;
}

export interface DashboardStats {
  total_students: number;
  active_students: number;
  total_collected_this_month: number;
  total_pending: number;
  total_overdue_balance: number;
  payments_this_month: number;
  pending_payments_this_month: number;
}
