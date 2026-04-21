import os
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import settings


def _prepare_sqlite_path(url: str) -> str:
    """For SQLite URLs, ensure the parent directory exists; if not writable, fall back to ./data."""
    if not url.startswith("sqlite"):
        return url
    # sqlite:////absolute/path.db or sqlite:///relative/path.db
    prefix, path = url.split("sqlite:///", 1)
    if path.startswith("/"):
        # absolute
        directory = os.path.dirname(path)
        try:
            os.makedirs(directory, exist_ok=True)
            # test writability
            test_file = os.path.join(directory, ".write_test")
            with open(test_file, "w") as f:
                f.write("ok")
            os.remove(test_file)
            return url
        except (PermissionError, OSError):
            fallback_dir = os.path.abspath("./data")
            os.makedirs(fallback_dir, exist_ok=True)
            fallback_path = os.path.join(fallback_dir, os.path.basename(path))
            return f"sqlite:///{fallback_path}"
    else:
        directory = os.path.dirname(path)
        if directory:
            os.makedirs(directory, exist_ok=True)
        return url


DATABASE_URL = _prepare_sqlite_path(settings.database_url)

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
