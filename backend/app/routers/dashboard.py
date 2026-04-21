from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Admin, Payment, Student
from app.routers.payments import ensure_current_month_payments
from app.schemas import DashboardStats
from app.security import get_current_admin

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=DashboardStats)
def get_stats(db: Session = Depends(get_db), _: Admin = Depends(get_current_admin)):
    ensure_current_month_payments(db)
    today = date.today()
    total_students = db.scalar(select(func.count(Student.id))) or 0
    active_students = db.scalar(
        select(func.count(Student.id)).where(Student.is_active.is_(True))
    ) or 0

    total_collected_this_month = db.scalar(
        select(func.coalesce(func.sum(Payment.amount_paid), 0)).where(
            Payment.period_year == today.year,
            Payment.period_month == today.month,
        )
    ) or 0

    total_pending = db.scalar(
        select(func.coalesce(func.sum(Payment.amount_due - Payment.amount_paid), 0)).where(
            Payment.status.in_(("pending", "partial", "overdue"))
        )
    ) or 0

    total_overdue_balance = db.scalar(
        select(func.coalesce(func.sum(Payment.amount_due - Payment.amount_paid), 0)).where(
            Payment.status == "overdue"
        )
    ) or 0

    payments_this_month = db.scalar(
        select(func.count(Payment.id)).where(
            Payment.period_year == today.year,
            Payment.period_month == today.month,
            Payment.status == "paid",
        )
    ) or 0

    pending_payments_this_month = db.scalar(
        select(func.count(Payment.id)).where(
            Payment.period_year == today.year,
            Payment.period_month == today.month,
            Payment.status.in_(("pending", "partial", "overdue")),
        )
    ) or 0

    return DashboardStats(
        total_students=int(total_students),
        active_students=int(active_students),
        total_collected_this_month=int(total_collected_this_month),
        total_pending=int(total_pending),
        total_overdue_balance=int(total_overdue_balance),
        payments_this_month=int(payments_this_month),
        pending_payments_this_month=int(pending_payments_this_month),
    )
