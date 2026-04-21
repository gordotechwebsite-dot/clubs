import { Link } from "react-router-dom";
import PageHeader from "../../components/PageHeader";
import StudentForm from "../../components/StudentForm";

export default function StudentNew() {
  return (
    <div>
      <PageHeader
        eyebrow="Nueva inscripción"
        title="Registrar estudiante"
        subtitle="Completa los datos personales y deportivos para sumar al deportista al roster oficial del club."
        actions={
          <Link to="/estudiantes" className="btn-ghost">
            Volver al roster
          </Link>
        }
      />
      <StudentForm submitLabel="Inscribir estudiante" backTo="/estudiantes" />
    </div>
  );
}
