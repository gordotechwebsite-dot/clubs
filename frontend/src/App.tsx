import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth";
import Layout from "./components/Layout";
import Protected from "./components/Protected";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Students from "./pages/Students";
import StudentDetail from "./pages/StudentDetail";
import Payments from "./pages/Payments";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <Protected>
              <Layout />
            </Protected>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/estudiantes" element={<Students />} />
          <Route path="/estudiantes/:id" element={<StudentDetail />} />
          <Route path="/pagos" element={<Payments />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
