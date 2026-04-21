from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Student
from app.schemas import StudentPublic

router = APIRouter(prefix="/api/public", tags=["public"])


@router.get("/carnet/{token}", response_model=StudentPublic)
def public_carnet(token: str, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.public_token == token).first()
    if not student:
        raise HTTPException(status_code=404, detail="Carnet no encontrado")
    return student
