import uuid
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import case, select, func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Student, Payment, Admin
from app.routers.payments import ensure_student_current_payment
from app.schemas import StudentCreate, StudentOut, StudentUpdate, StudentSummary
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
