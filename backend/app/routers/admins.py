from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Admin
from app.schemas import AdminCreate, AdminOut, AdminUpdate
from app.security import hash_password, require_director

router = APIRouter(prefix="/api/admins", tags=["admins"])

ALLOWED_ROLES = {"director", "staff", "coach", "viewer"}


@router.get("", response_model=list[AdminOut])
def list_admins(
    db: Session = Depends(get_db),
    _: Admin = Depends(require_director),
):
    return db.query(Admin).order_by(Admin.name.asc()).all()


@router.post("", response_model=AdminOut, status_code=status.HTTP_201_CREATED)
def create_admin(
    payload: AdminCreate,
    db: Session = Depends(get_db),
    _: Admin = Depends(require_director),
):
    if payload.role not in ALLOWED_ROLES:
        raise HTTPException(status_code=400, detail="Rol inválido")
    email = payload.email.lower().strip()
    existing = db.query(Admin).filter(Admin.email == email).first()
    if existing:
        raise HTTPException(status_code=409, detail="Ya existe un usuario con ese correo")
    admin = Admin(
        email=email,
        name=payload.name.strip(),
        password_hash=hash_password(payload.password),
        role=payload.role,
        is_active=True,
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    return admin


@router.put("/{admin_id}", response_model=AdminOut)
def update_admin(
    admin_id: int,
    payload: AdminUpdate,
    db: Session = Depends(get_db),
    current: Admin = Depends(require_director),
):
    admin = db.get(Admin, admin_id)
    if not admin:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    data = payload.model_dump(exclude_unset=True)
    if "role" in data:
        if data["role"] not in ALLOWED_ROLES:
            raise HTTPException(status_code=400, detail="Rol inválido")
        if admin.id == current.id and data["role"] != "director":
            raise HTTPException(
                status_code=400,
                detail="No puedes quitarte a ti mismo el rol de director",
            )
    if "is_active" in data and admin.id == current.id and data["is_active"] is False:
        raise HTTPException(status_code=400, detail="No puedes desactivar tu propio usuario")

    if "password" in data:
        pwd = data.pop("password")
        if pwd:
            admin.password_hash = hash_password(pwd)

    for k, v in data.items():
        if v is not None:
            setattr(admin, k, v)

    db.commit()
    db.refresh(admin)
    return admin


@router.delete("/{admin_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_admin(
    admin_id: int,
    db: Session = Depends(get_db),
    current: Admin = Depends(require_director),
):
    admin = db.get(Admin, admin_id)
    if not admin:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if admin.id == current.id:
        raise HTTPException(status_code=400, detail="No puedes eliminar tu propio usuario")
    # Mantener integridad: archivar en lugar de borrar (is_active=False)
    admin.is_active = False
    db.commit()
    return None
