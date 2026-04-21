export interface Admin {
  id: number;
  email: string;
  name: string;
}

export interface Student {
  id: number;
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
  Omit<Student, "id" | "created_at" | "updated_at" | "total_due" | "total_paid" | "balance" | "pending_months">
> & {
  full_name: string;
};

export interface Payment {
  id: number;
  student_id: number;
  period_year: number;
  period_month: number;
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

export interface DashboardStats {
  total_students: number;
  active_students: number;
  total_collected_this_month: number;
  total_pending: number;
  total_overdue_balance: number;
  payments_this_month: number;
  pending_payments_this_month: number;
}
