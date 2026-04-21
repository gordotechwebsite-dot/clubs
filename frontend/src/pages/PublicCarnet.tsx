import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { publicApi } from "../api";
import type { PublicStudent } from "../types";
import Carnet from "../components/Carnet";

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

  const publicUrl = typeof window !== "undefined" ? window.location.href : "";

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md flex flex-col items-center">
        {state.kind === "loading" && (
          <div className="text-center text-xs uppercase tracking-widest text-slate-500">
            Cargando
          </div>
        )}

        {state.kind === "error" && (
          <div className="bg-white rounded-lg shadow p-8 text-center w-full">
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
            <Carnet
              student={{
                id: state.student.id,
                full_name: state.student.full_name,
                photo_url: state.student.photo_url,
                sport: state.student.sport,
                category: state.student.category,
                join_date: state.student.join_date,
              }}
              publicUrl={publicUrl}
            />

            {!state.student.is_active && (
              <div className="mt-6 bg-white border border-amber-200 rounded-lg p-4 text-center w-full">
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
