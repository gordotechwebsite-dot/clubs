import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { publicApi } from "../api";
import type { PublicStudent } from "../types";
import { formatDateEs } from "../utils";

type State =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ok"; student: PublicStudent };

export default function PublicCarnet() {
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    if (!token) {
      Promise.resolve().then(() => {
        if (!cancelled) setState({ kind: "error", message: "Enlace inválido." });
      });
      return () => {
        cancelled = true;
      };
    }
    publicApi
      .carnet(token)
      .then((r) => {
        if (!cancelled) setState({ kind: "ok", student: r.data });
      })
      .catch(() => {
        if (!cancelled)
          setState({ kind: "error", message: "Carnet no encontrado." });
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const publicUrl =
    typeof window !== "undefined" ? window.location.href : "";

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center mb-6">
          <img src="/logo.png" alt="Club Titanes" className="h-12 w-12 object-contain" />
          <div className="ml-3 leading-tight">
            <div className="text-[10px] font-semibold uppercase tracking-[0.4em] text-slate-500">
              Club
            </div>
            <div
              style={{ fontFamily: "Oswald, sans-serif" }}
              className="text-2xl text-slate-900"
            >
              TITANES
            </div>
          </div>
        </div>

        {state.kind === "loading" && (
          <div className="text-center text-xs uppercase tracking-widest text-slate-500">
            Cargando
          </div>
        )}

        {state.kind === "error" && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-lg font-semibold text-slate-900">
              {state.message}
            </div>
            <div className="text-sm text-slate-500 mt-2">
              Solicite al club un enlace vigente.
            </div>
          </div>
        )}

        {state.kind === "ok" && (
          <>
            <div
              className="relative w-full aspect-[340/540] overflow-hidden text-white shadow-2xl rounded-md mx-auto"
              style={{
                background:
                  "linear-gradient(160deg, #0b1b4a 0%, #132a7a 50%, #7a0f14 80%, #b71c1c 100%)",
                maxWidth: 340,
              }}
            >
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at top right, rgba(255,255,255,0.15), transparent 55%)",
                }}
              />
              <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
                <img
                  src="/logo.png"
                  alt="Club Titanes"
                  className="h-14 w-14 object-contain"
                />
                <div className="text-right leading-tight">
                  <div className="text-[9px] font-semibold uppercase tracking-[0.4em] opacity-80">
                    Club
                  </div>
                  <div
                    style={{ fontFamily: "Oswald, sans-serif" }}
                    className="text-2xl"
                  >
                    TITANES
                  </div>
                  <div className="text-[9px] font-semibold uppercase tracking-[0.4em] opacity-80">
                    Soatá Boyacá
                  </div>
                </div>
              </div>

              <div className="absolute top-24 left-0 right-0 flex justify-center">
                <div className="h-32 w-32 rounded-full overflow-hidden ring-4 ring-white/80 bg-white/10 flex items-center justify-center">
                  {state.student.photo_url ? (
                    <img
                      src={state.student.photo_url}
                      alt={state.student.full_name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span
                      style={{ fontFamily: "Oswald, sans-serif" }}
                      className="text-3xl"
                    >
                      {state.student.full_name
                        .split(/\s+/)
                        .map((p) => p[0])
                        .filter(Boolean)
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()}
                    </span>
                  )}
                </div>
              </div>

              <div className="absolute left-0 right-0 top-64 px-6 text-center">
                <div
                  style={{ fontFamily: "Oswald, sans-serif" }}
                  className="text-xl leading-tight"
                >
                  {state.student.full_name}
                </div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.3em] opacity-80 mt-1">
                  {[state.student.sport, state.student.category]
                    .filter(Boolean)
                    .join(" / ") || "Deportista"}
                </div>
              </div>

              <div className="absolute bottom-28 left-6 right-6 grid grid-cols-2 gap-2 text-[10px]">
                <div>
                  <div className="opacity-70 uppercase tracking-[0.2em] text-[9px]">
                    ID
                  </div>
                  <div className="font-semibold">
                    {state.student.id.toString().padStart(4, "0")}
                  </div>
                </div>
                <div className="text-right">
                  <div className="opacity-70 uppercase tracking-[0.2em] text-[9px]">
                    Estado
                  </div>
                  <div className="font-semibold">
                    {state.student.is_active ? "Activo" : "No vigente"}
                  </div>
                </div>
                <div>
                  <div className="opacity-70 uppercase tracking-[0.2em] text-[9px]">
                    Ingreso
                  </div>
                  <div className="font-semibold">
                    {formatDateEs(state.student.join_date)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="opacity-70 uppercase tracking-[0.2em] text-[9px]">
                    Verificación
                  </div>
                  <div className="font-semibold">Enlace oficial</div>
                </div>
              </div>

              <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between">
                <div className="text-[9px] font-semibold uppercase tracking-[0.3em] opacity-80">
                  Registro oficial del club
                </div>
                <div className="bg-white p-1.5">
                  <QRCodeSVG value={publicUrl} size={60} />
                </div>
              </div>
            </div>

            {!state.student.is_active && (
              <div className="mt-6 bg-white border border-amber-200 rounded-lg p-4 text-center">
                <div className="text-amber-800 font-semibold">
                  Registro no vigente
                </div>
                <div className="text-sm text-slate-600 mt-1">
                  El deportista se encuentra archivado por el club.
                </div>
              </div>
            )}

            <div className="mt-6 text-center text-[11px] uppercase tracking-[0.3em] text-slate-500">
              Club Titanes · Soatá Boyacá
            </div>
          </>
        )}
      </div>
    </div>
  );
}
