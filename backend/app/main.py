import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.config import settings
from app.database import Base, SessionLocal, engine
from app.models import Admin
from app.routers import auth, dashboard, payments, students
from app.security import hash_password

logger = logging.getLogger("uvicorn")


def _init_db() -> None:
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()
    try:
        existing = db.query(Admin).first()
        if existing is None:
            admin = Admin(
                email=settings.admin_email,
                name=settings.admin_name,
                password_hash=hash_password(settings.admin_password),
                is_active=True,
            )
            db.add(admin)
            db.commit()
            logger.info("Admin inicial creado: %s", settings.admin_email)
    finally:
        db.close()


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
    app.include_router(students.router)
    app.include_router(payments.router)
    app.include_router(dashboard.router)

    @app.get("/api/health")
    def health():
        return {"status": "ok", "club": settings.club_name}

    @app.on_event("startup")
    def on_startup():
        _init_db()

    return app


app = create_app()
