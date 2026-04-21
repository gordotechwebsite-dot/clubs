import { useState, type FormEvent } from "react";
import { studentsApi } from "../api";
import type { Student, StudentInput } from "../types";
import { fileToDataUrl } from "../utils";

interface Props {
  student?: Student;
  onClose: () => void;
  onSaved: (s: Student) => void;
}

export default function StudentForm({ student, onClose, onSaved }: Props) {
  const [form, setForm] = useState<StudentInput>(() => ({
    full_name: student?.full_name || "",
    document_id: student?.document_id || "",
    birth_date: student?.birth_date || "",
    phone: student?.phone || "",
    address: student?.address || "",
    guardian_name: student?.guardian_name || "",
    guardian_phone: student?.guardian_phone || "",
    category: student?.category || "",
    sport: student?.sport || "Volleyball",
    photo_url: student?.photo_url || "",
    monthly_fee: student?.monthly_fee ?? 50000,
    is_active: student?.is_active ?? true,
    notes: student?.notes || "",
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof StudentInput>(key: K, value: StudentInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError("La foto no puede pesar más de 2 MB");
      return;
    }
    const url = await fileToDataUrl(file);
    set("photo_url", url);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      // Clean empty strings for optional fields so backend stores null
      const payload: StudentInput = { ...form };
      (Object.keys(payload) as Array<keyof StudentInput>).forEach((k) => {
        if (payload[k] === "") {
          // Leave monthly_fee and is_active alone; they are numeric/boolean
          if (k !== "monthly_fee" && k !== "is_active") {
            (payload as Record<string, unknown>)[k] = null;
          }
        }
      });
      const res = student
        ? await studentsApi.update(student.id, payload)
        : await studentsApi.create(payload);
      onSaved(res.data);
    } catch (err) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        "Error al guardar";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 z-40 flex items-start justify-center overflow-y-auto p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl my-8">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="font-display text-xl text-titanes-dark">
            {student ? "Editar estudiante" : "Nuevo estudiante"}
          </h2>
          <button className="text-slate-500 hover:text-slate-800" onClick={onClose}>
            ✕
          </button>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          {error && (
            <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex items-start gap-4">
            <div className="flex flex-col items-center gap-2">
              <div className="h-28 w-28 rounded-full bg-slate-100 overflow-hidden border-2 border-titanes-navy/30 flex items-center justify-center">
                {form.photo_url ? (
                  <img src={form.photo_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-slate-400 text-xs">Sin foto</span>
                )}
              </div>
              <label className="text-xs text-titanes-navy cursor-pointer hover:underline">
                Cambiar foto
                <input type="file" accept="image/*" className="hidden" onChange={onPhoto} />
              </label>
            </div>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="label">Nombre completo *</label>
                <input
                  className="input"
                  required
                  value={form.full_name}
                  onChange={(e) => set("full_name", e.target.value)}
                />
              </div>
              <div>
                <label className="label">Documento</label>
                <input
                  className="input"
                  value={form.document_id || ""}
                  onChange={(e) => set("document_id", e.target.value)}
                />
              </div>
              <div>
                <label className="label">Fecha de nacimiento</label>
                <input
                  type="date"
                  className="input"
                  value={form.birth_date || ""}
                  onChange={(e) => set("birth_date", e.target.value)}
                />
              </div>
              <div>
                <label className="label">Teléfono</label>
                <input
                  className="input"
                  value={form.phone || ""}
                  onChange={(e) => set("phone", e.target.value)}
                />
              </div>
              <div>
                <label className="label">Dirección</label>
                <input
                  className="input"
                  value={form.address || ""}
                  onChange={(e) => set("address", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Acudiente / representante</label>
              <input
                className="input"
                value={form.guardian_name || ""}
                onChange={(e) => set("guardian_name", e.target.value)}
              />
            </div>
            <div>
              <label className="label">Teléfono del acudiente</label>
              <input
                className="input"
                value={form.guardian_phone || ""}
                onChange={(e) => set("guardian_phone", e.target.value)}
              />
            </div>
            <div>
              <label className="label">Deporte</label>
              <input
                className="input"
                value={form.sport || ""}
                onChange={(e) => set("sport", e.target.value)}
                placeholder="Volleyball, Fútbol, ..."
              />
            </div>
            <div>
              <label className="label">Categoría / grupo</label>
              <input
                className="input"
                value={form.category || ""}
                onChange={(e) => set("category", e.target.value)}
                placeholder="Sub-15, Elite..."
              />
            </div>
            <div>
              <label className="label">Cuota mensual (COP)</label>
              <input
                type="number"
                min={0}
                step={1000}
                className="input"
                value={form.monthly_fee ?? 50000}
                onChange={(e) => set("monthly_fee", Number(e.target.value))}
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={!!form.is_active}
                  onChange={(e) => set("is_active", e.target.checked)}
                />
                Estudiante activo
              </label>
            </div>
            <div className="md:col-span-2">
              <label className="label">Notas</label>
              <textarea
                className="input"
                rows={3}
                value={form.notes || ""}
                onChange={(e) => set("notes", e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t">
            <button type="button" className="btn-ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
