# Club Titanes · Plataforma de gestión

Plataforma administrativa para el **Club Titanes Soatá**. Permite a los directores:

- Mantener el directorio de estudiantes con datos personales y foto
- Llevar el control mensual de pagos ($50.000 COP por defecto)
- Generar facturas en PDF y compartirlas por WhatsApp
- Emitir un carnet virtual con QR para cada estudiante
- Ver un tablero con deuda acumulada, cobros del mes y atrasos

## Stack

- **Backend:** FastAPI + SQLAlchemy + SQLite (Poetry, Python 3.11+)
- **Frontend:** React + Vite + TypeScript + Tailwind CSS
- **Auth:** JWT (admin único con email/contraseña)
- **PDFs:** `jspdf` generados en el cliente
- **Carnet QR:** `qrcode.react`

## Estructura

```
backend/   # API FastAPI (poetry)
frontend/  # SPA React + Vite
```

## Desarrollo local

### Backend

```bash
cd backend
poetry install
poetry run uvicorn app.main:app --reload --port 8000
```

El admin inicial se crea automáticamente en el primer arranque con los valores
definidos en `.env` (ver `.env.example`).

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Vite proxea `/api` a `http://127.0.0.1:8000`.

Por defecto el admin es:
- Email: `admin@clubtitanes.com`
- Contraseña: `titanes2026`

> ⚠️ **Cambia la contraseña** antes de salir a producción desde la variable
> de entorno `ADMIN_PASSWORD` (ver `backend/.env.example`).

## Despliegue

- **Backend:** Fly.io con volumen persistente para SQLite (`/data/titanes.db`).
- **Frontend:** sitio estático (`npm run build` → `dist/`) apuntando a la URL
  del backend mediante `VITE_API_URL`.

## Licencia

Uso interno del Club Titanes Soatá.
