from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Admin, Attendance, Student
from app.schemas import (
    AttendanceBulkRequest,
    AttendanceCreate,
    AttendanceOut,
    AttendanceSheetEntry,
    AttendanceSheetOut,
    AttendanceStats,
    AttendanceUpdate,
)
from app.security import get_current_admin

router = APIRouter(prefix="/api/attendance", tags=["attendance"])

VALID_STATUSES = {"present", "absent", "late", "excused"}


def _validate_status(value: str) -> str:
    if value not in VALID_STATUSES:
        raise HTTPException(
            status_code=422,
            detail=f"Estado inválido. Use uno de {sorted(VALID_STATUSES)}",
        )
    return value


@router.get("", response_model=list[AttendanceOut])
def list_attendance(
    student_id: int | None = None,
    session_date: date | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    db: Session = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    q = db.query(Attendance)
    if student_id is not None:
        q = q.filter(Attendance.student_id == student_id)
    if session_date is not None:
        q = q.filter(Attendance.session_date == session_date)
    if date_from is not None:
        q = q.filter(Attendance.session_date >= date_from)
    if date_to is not None:
        q = q.filter(Attendance.session_date <= date_to)
    q = q.order_by(Attendance.session_date.desc(), Attendance.id.desc())
    return q.all()


@router.get("/sheet", response_model=AttendanceSheetOut)
def attendance_sheet(
    session_date: date,
    sport: str | None = None,
    category: str | None = None,
    only_active: bool = True,
    db: Session = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    sq = db.query(Student)
    if only_active:
        sq = sq.filter(Student.is_active == True)  # noqa: E712
    if sport:
        sq = sq.filter(Student.sport == sport)
    if category:
        sq = sq.filter(Student.category == category)
    students = sq.order_by(Student.full_name.asc()).all()

    existing = (
        db.query(Attendance)
        .filter(Attendance.session_date == session_date)
        .all()
    )
    by_student = {a.student_id: a for a in existing}

    entries: list[AttendanceSheetEntry] = []
    for s in students:
        a = by_student.get(s.id)
        entries.append(
            AttendanceSheetEntry(
                student_id=s.id,
                student_name=s.full_name,
                sport=s.sport,
                category=s.category,
                attendance_id=a.id if a else None,
                status=a.status if a else None,
                notes=a.notes if a else None,
            )
        )
    return AttendanceSheetOut(session_date=session_date, entries=entries)


@router.get("/stats/{student_id}", response_model=AttendanceStats)
def student_attendance_stats(
    student_id: int,
    db: Session = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    student = db.get(Student, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Estudiante no encontrado")
    rows = db.query(Attendance).filter(Attendance.student_id == student_id).all()
    total = len(rows)
    present = sum(1 for r in rows if r.status == "present")
    absent = sum(1 for r in rows if r.status == "absent")
    late = sum(1 for r in rows if r.status == "late")
    excused = sum(1 for r in rows if r.status == "excused")
    effective_present = present + late
    rate = (effective_present / total * 100.0) if total else 0.0
    return AttendanceStats(
        total_sessions=total,
        present=present,
        absent=absent,
        late=late,
        excused=excused,
        attendance_rate=round(rate, 2),
    )


@router.post("", response_model=AttendanceOut, status_code=status.HTTP_201_CREATED)
def create_attendance(
    payload: AttendanceCreate,
    db: Session = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    _validate_status(payload.status)
    student = db.get(Student, payload.student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Estudiante no encontrado")
    existing = (
        db.query(Attendance)
        .filter(
            Attendance.student_id == payload.student_id,
            Attendance.session_date == payload.session_date,
        )
        .first()
    )
    if existing:
        existing.status = payload.status
        existing.notes = payload.notes
        db.commit()
        db.refresh(existing)
        return existing
    a = Attendance(**payload.model_dump())
    db.add(a)
    db.commit()
    db.refresh(a)
    return a


@router.post("/bulk", response_model=list[AttendanceOut])
def bulk_upsert(
    payload: AttendanceBulkRequest,
    db: Session = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    if not payload.entries:
        return []
    results: list[Attendance] = []
    for item in payload.entries:
        _validate_status(item.status)
        student = db.get(Student, item.student_id)
        if not student:
            continue
        existing = (
            db.query(Attendance)
            .filter(
                Attendance.student_id == item.student_id,
                Attendance.session_date == payload.session_date,
            )
            .first()
        )
        if existing:
            existing.status = item.status
            existing.notes = item.notes
            results.append(existing)
        else:
            a = Attendance(
                student_id=item.student_id,
                session_date=payload.session_date,
                status=item.status,
                notes=item.notes,
            )
            db.add(a)
            results.append(a)
    db.commit()
    for a in results:
        db.refresh(a)
    return results


@router.put("/{attendance_id}", response_model=AttendanceOut)
def update_attendance(
    attendance_id: int,
    payload: AttendanceUpdate,
    db: Session = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    a = db.get(Attendance, attendance_id)
    if not a:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    data = payload.model_dump(exclude_unset=True)
    if "status" in data and data["status"] is not None:
        _validate_status(data["status"])
    for k, v in data.items():
        setattr(a, k, v)
    db.commit()
    db.refresh(a)
    return a


@router.delete("/{attendance_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_attendance(
    attendance_id: int,
    db: Session = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    a = db.get(Attendance, attendance_id)
    if not a:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    db.delete(a)
    db.commit()
    return None
