from datetime import date, datetime
from pydantic import BaseModel, EmailStr, ConfigDict


# --- Auth ---
class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    admin: "AdminOut"


class AdminOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: EmailStr
    name: str


# --- Student ---
class StudentBase(BaseModel):
    full_name: str
    document_id: str | None = None
    birth_date: date | None = None
    phone: str | None = None
    address: str | None = None
    guardian_name: str | None = None
    guardian_phone: str | None = None
    category: str | None = None
    sport: str | None = None
    photo_url: str | None = None
    join_date: date | None = None
    monthly_fee: int = 50000
    is_active: bool = True
    notes: str | None = None


class StudentCreate(StudentBase):
    pass


class StudentUpdate(BaseModel):
    full_name: str | None = None
    document_id: str | None = None
    birth_date: date | None = None
    phone: str | None = None
    address: str | None = None
    guardian_name: str | None = None
    guardian_phone: str | None = None
    category: str | None = None
    sport: str | None = None
    photo_url: str | None = None
    join_date: date | None = None
    monthly_fee: int | None = None
    is_active: bool | None = None
    notes: str | None = None


class StudentOut(StudentBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    public_token: str | None = None
    join_date: date
    created_at: datetime
    updated_at: datetime


class StudentPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    full_name: str
    sport: str | None = None
    category: str | None = None
    photo_url: str | None = None
    join_date: date
    is_active: bool


class StudentSummary(StudentOut):
    total_due: int = 0
    total_paid: int = 0
    balance: int = 0
    pending_months: int = 0


# --- Payment ---
class PaymentBase(BaseModel):
    student_id: int
    period_year: int
    period_month: int
    amount_due: int
    amount_paid: int = 0
    status: str = "pending"
    paid_at: datetime | None = None
    payment_method: str | None = None
    reference: str | None = None
    notes: str | None = None


class PaymentCreate(PaymentBase):
    pass


class PaymentUpdate(BaseModel):
    amount_due: int | None = None
    amount_paid: int | None = None
    status: str | None = None
    paid_at: datetime | None = None
    payment_method: str | None = None
    reference: str | None = None
    notes: str | None = None


class PaymentOut(PaymentBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime
    updated_at: datetime


class MarkPaidRequest(BaseModel):
    amount_paid: int | None = None
    payment_method: str | None = None
    reference: str | None = None
    paid_at: datetime | None = None
    notes: str | None = None


# --- Attendance ---
class AttendanceBase(BaseModel):
    student_id: int
    session_date: date
    status: str = "present"
    notes: str | None = None


class AttendanceCreate(AttendanceBase):
    pass


class AttendanceUpdate(BaseModel):
    status: str | None = None
    notes: str | None = None


class AttendanceOut(AttendanceBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime
    updated_at: datetime


class AttendanceSheetEntry(BaseModel):
    student_id: int
    student_name: str
    sport: str | None = None
    category: str | None = None
    attendance_id: int | None = None
    status: str | None = None
    notes: str | None = None


class AttendanceSheetOut(BaseModel):
    session_date: date
    entries: list[AttendanceSheetEntry]


class AttendanceBulkItem(BaseModel):
    student_id: int
    status: str
    notes: str | None = None


class AttendanceBulkRequest(BaseModel):
    session_date: date
    entries: list[AttendanceBulkItem]


class AttendanceStats(BaseModel):
    total_sessions: int
    present: int
    absent: int
    late: int
    excused: int
    attendance_rate: float


# --- Dashboard ---
class DashboardStats(BaseModel):
    total_students: int
    active_students: int
    total_collected_this_month: int
    total_pending: int
    total_overdue_balance: int
    payments_this_month: int
    pending_payments_this_month: int


TokenResponse.model_rebuild()
