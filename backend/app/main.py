import logging
import uuid

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text
from sqlalchemy.orm import Session

from app.config import settings
from app.database import Base, SessionLocal, engine
from app.models import Admin, Payment, Student
from app.routers import (
    admins,
    attendance,
    auth,
    backups,
    dashboard,
    payments,
    public,
    reports,
    students,
)
from app.routers.backups import ensure_daily_backup
from app.routers.payments import (
    _due_date_for,
    ensure_current_month_payments,
)
from app.security import hash_password

DEFAULT_ADMIN_SEEDS: list[dict[str, str]] = [
    {
        "email": "diego.sandoval@clubtitanes.com",
        "name": "Diego Sandoval",
        "password": "Titanes.Diego2026",
    },
    {
        "email": "nestor.burgos@clubtitanes.com",
        "name": "Nestor Burgos",
        "password": "Titanes.Nestor2026",
    },
]

logger = logging.getLogger("uvicorn")


def _migrate_schema() -> None:
    """Lightweight in-place migrations for SQLite."""
    inspector = inspect(engine)
    student_cols = {col["name"] for col in inspector.get_columns("students")}
    payment_cols = {col["name"] for col in inspector.get_columns("payments")}
    admin_cols = {col["name"] for col in inspector.get_columns("admins")}
    with engine.begin() as conn:
        if "public_token" not in student_cols:
            conn.execute(text("ALTER TABLE students ADD COLUMN public_token VARCHAR(64)"))
            conn.execute(
                text(
                    "CREATE UNIQUE INDEX IF NOT EXISTS ix_students_public_token "
                    "ON students(public_token)"
                )
            )
        if "due_date" not in payment_cols:
            conn.execute(text("ALTER TABLE payments ADD COLUMN due_date DATE"))
            conn.execute(
                text(
                    "CREATE INDEX IF NOT EXISTS ix_payments_due_date "
                    "ON payments(due_date)"
                )
            )
        if "role" not in admin_cols:
            conn.execute(
                text("ALTER TABLE admins ADD COLUMN role VARCHAR(32) DEFAULT 'director'")
            )
            conn.execute(text("UPDATE admins SET role = 'director' WHERE role IS NULL"))
            conn.execute(
                text("CREATE INDEX IF NOT EXISTS ix_admins_role ON admins(role)")
            )


def _integrity_check() -> None:
    """Verifica la integridad del SQLite al arrancar. Loguea alerta si falla."""
    try:
        with engine.connect() as conn:
            result = conn.execute(text("PRAGMA integrity_check")).scalar()
        if result != "ok":
            logger.error(
                "ALERTA: integrity_check de la base reporta: %s", result
            )
        else:
            logger.info("integrity_check de la base: ok")
    except Exception as exc:  # pragma: no cover
        logger.error("No se pudo ejecutar integrity_check: %s", exc)


def _init_db() -> None:
    Base.metadata.create_all(bind=engine)
    _migrate_schema()
    _integrity_check()
    db: Session = SessionLocal()
    try:
        existing = db.query(Admin).first()
        if existing is None:
            admin = Admin(
                email=settings.admin_email,
                name=settings.admin_name,
                password_hash=hash_password(settings.admin_password),
                role="director",
                is_active=True,
            )
            db.add(admin)
            db.commit()
            logger.info("Admin inicial creado: %s", settings.admin_email)

        for seed in DEFAULT_ADMIN_SEEDS:
            email = seed["email"].lower()
            has = db.query(Admin).filter(Admin.email == email).first()
            if has is None:
                db.add(
                    Admin(
                        email=email,
                        name=seed["name"],
                        password_hash=hash_password(seed["password"]),
                        role="director",
                        is_active=True,
                    )
                )
                db.commit()
                logger.info("Usuario director creado: %s", email)

        pending = db.query(Student).filter(Student.public_token.is_(None)).all()
        if pending:
            for s in pending:
                s.public_token = uuid.uuid4().hex
            db.commit()
            logger.info("Backfill de public_token para %d deportistas", len(pending))

        legacy = db.query(Payment).filter(Payment.due_date.is_(None)).all()
        if legacy:
            for p in legacy:
                p.due_date = _due_date_for(p.period_year, p.period_month)
            db.commit()
            logger.info("Backfill de due_date para %d pagos", len(legacy))

        created = ensure_current_month_payments(db)
        if created:
            logger.info("Auto-generados %d pagos del mes actual", created)
    finally:
        db.close()

    try:
        ensure_daily_backup()
    except Exception as exc:  # pragma: no cover
        logger.warning("No se pudo crear el backup diario al iniciar: %s", exc)


def create_app() -> FastAPI:
    app = FastAPI(title=f"{settings.club_name} API", version="1.0.0")

    origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins or ["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(auth.router)
    app.include_router(admins.router)
    app.include_router(students.router)
    app.include_router(payments.router)
    app.include_router(attendance.router)
    app.include_router(dashboard.router)
    app.include_router(reports.router)
    app.include_router(backups.router)
    app.include_router(public.router)

    @app.get("/api/health")
    def health():
        return {"status": "ok", "club": settings.club_name}

    @app.on_event("startup")
    def on_startup():
        _init_db()

    return app


app = create_app()
