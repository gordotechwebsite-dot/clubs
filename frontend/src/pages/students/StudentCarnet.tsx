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

  return (
    <div>
      <div className="no-print">
        <PageHeader
          eyebrow="Carnet virtual"
          title={student.full_name}
          subtitle="Carnet oficial con vigencia de un año. Puede imprimirse o exportarse para envío digital."
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
        <Carnet student={student} />
        <div className="no-print text-xs uppercase tracking-widest text-slate-500 text-center">
          El carnet se imprime en formato PVC estándar (85 x 54 mm).
        </div>
      </div>
    </div>
  );
}
