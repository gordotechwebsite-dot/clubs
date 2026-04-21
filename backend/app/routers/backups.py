import logging
import os
import shutil
from datetime import datetime, timedelta
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Admin
from app.schemas import BackupItem
from app.security import require_director

logger = logging.getLogger("uvicorn")

router = APIRouter(prefix="/api/backups", tags=["backups"])

RETENTION_DAYS = 90


def _db_path() -> Path | None:
    from app.config import settings

    url = settings.database_url
    if not url.startswith("sqlite"):
        return None
    # sqlite:///path  → path absoluto
    raw = url.replace("sqlite:///", "", 1).replace("sqlite://", "", 1)
    if not raw:
        return None
    return Path(raw)


def _backup_dir() -> Path:
    db = _db_path()
    if db is not None:
        base = db.parent / "backups"
    else:
        base = Path("/tmp/club-titanes-backups")
    base.mkdir(parents=True, exist_ok=True)
    return base


def _list_backups() -> list[BackupItem]:
    bdir = _backup_dir()
    out: list[BackupItem] = []
    for f in bdir.iterdir():
        if not f.is_file() or not f.name.endswith(".db"):
            continue
        st = f.stat()
        out.append(
            BackupItem(
                filename=f.name,
                size_bytes=st.st_size,
                created_at=datetime.fromtimestamp(st.st_mtime),
            )
        )
    out.sort(key=lambda b: b.created_at, reverse=True)
    return out


def create_backup_now() -> BackupItem | None:
    src = _db_path()
    if src is None or not src.exists():
        return None
    ts = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    dst = _backup_dir() / f"titanes_{ts}.db"
    shutil.copy2(src, dst)
    _prune_old()
    st = dst.stat()
    return BackupItem(
        filename=dst.name,
        size_bytes=st.st_size,
        created_at=datetime.fromtimestamp(st.st_mtime),
    )


def _prune_old() -> None:
    cutoff = datetime.utcnow() - timedelta(days=RETENTION_DAYS)
    for f in _backup_dir().iterdir():
        if not f.is_file() or not f.name.endswith(".db"):
            continue
        if datetime.fromtimestamp(f.stat().st_mtime) < cutoff:
            try:
                f.unlink()
            except OSError:
                pass


def ensure_daily_backup() -> None:
    """Crea un respaldo si no existe uno de hoy."""
    today = datetime.utcnow().date()
    for b in _list_backups():
        if b.created_at.date() == today:
            return
    try:
        item = create_backup_now()
        if item:
            logger.info("Backup diario creado: %s", item.filename)
    except Exception as exc:  # pragma: no cover
        logger.warning("No se pudo crear el backup diario: %s", exc)


@router.get("", response_model=list[BackupItem])
def list_backups(
    _: Admin = Depends(require_director),
):
    return _list_backups()


@router.post("", response_model=BackupItem, status_code=status.HTTP_201_CREATED)
def trigger_backup(
    _: Admin = Depends(require_director),
    __: Session = Depends(get_db),
):
    item = create_backup_now()
    if item is None:
        raise HTTPException(status_code=400, detail="Base de datos no respaldable")
    return item


@router.get("/{filename}/download")
def download_backup(
    filename: str,
    _: Admin = Depends(require_director),
):
    # Evita traversal
    if "/" in filename or ".." in filename or not filename.endswith(".db"):
        raise HTTPException(status_code=400, detail="Nombre inválido")
    path = _backup_dir() / filename
    if not path.exists():
        raise HTTPException(status_code=404, detail="Respaldo no encontrado")
    return FileResponse(
        str(path),
        media_type="application/octet-stream",
        filename=filename,
    )


@router.delete("/{filename}", status_code=status.HTTP_204_NO_CONTENT)
def delete_backup(
    filename: str,
    _: Admin = Depends(require_director),
):
    if "/" in filename or ".." in filename or not filename.endswith(".db"):
        raise HTTPException(status_code=400, detail="Nombre inválido")
    path = _backup_dir() / filename
    if path.exists():
        try:
            os.remove(path)
        except OSError as exc:
            raise HTTPException(status_code=500, detail=str(exc))
    return None
