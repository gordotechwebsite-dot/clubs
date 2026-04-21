import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { studentsApi } from "../../api";
import type { Student } from "../../types";
import PageHeader from "../../components/PageHeader";
import StudentForm from "../../components/StudentForm";

export default function StudentEdit() {
  const { id } = useParams<{ id: string }>();
  const studentId = Number(id);
  const navigate = useNavigate();
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
      <PageHeader
        eyebrow="Edición"
        title={student.full_name}
        subtitle="Actualiza los datos oficiales del deportista."
        actions={
          <Link to={`/estudiantes/${student.id}`} className="btn-ghost">
            Volver a la ficha
          </Link>
        }
      />
      <StudentForm
        student={student}
        submitLabel="Guardar cambios"
        backTo={`/estudiantes/${student.id}`}
        onSaved={(s) => navigate(`/estudiantes/${s.id}`)}
      />
    </div>
  );
}
