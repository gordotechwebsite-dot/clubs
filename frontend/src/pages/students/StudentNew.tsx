import { Link } from "react-router-dom";
import PageHeader from "../../components/PageHeader";
import StudentForm from "../../components/StudentForm";

export default function StudentNew() {
  return (
    <div>
      <PageHeader
        eyebrow="Nueva inscripción"
        title="Registrar estudiante"
        subtitle="Completa los datos personales y deportivos para sumar al deportista a la plantilla oficial del club."
        actions={
          <Link to="/estudiantes" className="btn-ghost">
            Volver a la plantilla
          </Link>
        }
      />
      <StudentForm submitLabel="Inscribir estudiante" backTo="/estudiantes" />
    </div>
  );
}
