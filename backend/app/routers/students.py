import uuid
from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import case, select, func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Student, Payment, Admin
from app.routers.payments import ensure_student_current_payment
from app.schemas import (
    AccountStatement,
    AccountStatementLine,
    SearchStudent,
    StudentCreate,
    StudentOut,
    StudentSummary,
    StudentUpdate,
)
from app.security import get_current_admin

router = APIRouter(prefix="/api/students", tags=["students"])


def _summarize(db: Session, student: Student) -> StudentSummary:
    totals = db.execute(
        select(
            func.coalesce(func.sum(Payment.amount_due), 0),
            func.coalesce(func.sum(Payment.amount_paid), 0),
            func.coalesce(
                func.sum(
                    case(
                        (Payment.status.in_(("pending", "partial", "overdue")), 1),
                        else_=0,
                    )
                ),
                0,
            ),
        ).where(Payment.student_id == student.id)
    ).one()
    total_due, total_paid, pending_months = totals
    balance = int(total_due) - int(total_paid)
    data = StudentOut.model_validate(student).model_dump()
    return StudentSummary(
        **data,
        total_due=int(total_due),
        total_paid=int(total_paid),
        balance=balance,
        pending_months=int(pending_months),
    )


@router.get("", response_model=list[StudentSummary])
def list_students(
    search: str | None = None,
    sport: str | None = None,
    category: str | None = None,
    active_only: bool = False,
    db: Session = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    q = db.query(Student)
    if active_only:
        q = q.filter(Student.is_active.is_(True))
    if sport:
        q = q.filter(Student.sport == sport)
    if category:
        q = q.filter(Student.category == category)
    if search:
        like = f"%{search}%"
        q = q.filter(
            (Student.full_name.ilike(like))
            | (Student.document_id.ilike(like))
            | (Student.phone.ilike(like))
        )
    q = q.order_by(Student.full_name.asc())
    return [_summarize(db, s) for s in q.all()]


@router.post("", response_model=StudentSummary, status_code=status.HTTP_201_CREATED)
def create_student(
    payload: StudentCreate,
    db: Session = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    data = payload.model_dump(exclude_none=True)
    if "join_date" not in data:
        data["join_date"] = date.today()
    student = Student(**data, public_token=uuid.uuid4().hex)
    db.add(student)
    db.commit()
    db.refresh(student)
    if student.is_active:
        ensure_student_current_payment(db, student)
        db.refresh(student)
    return _summarize(db, student)


@router.get("/search", response_model=list[SearchStudent])
def search_students(
    q: str,
    limit: int = 10,
    db: Session = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    term = q.strip()
    if len(term) < 2:
        return []
    like = f"%{term}%"
    rows = (
        db.query(Student)
        .filter(
            (Student.full_name.ilike(like))
            | (Student.document_id.ilike(like))
            | (Student.phone.ilike(like))
            | (Student.guardian_name.ilike(like))
            | (Student.guardian_phone.ilike(like))
        )
        .order_by(Student.is_active.desc(), Student.full_name.asc())
        .limit(max(1, min(limit, 25)))
        .all()
    )
    return rows


@router.get("/{student_id}", response_model=StudentSummary)
def get_student(
    student_id: int,
    db: Session = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    student = db.get(Student, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Estudiante no encontrado")
    return _summarize(db, student)


@router.get("/{student_id}/statement", response_model=AccountStatement)
def account_statement(
    student_id: int,
    db: Session = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    student = db.get(Student, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Deportista no encontrado")

    payments = (
        db.query(Payment)
        .filter(Payment.student_id == student_id)
        .order_by(Payment.period_year.desc(), Payment.period_month.desc())
        .all()
    )
    lines: list[AccountStatementLine] = []
    total_due = 0
    total_paid = 0
    pending_months = 0
    overdue_months = 0
    for p in payments:
        balance = max(0, int(p.amount_due) - int(p.amount_paid))
        total_due += int(p.amount_due)
        total_paid += int(p.amount_paid)
        if p.status in ("pending", "partial", "overdue"):
            pending_months += 1
        if p.status == "overdue":
            overdue_months += 1
        lines.append(
            AccountStatementLine(
                payment_id=p.id,
                period_year=p.period_year,
                period_month=p.period_month,
                due_date=p.due_date,
                amount_due=int(p.amount_due),
                amount_paid=int(p.amount_paid),
                balance=balance,
                status=p.status,
                paid_at=p.paid_at,
            )
        )
    return AccountStatement(
        student_id=student.id,
        student_name=student.full_name,
        sport=student.sport,
        category=student.category,
        guardian_name=student.guardian_name,
        guardian_phone=student.guardian_phone,
        monthly_fee=int(student.monthly_fee),
        generated_at=datetime.utcnow(),
        total_due=total_due,
        total_paid=total_paid,
        balance=max(0, total_due - total_paid),
        pending_months=pending_months,
        overdue_months=overdue_months,
        lines=lines,
    )


@router.put("/{student_id}", response_model=StudentSummary)
def update_student(
    student_id: int,
    payload: StudentUpdate,
    db: Session = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    student = db.get(Student, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Estudiante no encontrado")
    was_active = student.is_active
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(student, k, v)
    db.commit()
    db.refresh(student)
    if student.is_active and not was_active:
        ensure_student_current_payment(db, student)
        db.refresh(student)
    return _summarize(db, student)


@router.delete("/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_student(
    student_id: int,
    db: Session = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    student = db.get(Student, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Estudiante no encontrado")
    db.delete(student)
    db.commit()
    return None
