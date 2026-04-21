from datetime import datetime, date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Admin, Payment, Student
from app.routers.payments import ensure_month_payments
from app.schemas import MonthlyReport, SportBreakdown
from app.security import get_current_admin

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("/monthly", response_model=MonthlyReport)
def monthly_report(
    year: int,
    month: int,
    db: Session = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    if month < 1 or month > 12:
        raise HTTPException(status_code=400, detail="Mes inválido")
    today = date.today()
    if year == today.year and month == today.month:
        ensure_month_payments(db, year, month)

    base = db.query(Payment).filter(
        Payment.period_year == year,
        Payment.period_month == month,
    )

    total_due = db.scalar(
        select(func.coalesce(func.sum(Payment.amount_due), 0)).where(
            Payment.period_year == year, Payment.period_month == month
        )
    ) or 0
    total_paid = db.scalar(
        select(func.coalesce(func.sum(Payment.amount_paid), 0)).where(
            Payment.period_year == year, Payment.period_month == month
        )
    ) or 0
    total_overdue = db.scalar(
        select(func.coalesce(func.sum(Payment.amount_due - Payment.amount_paid), 0)).where(
            Payment.period_year == year,
            Payment.period_month == month,
            Payment.status == "overdue",
        )
    ) or 0
    total_pending = max(0, int(total_due) - int(total_paid))

    payments_paid = base.filter(Payment.status == "paid").count()
    payments_overdue = base.filter(Payment.status == "overdue").count()
    payments_pending = base.filter(
        Payment.status.in_(("pending", "partial", "overdue"))
    ).count()

    sports_rows = (
        db.query(
            Student.sport,
            func.count(func.distinct(Student.id)).filter(Student.is_active.is_(True)),
            func.coalesce(func.sum(Payment.amount_due), 0),
            func.coalesce(func.sum(Payment.amount_paid), 0),
        )
        .outerjoin(
            Payment,
            (Payment.student_id == Student.id)
            & (Payment.period_year == year)
            & (Payment.period_month == month),
        )
        .group_by(Student.sport)
        .all()
    )

    overdue_by_sport = dict(
        db.query(
            Student.sport,
            func.coalesce(func.sum(Payment.amount_due - Payment.amount_paid), 0),
        )
        .join(Payment, Payment.student_id == Student.id)
        .filter(
            Payment.period_year == year,
            Payment.period_month == month,
            Payment.status == "overdue",
        )
        .group_by(Student.sport)
        .all()
    )

    by_sport: list[SportBreakdown] = []
    for sport, active, due, paid in sports_rows:
        due_i = int(due or 0)
        paid_i = int(paid or 0)
        by_sport.append(
            SportBreakdown(
                sport=sport or "Sin deporte",
                active_students=int(active or 0),
                amount_due=due_i,
                amount_paid=paid_i,
                balance=max(0, due_i - paid_i),
                overdue_balance=int(overdue_by_sport.get(sport, 0) or 0),
            )
        )
    by_sport.sort(key=lambda x: x.sport)

    return MonthlyReport(
        year=year,
        month=month,
        generated_at=datetime.utcnow(),
        total_due=int(total_due),
        total_collected=int(total_paid),
        total_pending=total_pending,
        total_overdue=int(total_overdue),
        payments_paid=payments_paid,
        payments_pending=payments_pending,
        payments_overdue=payments_overdue,
        by_sport=by_sport,
    )
