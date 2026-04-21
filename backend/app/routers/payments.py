from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Admin, Payment, Student
from app.schemas import (
    MarkPaidRequest,
    PaymentCreate,
    PaymentOut,
    PaymentUpdate,
)
from app.security import get_current_admin

router = APIRouter(prefix="/api/payments", tags=["payments"])


def _recompute_status(payment: Payment) -> None:
    today = date.today()
    period_end = date(payment.period_year, payment.period_month, 28)
    if payment.amount_paid >= payment.amount_due and payment.amount_due > 0:
        payment.status = "paid"
        if payment.paid_at is None:
            payment.paid_at = datetime.utcnow()
    elif payment.amount_paid > 0:
        payment.status = "partial"
    else:
        # no payment; overdue if period is in the past
        if (payment.period_year, payment.period_month) < (today.year, today.month):
            payment.status = "overdue"
        else:
            payment.status = "pending"


@router.get("", response_model=list[PaymentOut])
def list_payments(
    student_id: int | None = None,
    year: int | None = None,
    month: int | None = None,
    status_filter: str | None = None,
    sport: str | None = None,
    category: str | None = None,
    db: Session = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    q = db.query(Payment)
    if sport or category:
        q = q.join(Student, Payment.student_id == Student.id)
        if sport:
            q = q.filter(Student.sport == sport)
        if category:
            q = q.filter(Student.category == category)
    if student_id is not None:
        q = q.filter(Payment.student_id == student_id)
    if year is not None:
        q = q.filter(Payment.period_year == year)
    if month is not None:
        q = q.filter(Payment.period_month == month)
    if status_filter:
        q = q.filter(Payment.status == status_filter)
    q = q.order_by(Payment.period_year.desc(), Payment.period_month.desc(), Payment.id.desc())
    return q.all()


@router.post("", response_model=PaymentOut, status_code=status.HTTP_201_CREATED)
def create_payment(
    payload: PaymentCreate,
    db: Session = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    student = db.get(Student, payload.student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Estudiante no encontrado")

    existing = (
        db.query(Payment)
        .filter(
            Payment.student_id == payload.student_id,
            Payment.period_year == payload.period_year,
            Payment.period_month == payload.period_month,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=409,
            detail="Ya existe un pago para este estudiante en ese mes",
        )

    payment = Payment(**payload.model_dump())
    _recompute_status(payment)
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment


@router.put("/{payment_id}", response_model=PaymentOut)
def update_payment(
    payment_id: int,
    payload: PaymentUpdate,
    db: Session = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    payment = db.get(Payment, payment_id)
    if not payment:
        raise HTTPException(status_code=404, detail="Pago no encontrado")
    data = payload.model_dump(exclude_unset=True)
    status_override = data.pop("status", None)
    for k, v in data.items():
        setattr(payment, k, v)
    if status_override is not None:
        payment.status = status_override
    else:
        _recompute_status(payment)
    db.commit()
    db.refresh(payment)
    return payment


@router.post("/{payment_id}/mark-paid", response_model=PaymentOut)
def mark_paid(
    payment_id: int,
    payload: MarkPaidRequest,
    db: Session = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    payment = db.get(Payment, payment_id)
    if not payment:
        raise HTTPException(status_code=404, detail="Pago no encontrado")
    amount = payload.amount_paid if payload.amount_paid is not None else payment.amount_due
    payment.amount_paid = amount
    payment.paid_at = payload.paid_at or datetime.utcnow()
    if payload.payment_method is not None:
        payment.payment_method = payload.payment_method
    if payload.reference is not None:
        payment.reference = payload.reference
    if payload.notes is not None:
        payment.notes = payload.notes
    _recompute_status(payment)
    db.commit()
    db.refresh(payment)
    return payment


@router.post("/{payment_id}/mark-unpaid", response_model=PaymentOut)
def mark_unpaid(
    payment_id: int,
    db: Session = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    payment = db.get(Payment, payment_id)
    if not payment:
        raise HTTPException(status_code=404, detail="Pago no encontrado")
    payment.amount_paid = 0
    payment.paid_at = None
    payment.payment_method = None
    payment.reference = None
    _recompute_status(payment)
    db.commit()
    db.refresh(payment)
    return payment


@router.delete("/{payment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    payment = db.get(Payment, payment_id)
    if not payment:
        raise HTTPException(status_code=404, detail="Pago no encontrado")
    db.delete(payment)
    db.commit()
    return None


@router.post("/generate-month", response_model=list[PaymentOut])
def generate_month(
    year: int,
    month: int,
    db: Session = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    """Genera registros de pago pendiente para todos los estudiantes activos en el mes indicado."""
    if month < 1 or month > 12:
        raise HTTPException(status_code=400, detail="Mes inválido")
    students = db.query(Student).filter(Student.is_active.is_(True)).all()
    created: list[Payment] = []
    for s in students:
        exists = (
            db.query(Payment)
            .filter(
                Payment.student_id == s.id,
                Payment.period_year == year,
                Payment.period_month == month,
            )
            .first()
        )
        if exists:
            continue
        p = Payment(
            student_id=s.id,
            period_year=year,
            period_month=month,
            amount_due=s.monthly_fee,
            amount_paid=0,
        )
        _recompute_status(p)
        db.add(p)
        created.append(p)
    db.commit()
    for p in created:
        db.refresh(p)
    return created
