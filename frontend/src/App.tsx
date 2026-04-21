import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth";
import Layout from "./components/Layout";
import Protected from "./components/Protected";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import PublicCarnet from "./pages/PublicCarnet";
import StudentsList from "./pages/students/StudentsList";
import StudentNew from "./pages/students/StudentNew";
import StudentDetail from "./pages/students/StudentDetail";
import StudentEdit from "./pages/students/StudentEdit";
import StudentCarnet from "./pages/students/StudentCarnet";
import StudentInvoice from "./pages/students/StudentInvoice";
import PaymentsList from "./pages/payments/PaymentsList";
import AttendanceSheet from "./pages/attendance/AttendanceSheet";
import AttendanceHistory from "./pages/attendance/AttendanceHistory";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/carnet/:token" element={<PublicCarnet />} />
        <Route
          element={
            <Protected>
              <Layout />
            </Protected>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/estudiantes" element={<StudentsList />} />
          <Route path="/estudiantes/nuevo" element={<StudentNew />} />
          <Route path="/estudiantes/:id" element={<StudentDetail />} />
          <Route path="/estudiantes/:id/editar" element={<StudentEdit />} />
          <Route path="/estudiantes/:id/carnet" element={<StudentCarnet />} />
          <Route path="/estudiantes/:id/factura" element={<StudentInvoice />} />
          <Route path="/pagos" element={<PaymentsList />} />
          <Route path="/asistencia" element={<AttendanceSheet />} />
          <Route path="/asistencia/historial" element={<AttendanceHistory />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
