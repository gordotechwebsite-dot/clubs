import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { studentsApi } from "../api";
import type { Student, StudentInput } from "../types";
import { CATEGORIES, fileToDataUrl, SPORTS } from "../utils";
import StudentPhoto from "./StudentPhoto";

interface Props {
  student?: Student;
  submitLabel: string;
  backTo: string;
  onSaved?: (s: Student) => void;
}

export default function StudentForm({ student, submitLabel, backTo, onSaved }: Props) {
  const navigate = useNavigate();
  const [form, setForm] = useState<StudentInput>(() => ({
    full_name: student?.full_name || "",
    document_id: student?.document_id || "",
    birth_date: student?.birth_date || "",
    phone: student?.phone || "",
    address: student?.address || "",
    guardian_name: student?.guardian_name || "",
    guardian_phone: student?.guardian_phone || "",
    category: student?.category || "",
    sport: student?.sport || SPORTS[0],
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
      const payload: StudentInput = { ...form };
      (Object.keys(payload) as Array<keyof StudentInput>).forEach((k) => {
        if (payload[k] === "") {
          if (k !== "monthly_fee" && k !== "is_active") {
            (payload as Record<string, unknown>)[k] = null;
          }
        }
      });
      const res = student
        ? await studentsApi.update(student.id, payload)
        : await studentsApi.create(payload);
      if (onSaved) {
        onSaved(res.data);
      } else {
        navigate(`/estudiantes/${res.data.id}`);
      }
    } catch (err) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        "No se pudo guardar el registro";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      {error && (
        <div className="border-l-4 border-rose-600 bg-rose-50 text-rose-800 text-sm px-4 py-3">
          {error}
        </div>
      )}

      <section className="card p-6">
        <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-titanes-red mb-3">
          Identificación
        </div>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex flex-col items-center gap-3">
            <StudentPhoto url={form.photo_url} name={form.full_name || "Nuevo"} size="lg" />
            <label className="btn-ghost cursor-pointer">
              <span>Subir foto</span>
              <input type="file" accept="image/*" className="hidden" onChange={onPhoto} />
            </label>
          </div>
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label">Nombre completo</label>
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
      </section>

      <section className="card p-6">
        <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-titanes-red mb-3">
          Acudiente y disciplina
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Acudiente o representante</label>
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
            <select
              className="input"
              value={form.sport || ""}
              onChange={(e) => set("sport", e.target.value)}
              required
            >
              {SPORTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Categoría</label>
            <select
              className="input"
              value={form.category || ""}
              onChange={(e) => set("category", e.target.value)}
              required
            >
              <option value="">Seleccionar</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="card p-6">
        <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-titanes-red mb-3">
          Condiciones del club
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                className="h-4 w-4 accent-titanes-navy"
                checked={!!form.is_active}
                onChange={(e) => set("is_active", e.target.checked)}
              />
              Estudiante activo en la plantilla
            </label>
          </div>
          <div className="md:col-span-2">
            <label className="label">Notas internas</label>
            <textarea
              className="input"
              rows={3}
              value={form.notes || ""}
              onChange={(e) => set("notes", e.target.value)}
            />
          </div>
        </div>
      </section>

      <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200">
        <button
          type="button"
          className="btn-ghost"
          onClick={() => navigate(backTo)}
        >
          Cancelar
        </button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "Guardando" : submitLabel}
        </button>
      </div>
    </form>
  );
}
