import axios, { AxiosError } from "axios";
import type {
  Admin,
  Attendance,
  AttendanceSheet,
  AttendanceStats,
  AttendanceStatus,
  DashboardStats,
  Payment,
  Student,
  StudentInput,
} from "./types";

const baseURL = import.meta.env.VITE_API_URL || "/api";

export const api = axios.create({
  baseURL: baseURL.replace(/\/$/, ""),
});

const TOKEN_KEY = "titanes_token";
const ADMIN_KEY = "titanes_admin";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ADMIN_KEY);
}

export function getStoredAdmin(): Admin | null {
  const raw = localStorage.getItem(ADMIN_KEY);
  return raw ? (JSON.parse(raw) as Admin) : null;
}

export function setStoredAdmin(admin: Admin) {
  localStorage.setItem(ADMIN_KEY, JSON.stringify(admin));
}

api.interceptors.request.use((cfg) => {
  const t = getToken();
  if (t) {
    cfg.headers.Authorization = `Bearer ${t}`;
  }
  return cfg;
});

api.interceptors.response.use(
  (res) => res,
  (err: AxiosError) => {
    if (err.response?.status === 401) {
      clearAuth();
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

function normalizePath(p: string) {
  if (baseURL.endsWith("/api") || baseURL === "/api") {
    return p.replace(/^\/api/, "");
  }
  return p;
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ access_token: string; admin: Admin }>(normalizePath("/api/auth/login"), { email, password }),
  me: () => api.get<Admin>(normalizePath("/api/auth/me")),
};

export const studentsApi = {
  list: (params?: { search?: string; active_only?: boolean }) =>
    api.get<Student[]>(normalizePath("/api/students"), { params }),
  get: (id: number) => api.get<Student>(normalizePath(`/api/students/${id}`)),
  create: (data: StudentInput) => api.post<Student>(normalizePath("/api/students"), data),
  update: (id: number, data: Partial<StudentInput>) =>
    api.put<Student>(normalizePath(`/api/students/${id}`), data),
  remove: (id: number) => api.delete(normalizePath(`/api/students/${id}`)),
};

export const paymentsApi = {
  list: (params?: { student_id?: number; year?: number; month?: number; status_filter?: string }) =>
    api.get<Payment[]>(normalizePath("/api/payments"), { params }),
  create: (data: Partial<Payment> & { student_id: number; period_year: number; period_month: number; amount_due: number }) =>
    api.post<Payment>(normalizePath("/api/payments"), data),
  update: (id: number, data: Partial<Payment>) =>
    api.put<Payment>(normalizePath(`/api/payments/${id}`), data),
  markPaid: (
    id: number,
    data: { amount_paid?: number; payment_method?: string; reference?: string; paid_at?: string; notes?: string }
  ) => api.post<Payment>(normalizePath(`/api/payments/${id}/mark-paid`), data),
  markUnpaid: (id: number) => api.post<Payment>(normalizePath(`/api/payments/${id}/mark-unpaid`), {}),
  remove: (id: number) => api.delete(normalizePath(`/api/payments/${id}`)),
  generateMonth: (year: number, month: number) =>
    api.post<Payment[]>(normalizePath("/api/payments/generate-month"), null, { params: { year, month } }),
};

export const attendanceApi = {
  list: (params?: {
    student_id?: number;
    session_date?: string;
    date_from?: string;
    date_to?: string;
  }) => api.get<Attendance[]>(normalizePath("/api/attendance"), { params }),
  sheet: (params: {
    session_date: string;
    sport?: string;
    category?: string;
    only_active?: boolean;
  }) => api.get<AttendanceSheet>(normalizePath("/api/attendance/sheet"), { params }),
  stats: (studentId: number) =>
    api.get<AttendanceStats>(normalizePath(`/api/attendance/stats/${studentId}`)),
  bulk: (session_date: string, entries: { student_id: number; status: AttendanceStatus; notes?: string | null }[]) =>
    api.post<Attendance[]>(normalizePath("/api/attendance/bulk"), { session_date, entries }),
  update: (id: number, data: { status?: AttendanceStatus; notes?: string | null }) =>
    api.put<Attendance>(normalizePath(`/api/attendance/${id}`), data),
  remove: (id: number) => api.delete(normalizePath(`/api/attendance/${id}`)),
};

export const dashboardApi = {
  stats: () => api.get<DashboardStats>(normalizePath("/api/dashboard/stats")),
};
