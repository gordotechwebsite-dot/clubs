import { useCallback, useEffect, useState } from "react";
import { adminsApi } from "../../api";
import { useAuth } from "../../auth";
import type { Admin, AdminRole } from "../../types";
import PageHeader from "../../components/PageHeader";

const ROLE_LABELS: Record<AdminRole, string> = {
  director: "Director",
  staff: "Administrativo",
  coach: "Entrenador",
  viewer: "Lector",
};

const ROLES: AdminRole[] = ["director", "staff", "coach", "viewer"];

interface FormState {
  email: string;
  name: string;
  password: string;
  role: AdminRole;
}

const EMPTY_FORM: FormState = {
  email: "",
  name: "",
  password: "",
  role: "director",
};

export default function AdminsPage() {
  const { admin: currentAdmin } = useAuth();
  const [items, setItems] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editPwd, setEditPwd] = useState<string>("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminsApi.list();
      setItems(data);
    } catch {
      setError("No se pudo cargar la lista de usuarios.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (form.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    setSaving(true);
    try {
      await adminsApi.create(form);
      setForm(EMPTY_FORM);
      await load();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "No se pudo crear el usuario.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  async function onToggleActive(a: Admin) {
    if (a.id === currentAdmin?.id) return;
    try {
      await adminsApi.update(a.id, { is_active: !a.is_active });
      await load();
    } catch {
      setError("No se pudo actualizar el usuario.");
    }
  }

  async function onChangeRole(a: Admin, role: AdminRole) {
    try {
      await adminsApi.update(a.id, { role });
      await load();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "No se pudo cambiar el rol.";
      setError(msg);
    }
  }

  async function onSavePassword(a: Admin) {
    if (editPwd.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    try {
      await adminsApi.update(a.id, { password: editPwd });
      setEditingId(null);
      setEditPwd("");
      setError(null);
    } catch {
      setError("No se pudo actualizar la contraseña.");
    }
  }

  async function onDelete(a: Admin) {
    if (a.id === currentAdmin?.id) return;
    if (!confirm(`¿Desactivar al usuario ${a.name}?`)) return;
    try {
      await adminsApi.remove(a.id);
      await load();
    } catch {
      setError("No se pudo desactivar el usuario.");
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Administración"
        title="Usuarios y roles"
        subtitle="Gestiona quién tiene acceso al panel y con qué nivel de permisos."
      />

      {error && (
        <div className="card p-4 mb-6 text-sm text-rose-700">{error}</div>
      )}

      <div className="card p-4 mb-8">
        <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-700 mb-3">
          Nuevo usuario
        </div>
        <form onSubmit={onCreate} className="grid gap-3 md:grid-cols-5">
          <label className="text-sm md:col-span-2">
            <span className="block text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-1">
              Nombre
            </span>
            <input
              required
              className="input w-full"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>
          <label className="text-sm md:col-span-2">
            <span className="block text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-1">
              Correo
            </span>
            <input
              required
              type="email"
              className="input w-full"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </label>
          <label className="text-sm">
            <span className="block text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-1">
              Rol
            </span>
            <select
              className="input w-full"
              value={form.role}
              onChange={(e) =>
                setForm({ ...form, role: e.target.value as AdminRole })
              }
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm md:col-span-3">
            <span className="block text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-1">
              Contraseña temporal
            </span>
            <input
              required
              type="text"
              className="input w-full"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </label>
          <div className="md:col-span-2 flex items-end">
            <button
              type="submit"
              className="btn-primary w-full"
              disabled={saving}
            >
              {saving ? "Guardando..." : "Crear usuario"}
            </button>
          </div>
        </form>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="text-[10px] uppercase tracking-widest text-slate-500">
                <th className="text-left px-4 py-3">Nombre</th>
                <th className="text-left px-4 py-3">Correo</th>
                <th className="text-left px-4 py-3">Rol</th>
                <th className="text-left px-4 py-3">Estado</th>
                <th className="text-right px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-slate-500 text-xs uppercase tracking-widest"
                  >
                    Cargando
                  </td>
                </tr>
              ) : (
                items.map((a) => (
                  <tr key={a.id} className="border-t border-slate-100 align-top">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {a.name}
                      {a.id === currentAdmin?.id && (
                        <span className="ml-2 text-[10px] font-semibold uppercase tracking-widest text-emerald-700">
                          (tú)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{a.email}</td>
                    <td className="px-4 py-3">
                      <select
                        className="input"
                        value={a.role}
                        disabled={a.id === currentAdmin?.id}
                        onChange={(e) =>
                          onChangeRole(a, e.target.value as AdminRole)
                        }
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {ROLE_LABELS[r]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      {a.is_active ? (
                        <span className="inline-block text-[10px] font-semibold uppercase tracking-widest px-2 py-1 border rounded text-emerald-700 bg-emerald-50 border-emerald-200">
                          Activo
                        </span>
                      ) : (
                        <span className="inline-block text-[10px] font-semibold uppercase tracking-widest px-2 py-1 border rounded text-slate-600 bg-slate-50 border-slate-200">
                          Inactivo
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {editingId === a.id ? (
                        <div className="flex justify-end gap-2">
                          <input
                            className="input"
                            placeholder="Nueva contraseña"
                            value={editPwd}
                            onChange={(e) => setEditPwd(e.target.value)}
                          />
                          <button
                            className="btn-primary"
                            onClick={() => onSavePassword(a)}
                          >
                            Guardar
                          </button>
                          <button
                            className="btn-ghost"
                            onClick={() => {
                              setEditingId(null);
                              setEditPwd("");
                            }}
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2">
                          <button
                            className="btn-ghost"
                            onClick={() => {
                              setEditingId(a.id);
                              setEditPwd("");
                            }}
                          >
                            Cambiar contraseña
                          </button>
                          <button
                            className="btn-ghost"
                            disabled={a.id === currentAdmin?.id}
                            onClick={() => onToggleActive(a)}
                          >
                            {a.is_active ? "Desactivar" : "Activar"}
                          </button>
                          <button
                            className="btn-ghost text-rose-700"
                            disabled={a.id === currentAdmin?.id}
                            onClick={() => onDelete(a)}
                          >
                            Eliminar
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
