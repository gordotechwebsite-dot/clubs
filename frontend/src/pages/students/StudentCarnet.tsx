import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { studentsApi } from "../../api";
import type { Student } from "../../types";
import PageHeader from "../../components/PageHeader";
import Carnet from "../../components/Carnet";

export default function StudentCarnet() {
  const { id } = useParams<{ id: string }>();
  const studentId = Number(id);
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    studentsApi
      .get(studentId)
      .then((r) => {
        if (!cancelled) setStudent(r.data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [studentId]);

  if (loading || !student) {
    return <div className="text-slate-500 uppercase tracking-widest text-xs">Cargando</div>;
  }

  const publicUrl = student.public_token
    ? `${window.location.origin}/carnet/${student.public_token}`
    : "";

  async function onCopy() {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div>
      <div className="no-print">
        <PageHeader
          eyebrow="Carnet virtual"
          title={student.full_name}
          subtitle="Carnet oficial con vigencia de un año. El QR lleva al carnet digital público, listo para imprimir en tarjetas físicas."
          actions={
            <>
              <Link to={`/estudiantes/${student.id}`} className="btn-ghost">
                Volver a la ficha
              </Link>
              <button className="btn-primary" onClick={() => window.print()}>
                Imprimir carnet
              </button>
            </>
          }
        />
      </div>

      <div className="flex flex-col items-center gap-6">
        <Carnet student={student} publicUrl={publicUrl} />

        {publicUrl ? (
          <div className="no-print w-full max-w-xl bg-white border border-slate-200 rounded-md p-5">
            <div className="text-[11px] uppercase tracking-widest text-slate-500 mb-2">
              Enlace público del carnet
            </div>
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              <input
                type="text"
                readOnly
                value={publicUrl}
                onFocus={(e) => e.currentTarget.select()}
                className="flex-1 border border-slate-300 rounded px-3 py-2 text-sm text-slate-800 bg-slate-50"
              />
              <button className="btn-ghost" onClick={onCopy}>
                {copied ? "Copiado" : "Copiar enlace"}
              </button>
              <a
                href={publicUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-ghost"
              >
                Abrir
              </a>
            </div>
            <div className="text-xs text-slate-500 mt-3">
              Codifique este enlace en un QR impreso sobre la tarjeta física. Al escanearlo, el portador accede al carnet digital oficial del deportista.
            </div>
          </div>
        ) : null}

        <div className="no-print text-xs uppercase tracking-widest text-slate-500 text-center">
          El carnet se imprime en formato PVC estándar (85 x 54 mm).
        </div>
      </div>
    </div>
  );
}
